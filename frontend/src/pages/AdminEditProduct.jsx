import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cropper from "react-easy-crop";

import AdminLayout from "../components/admin/AdminLayout";
import NotificationModal from "../components/common/NotificationModal";

import {
  getAdminCategories,
  getAdminProducts,
  updateAdminProduct,
} from "../api/services/adminService";

import "./AdminEditProduct.css";

function AdminEditProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [basePrice, setBasePrice] = useState("");

  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);

  const [cropQueue, setCropQueue] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [cropImage, setCropImage] = useState(null);

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  const [error, setError] = useState("");
  const [notification, setNotification] = useState(null);

  // ================= FETCH PRODUCT =================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productsResponse, categoriesResponse] =
          await Promise.all([
            getAdminProducts({
              page: 1,
              limit: 100,
            }),
            getAdminCategories({
              page: 1,
              limit: 100,
            }),
          ]);

        const products =
          productsResponse.products || [];

        const foundProduct = products.find(
          (product) => product._id === productId
        );

        if (!foundProduct) {
          setError("Product not found");
          return;
        }

        setProductName(foundProduct.name || "");
        setProductDescription(
          foundProduct.description || ""
        );

        setProductCategory(
          foundProduct.categoryId?._id ||
            foundProduct.categoryId ||
            ""
        );

        setBasePrice(
          foundProduct.basePrice ?? ""
        );

        setImages(foundProduct.images || []);

        setCategories(
          categoriesResponse.categories || []
        );
      } catch (error) {
        console.error(
          "Fetch edit product error:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load product"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  // ================= CROP =================

  const createCroppedImage = async (
    imageSrc,
    pixelCrop
  ) => {
    const image = new Image();

    image.src = imageSrc;

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          const file = new File(
            [blob],
            `product-image-${Date.now()}.jpg`,
            {
              type: "image/jpeg",
            }
          );

          resolve(file);
        },
        "image/jpeg",
        0.85
      );
    });
  };

  const onCropComplete = (
    croppedArea,
    croppedAreaPixelsValue
  ) => {
    setCroppedAreaPixels(
      croppedAreaPixelsValue
    );
  };

  // ================= IMAGE CHANGE =================

  
const handleImageChange = (event) => {
  const selectedFiles = Array.from(
    event.target.files || []
  );

  if (selectedFiles.length === 0) {
    return;
  }

  const remainingSlots = 5 - images.length;

  if (remainingSlots <= 0) {
    setError("You can upload a maximum of 5 images");
    event.target.value = "";
    return;
  }

  if (selectedFiles.length > remainingSlots) {
    setError(
      `You can add only ${remainingSlots} more image(s)`
    );
  } else {
    setError("");
  }

  const filesToAdd = selectedFiles.slice(
    0,
    remainingSlots
  );

  setCropQueue(filesToAdd);
  setCurrentCropIndex(0);

  setCropImage(
    URL.createObjectURL(filesToAdd[0])
  );

  setCrop({ x: 0, y: 0 });
  setZoom(1);
  setCroppedAreaPixels(null);

  event.target.value = "";
};
  // ================= CROP CONFIRM =================

  const handleCropConfirm = async () => {
    try {
      if (!cropImage || !croppedAreaPixels) {
        setError("Please crop the image");
        return;
      }

      const croppedFile =
        await createCroppedImage(
          cropImage,
          croppedAreaPixels
        );

      setImages((previousImages) => [
        ...previousImages,
        croppedFile,
      ]);

      URL.revokeObjectURL(cropImage);

      const nextIndex =
        currentCropIndex + 1;

      if (
        nextIndex < cropQueue.length
      ) {
        const nextImage =
          cropQueue[nextIndex];

        setCurrentCropIndex(nextIndex);

        setCropImage(
          URL.createObjectURL(nextImage)
        );

        setCrop({
          x: 0,
          y: 0,
        });

        setZoom(1);
        setCroppedAreaPixels(null);
      } else {
        setCropQueue([]);
        setCurrentCropIndex(0);
        setCropImage(null);
        setCroppedAreaPixels(null);
      }
    } catch (error) {
      console.error(
        "Crop image error:",
        error
      );

      setError("Failed to crop image");
    }
  };

  // ================= REMOVE IMAGE =================

  const handleRemoveImage = (index) => {
    if (images.length <= 3) {
      setError(
        "A product must have at least 3 images"
      );
      return;
    }

    setImages((previousImages) =>
      previousImages.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );

    setError("");
  };


