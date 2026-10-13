import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../components/admin/AdminLayout";

import {
  getProductVariants,
  updateProductVariant,
  updateVariantMainImage,
  updateProductColorImages,
} from "../api/services/adminVariantService";
import "./AdminEditVariant.css";

function AdminEditVariant() {
  const { productId, variantId } = useParams();
  const navigate = useNavigate();

  const [variant, setVariant] = useState(null);

  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");

  const [selectedMainImage, setSelectedMainImage] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [savingImages, setSavingImages] = useState(false);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatingImage, setUpdatingImage] = useState(false);

  const [error, setError] = useState("");

  // ================= FETCH VARIANT =================

  useEffect(() => {
    const fetchVariant = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getProductVariants(productId);

        const selectedVariant = (response.variants || []).find(
          (item) => item._id === variantId,
        );

        if (!selectedVariant) {
          setError("Variant not found");
          return;
        }

        setVariant(selectedVariant);

        setColor(selectedVariant.color || "");
        setSize(selectedVariant.size || "");
        setStock(selectedVariant.stock ?? "");
        setPrice(selectedVariant.price ?? "");
        setSku(selectedVariant.sku || "");

        setSelectedMainImage(
          selectedVariant.mainImage || selectedVariant.productImages?.[0] || "",
        );
      } catch (error) {
        console.error("Fetch variant error:", error);

        setError(error.response?.data?.message || "Failed to load variant");
      } finally {
        setLoading(false);
      }
    };

    fetchVariant();
  }, [productId, variantId]);

  // ================= SELECT MAIN IMAGE =================

  const handleSelectMainImage = async (image) => {
    if (image === selectedMainImage) {
      return;
    }

    try {
      setUpdatingImage(true);
      setError("");

      const response = await updateVariantMainImage(
        productId,
        variant.color,
        image,
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to update main image");
      }

      setSelectedMainImage(image);

      setVariant((previousVariant) => ({
        ...previousVariant,
        mainImage: image,
      }));
    } catch (error) {
      console.error("Update main image error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update main image",
      );
    } finally {
      setUpdatingImage(false);
    }
  };

  
  // ================= REMOVE IMAGE =================

  const handleRemoveImage = (imageToRemove) => {
    const updatedImages = variant.productImages.filter(
      (image) => image !== imageToRemove
    );

    setVariant((previousVariant) => ({
      ...previousVariant,
      productImages: updatedImages,
    }));

    if (selectedMainImage === imageToRemove) {
      setSelectedMainImage(updatedImages[0] || "");
    }

    setError("");
  };

  // ================= ADD NEW IMAGES =================

  const handleAddImages = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (
      variant.productImages.length +
        newImages.length +
        selectedFiles.length >
      5
    ) {
      setError("A color can have a maximum of 5 images.");
      event.target.value = "";
      return;
    }

    setNewImages((previousImages) => [
      ...previousImages,
      ...selectedFiles,
    ]);

    setError("");
    event.target.value = "";
  };

  // ================= REMOVE NEW IMAGE =================

  const handleRemoveNewImage = (indexToRemove) => {
    setNewImages((previousImages) =>
      previousImages.filter(
        (_, index) => index !== indexToRemove
      )
    );
  };

  // ================= SAVE COLOR IMAGES =================

  const handleSaveImages = async () => {
    const existingImages = variant.productImages || [];
    const totalImages = existingImages.length + newImages.length;

    if (totalImages < 3 || totalImages > 5) {
      setError("Each color must have between 3 and 5 images.");
      return;
    }

    try {
      setSavingImages(true);
      setError("");

      const response = await updateProductColorImages(
        productId,
        variant.color,
        existingImages,
        newImages
      );

      if (!response.success) {
        throw new Error(
          response.message || "Failed to save images"
        );
      }

      const updatedVariants = response.variants || [];
      const updatedVariant = updatedVariants.find(
        (item) => item._id === variantId
      );

      const savedImages =
        updatedVariant?.productImages || existingImages;

      setVariant((previousVariant) => ({
        ...previousVariant,
        productImages: savedImages,
        mainImage:
          updatedVariant?.mainImage || savedImages[0] || "",
      }));

      setSelectedMainImage(
        updatedVariant?.mainImage || savedImages[0] || ""
      );

      setNewImages([]);

      if (
        updatedVariant?.mainImage &&
        updatedVariant.productImages?.includes(
          selectedMainImage
        )
      ) {
        await updateVariantMainImage(
          productId,
          variant.color,
          selectedMainImage
        );

        setVariant((previousVariant) => ({
          ...previousVariant,
          mainImage: selectedMainImage,
        }));
      }
    } catch (error) {
      console.error("Save color images error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save images"
      );
    } finally {
      setSavingImages(false);
    }
  };

  // ================= UPDATE VARIANT =================

  const handleUpdate = async () => {
    const trimmedColor = color.trim();
    const trimmedSku = sku.trim();

    if (!trimmedColor) {
      setError("Color is required");
      return;
    }

    if (size === "" || Number(size) <= 0) {
      setError("Valid size is required");
      return;
    }

    if (stock === "" || Number(stock) < 0) {
      setError("Valid stock is required");
      return;
    }

    if (price === "" || Number(price) < 0) {
      setError("Valid price is required");
      return;
    }

    if (!trimmedSku) {
      setError("SKU is required");
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const data = await updateProductVariant(variantId, {
        color: trimmedColor,
        size: Number(size),
        stock: Number(stock),
        price: Number(price),
        sku: trimmedSku,
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to update variant");
      }

      navigate(`/admin/products/${productId}`, {
        state: {
          variantUpdated: true,
        },
      });
    } catch (error) {
      console.error("Update variant error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update variant",
      );
    } finally {
      setUpdating(false);
    }
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-edit-variant">
          <p>Loading variant...</p>
        </div>
      </AdminLayout>
    );
  }

  // ================= ERROR =================

  if (error && !variant) {
    return (
      <AdminLayout>
        <div className="admin-edit-variant">
          <button
            className="back-button"
            onClick={() => navigate(`/admin/products/${productId}`)}
          >
            ← Back to Product
          </button>

          <p className="error-message">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  // ================= PAGE =================

  return (
    <AdminLayout>
      <div className="admin-edit-variant">
        <div className="edit-variant-header">
          <button
            className="back-button"
            onClick={() => navigate(`/admin/products/${productId}`)}
          >
            ← Back to Product
          </button>

          <div>
            <h1>Edit Variant</h1>

            <p>Update the variant details.</p>
          </div>
        </div>

        {/* ================= VARIANT IMAGES ================= */}

        <div className="variant-edit-images">
          <h3>Variant Images</h3>

          <p className="image-help-text">
            Select an image to make it the main image.
            You can add or remove images below.
          </p>

          <div className="variant-edit-image-list">
            {(variant?.productImages || []).map(
              (image, index) => {
                const isMain = image === selectedMainImage;

                return (
                  <div
                    key={`${image}-${index}`}
                    className="variant-image-wrapper"
                  >
                    <button
                      type="button"
                      className={
                        isMain
                          ? "variant-image-select selected"
                          : "variant-image-select"
                      }
                      onClick={() => setSelectedMainImage(image)}
                      disabled={savingImages || updatingImage}
                    >
                      <img
                        src={image}
                        alt={`${variant.color} ${index + 1}`}
                        className="variant-edit-image"
                      />

                      {isMain && (
                        <span className="main-image-badge">
                          Main Image
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      className="remove-variant-image"
                      onClick={() => handleRemoveImage(image)}
                      disabled={savingImages || updatingImage}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                );
              }
            )}

            {newImages.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="variant-image-wrapper"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`New image ${index + 1}`}
                  className="variant-edit-image"
                />

                <button
                  type="button"
                  className="remove-variant-image"
                  onClick={() => handleRemoveNewImage(index)}
                  disabled={savingImages}
                  aria-label={`Remove new image ${index + 1}`}
                >
                  ×
                </button>

                <span className="new-image-label">New</span>
              </div>
            ))}
          </div>

          <p className="image-help-text">
            {variant?.productImages?.length + newImages.length} of 5 images selected.
            Minimum 3 images required.
          </p>

          <label className="add-variant-images-button">
            + Add Images
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleAddImages}
              disabled={
                savingImages ||
                (variant?.productImages?.length || 0) +
                  newImages.length >=
                  5
              }
            />
          </label>

          <button
            type="button"
            className="update-button"
            onClick={handleSaveImages}
            disabled={savingImages || updatingImage}
          >
            {savingImages ? "Saving Images..." : "Save Images"}
          </button>

          {savingImages && (
            <p className="image-updating-text">
              Saving images for all sizes of this color...
            </p>
          )}
        </div>


        {/* ================= FORM ================= */}

        <div className="edit-variant-card">
          <div className="form-group">
            <label>Color</label>

            <input
              type="text"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setError("");
              }}
            />
          </div>

          <div className="form-group">
            <label>Size</label>

            <input
              type="number"
              value={size}
              onChange={(e) => {
                setSize(e.target.value);
                setError("");
              }}
            />
          </div>

          <div className="form-group">
            <label>Stock</label>

            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => {
                setStock(e.target.value);
                setError("");
              }}
            />
          </div>

          <div className="form-group">
            <label>Price</label>

            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setError("");
              }}
            />
          </div>

          <div className="form-group">
            <label>SKU</label>

            <input
              type="text"
              value={sku}
              onChange={(e) => {
                setSku(e.target.value);
                setError("");
              }}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="edit-variant-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(`/admin/products/${productId}`)}
              disabled={updating || updatingImage}
            >
              Cancel
            </button>

            <button
              type="button"
              className="update-button"
              onClick={handleUpdate}
              disabled={updating || updatingImage}
            >
              {updating ? "Updating..." : "Update Variant"}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminEditVariant;