const handleSetMainImage = (index) => {
  setImages((previousImages) => {
    const selectedImage = previousImages[index];

    return [
      selectedImage,
      ...previousImages.filter(
        (_, imageIndex) => imageIndex !== index
      ),
    ];
  });

  setError("");
};
  // ================= UPDATE PRODUCT =================

  const handleUpdateProduct = async () => {
    const trimmedName =
      productName.trim();

    const trimmedDescription =
      productDescription.trim();

    const trimmedPrice =
      String(basePrice).trim();

    if (!trimmedName) {
      setError("Product name is required");
      return;
    }

    if (
      trimmedName.length < 2
    ) {
      setError(
        "Product name must be at least 2 characters"
      );
      return;
    }

    if (!trimmedDescription) {
      setError(
        "Product description is required"
      );
      return;
    }

    if (!productCategory) {
      setError("Please select a category");
      return;
    }

    if (
      trimmedPrice === "" ||
      Number(trimmedPrice) < 0
    ) {
      setError("Enter a valid base price");
      return;
    }

    if (images.length < 3) {
      setError(
        "A product must have at least 3 images"
      );
      return;
    }

    if (images.length > 5) {
      setError(
        "A product can have a maximum of 5 images"
      );
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const formData = new FormData();

      formData.append(
        "name",
        trimmedName
      );

      formData.append(
        "description",
        trimmedDescription
      );

      formData.append(
        "categoryId",
        productCategory
      );

      formData.append(
        "basePrice",
        Number(trimmedPrice)
      );

      const existingImages =
        images.filter(
          (image) =>
            typeof image === "string"
        );

      const newImages =
        images.filter(
          (image) =>
            image instanceof File
        );

      formData.append(
        "existingImages",
        JSON.stringify(existingImages)
      );

      newImages.forEach((image) => {
        formData.append(
          "images",
          image
        );
      });

      const data =
        await updateAdminProduct(
          productId,
          formData
        );

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to update product"
        );
      }

      setNotification({
        type: "success",
        message:
          "Product updated successfully",
      });

      setTimeout(() => {
        navigate("/admin/products", {
          state: {
            productUpdated: true,
          },
        });
      }, 1000);
    } catch (error) {
      console.error(
        "Update product error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update product"
      );
    } finally {
      setUpdating(false);
    }
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-edit-product">
          <p>Loading product...</p>
        </div>
      </AdminLayout>
    );
  }

  // ================= ERROR =================

  if (error && !productName) {
    return (
      <AdminLayout>
        <div className="admin-edit-product">

          <button
            className="back-button"
            onClick={() =>
              navigate(
                "/admin/products"
              )
            }
          >
            ← Back to Products
          </button>

          <p className="form-error">
            {error}
          </p>

        </div>
      </AdminLayout>
    );
  }

  // ================= PAGE =================

  return (
    <AdminLayout>

      <div className="admin-edit-product">

        <div className="edit-product-header">

          <button
            className="back-button"
            onClick={() =>
              navigate(
                "/admin/products"
              )
            }
          >
            ← Back to Products
          </button>

          <div>
            <h1>Edit Product</h1>

            <p>
              Update your product details
              and images.
            </p>
          </div>

        </div>

        <div className="edit-product-card">

          {/* PRODUCT NAME */}

          <div className="form-group">
            <label>
              Product Name
            </label>

            <input
              type="text"
              value={productName}
              onChange={(e) => {
                setProductName(
                  e.target.value
                );
                setError("");
              }}
              placeholder="Enter product name"
            />
          </div>

          {/* DESCRIPTION */}

          <div className="form-group">
            <label>
              Description
            </label>

            <textarea
              value={productDescription}
              onChange={(e) => {
                setProductDescription(
                  e.target.value
                );
                setError("");
              }}
              placeholder="Enter product description"
              rows="5"
            />
          </div>

          {/* CATEGORY */}

          <div className="form-group">
            <label>
              Category
            </label>

            <select
              value={productCategory}
              onChange={(e) => {
                setProductCategory(
                  e.target.value
                );
                setError("");
              }}
            >
              <option value="">
                Select category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category._id}
                    value={category._id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* BASE PRICE */}

          <div className="form-group">
            <label>
              Base Price
            </label>

            <input
              type="number"
              min="0"
              value={basePrice}
              onChange={(e) => {
                setBasePrice(
                  e.target.value
                );
                setError("");
              }}
              placeholder="Enter base price"
            />
          </div>

          {/* IMAGES */}

          <div className="form-group">

            <label>
              Product Images
            </label>

            <p className="image-help-text">
              Minimum 3 images and maximum
              5 images.
            </p>

            
<div className="edit-product-image-list">
  {images.map((image, index) => (
    <div
      className={`edit-product-image-wrapper ${
        index === 0 ? "main-product-image" : ""
      }`}
      key={
        typeof image === "string"
          ? image
          : `${image.name}-${index}`
      }
    >
      <img
        src={
          typeof image === "string"
            ? image
            : URL.createObjectURL(image)
        }
        alt={`Product ${index + 1}`}
        className="edit-product-image"
      />

      {index === 0 && (
        <span className="main-image-badge">
          Main Image
        </span>
      )}

      {index !== 0 && (
        <button
          type="button"
          className="set-main-image-button"
          onClick={() => handleSetMainImage(index)}
        >
          Set as Main
        </button>
      )}

      <button
        type="button"
        className="remove-image-button"
        onClick={() => handleRemoveImage(index)}
        aria-label={`Remove product image ${index + 1}`}
      >
        ×
      </button>
    </div>
  ))}
</div>
            {images.length < 5 && (
              <label className="image-upload-button">
                + Add Images

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={
                    handleImageChange
                  }
                  hidden
                />
              </label>
            )}

          </div>

          {/* ERROR */}

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          {/* ACTIONS */}

          <div className="edit-product-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() =>
                navigate(
                  "/admin/products"
                )
              }
              disabled={updating}
            >
              Cancel
            </button>

            <button
              type="button"
              className="update-button"
              onClick={
                handleUpdateProduct
              }
              disabled={updating}
            >
              {updating
                ? "Updating..."
                : "Update Product"}
            </button>

          </div>

        </div>

      </div>

      {/* ================= CROP MODAL ================= */}

      {cropImage && (
        <div className="crop-modal-overlay">

          <div className="crop-modal">

            <h2>
              Crop Product Image
            </h2>

            <div className="crop-container">

              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={
                  onCropComplete
                }
              />

            </div>

            <div className="zoom-control">

              <label>
                Zoom
              </label>

              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) =>
                  setZoom(
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </div>

            <div className="crop-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  if (cropImage) {
                    URL.revokeObjectURL(
                      cropImage
                    );
                  }

                  setCropImage(null);
                  setCropQueue([]);
                  setCurrentCropIndex(0);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="update-button"
                onClick={
                  handleCropConfirm
                }
              >
                {currentCropIndex <
                cropQueue.length - 1
                  ? "Next Image"
                  : "Crop Image"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ================= NOTIFICATION ================= */}

      {notification && (
        <NotificationModal
          type={notification.type}
          message={notification.message}
          onClose={() =>
            setNotification(null)
          }
        />
      )}

    </AdminLayout>
  );
}

export default AdminEditProduct;