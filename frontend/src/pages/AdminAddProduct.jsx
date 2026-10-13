import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";

import AdminLayout from "../components/admin/AdminLayout";

import {
  getAdminCategories,
  addAdminProduct,
} from "../api/services/adminService";

import {
  createProductVariants,
} from "../api/services/adminVariantService";

import generateVariants from "../utils/generateVariants";

import "./AdminAddProduct.css";

function AdminAddProduct() {
  const navigate = useNavigate();

  // ================= CATEGORIES =================

  const [categories, setCategories] = useState([]);

  // ================= PRODUCT DETAILS =================

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] =
    useState("");
  const [productCategory, setProductCategory] =
    useState("");
  const [basePrice, setBasePrice] = useState("");

  // ================= IMAGE CROP =================

  const [cropQueue, setCropQueue] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] =
    useState(0);

  // Color whose images are currently being cropped
  const [cropColor, setCropColor] = useState(null);

  const [cropImage, setCropImage] = useState(null);

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  // ================= VARIANTS =================

  const [variantColors, setVariantColors] =
    useState([]);

  const [variantSizes, setVariantSizes] =
    useState([]);

  const [variants, setVariants] =
    useState([]);

  const [newColor, setNewColor] =
    useState("");

  const [newSize, setNewSize] =
    useState("");

  
  const [variantImages, setVariantImages] =
    useState({});

  // ================= STATUS =================

  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  // ================= FETCH CATEGORIES =================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAdminCategories();

        setCategories(data.categories || []);
      } catch (error) {
        console.error(
          "Fetch categories error:",
          error
        );
      }
    };

    fetchCategories();
  }, []);

  // ================= CROP IMAGE =================

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

    const canvas =
      document.createElement("canvas");

    const ctx = canvas.getContext("2d");

    const maxWidth = 1200;
    const maxHeight = 1200;

    let width = pixelCrop.width;
    let height = pixelCrop.height;

    if (
      width > maxWidth ||
      height > maxHeight
    ) {
      const scale = Math.min(
        maxWidth / width,
        maxHeight / height
      );

      width = Math.round(
        width * scale
      );

      height = Math.round(
        height * scale
      );
    }

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      width,
      height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(
            new File(
              [blob],
              "variant-image.jpg",
              {
                type: "image/jpeg",
              }
            )
          );
        },
        "image/jpeg",
        0.85
      );
    });
  };

  // ================= VARIANT IMAGE CHANGE =================

  const handleVariantImageChange = (
    color,
    event
  ) => {
    const files = Array.from(
      event.target.files
    );

    if (files.length < 3) {
      setAddError(
        `Please select at least 3 images for ${color}`
      );

      event.target.value = "";
      return;
    }

    if (files.length > 5) {
      setAddError(
        `You can select a maximum of 5 images for ${color}`
      );

      event.target.value = "";
      return;
    }

    setAddError("");

    const firstImage =
      URL.createObjectURL(files[0]);

    // Remember which color these images belong to
    setCropColor(color);

    // Start crop queue
    setCropQueue(files);

    setCurrentCropIndex(0);

    setCropImage(firstImage);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setCroppedAreaPixels(null);

    event.target.value = "";
  };

  // ================= CROP COMPLETE =================

  const handleCropComplete = (
    _,
    croppedPixels
  ) => {
    setCroppedAreaPixels(
      croppedPixels
    );
  };

  // ================= CROP CONFIRM =================

  const handleCropConfirm = async () => {
    if (
      !cropImage ||
      !croppedAreaPixels ||
      !cropColor
    ) {
      setAddError(
        "Please crop the image before continuing"
      );

      return;
    }

    try {
      const croppedFile =
        await createCroppedImage(
          cropImage,
          croppedAreaPixels
        );

      // Add the cropped image to the
      // currently selected color
      setVariantImages(
        (prevImages) => ({
          ...prevImages,
          [cropColor]: [
            ...(prevImages[
              cropColor
            ] || []),
            croppedFile,
          ],
        })
      );

      URL.revokeObjectURL(
        cropImage
      );

      const nextIndex =
        currentCropIndex + 1;

      // More images remain in the queue
      if (
        nextIndex <
        cropQueue.length
      ) {
        const nextImage =
          URL.createObjectURL(
            cropQueue[nextIndex]
          );

        setCurrentCropIndex(
          nextIndex
        );

        setCropImage(
          nextImage
        );

        setCrop({
          x: 0,
          y: 0,
        });

        setZoom(1);

        setCroppedAreaPixels(
          null
        );
      } else {
        // Finished cropping all images
        setCropImage(null);

        setCropQueue([]);

        setCurrentCropIndex(0);

        setCropColor(null);

        setCroppedAreaPixels(
          null
        );
      }
    } catch (error) {
      console.error(
        "Image crop error:",
        error
      );

      setAddError(
        "Failed to process image"
      );
    }
  };

  // ================= CANCEL CROP =================

  const handleCancelCrop = () => {
    if (cropImage) {
      URL.revokeObjectURL(
        cropImage
      );
    }

    setCropImage(null);

    setCropQueue([]);

    setCurrentCropIndex(0);

    setCropColor(null);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setCroppedAreaPixels(null);
  };

  // ================= ADD COLOR =================

  const handleAddColor = () => {
    const color = newColor.trim();

    if (!color) {
      setAddError(
        "Please enter a color"
      );

      return;
    }

    const alreadyExists =
      variantColors.some(
        (existingColor) =>
          existingColor.toLowerCase() ===
          color.toLowerCase()
      );

    if (alreadyExists) {
      setAddError(
        "This color has already been added"
      );

      return;
    }

    setVariantColors(
      (prevColors) => [
        ...prevColors,
        color,
      ]
    );

    // Existing generated variants
    // are no longer valid
    setVariants([]);

    setNewColor("");

    setAddError("");
  };

  // ================= REMOVE COLOR =================

  const handleRemoveColor = (
    colorToRemove
  ) => {
    setVariantColors(
      (prevColors) =>
        prevColors.filter(
          (color) =>
            color !== colorToRemove
        )
    );

    // Remove images belonging
    // to this color
    setVariantImages(
      (prevImages) => {
        const updatedImages = {
          ...prevImages,
        };

        delete updatedImages[
          colorToRemove
        ];

        return updatedImages;
      }
    );

    setVariants([]);
  };

  // ================= ADD SIZE =================

  const handleAddSize = () => {
    const size = Number(newSize);

    if (!size || size <= 0) {
      setAddError(
        "Please enter a valid size"
      );

      return;
    }

    if (
      variantSizes.includes(size)
    ) {
      setAddError(
        "This size has already been added"
      );

      return;
    }

    setVariantSizes(
      (prevSizes) =>
        [
          ...prevSizes,
          size,
        ].sort(
          (a, b) => a - b
        )
    );

    // Existing variants need
    // to be generated again
    setVariants([]);

    setNewSize("");

    setAddError("");
  };

  // ================= REMOVE SIZE =================

  const handleRemoveSize = (
    sizeToRemove
  ) => {
    setVariantSizes(
      (prevSizes) =>
        prevSizes.filter(
          (size) =>
            size !== sizeToRemove
        )
    );

    setVariants([]);
  };

  // ================= GENERATE VARIANTS =================

  const handleGenerateVariants = () => {
    if (
      variantColors.length === 0
    ) {
      setAddError(
        "Please add at least one color"
      );

      return;
    }

    if (
      variantSizes.length === 0
    ) {
      setAddError(
        "Please add at least one size"
      );

      return;
    }

    // Every color must have images
    const colorWithoutImage =
      variantColors.find(
        (color) =>
          !variantImages[color] ||
          variantImages[color].length < 3
      );

    if (colorWithoutImage) {
      setAddError(
        `Please upload 3 to 5 images for ${colorWithoutImage}`
      );

      return;
    }

    const colorWithTooManyImages =
      variantColors.find(
        (color) =>
          variantImages[color] &&
          variantImages[color].length > 5
      );

    if (colorWithTooManyImages) {
      setAddError(
        `You can upload a maximum of 5 images for ${colorWithTooManyImages}`
      );

      return;
    }

    const generatedVariants =
      generateVariants(
        variantColors,
        variantSizes
      );

    setVariants(
      generatedVariants
    );

    setAddError("");
  };

  // ================= VARIANT CHANGE =================

  const handleVariantChange = (
    index,
    field,
    value
  ) => {
    setVariants(
      (prevVariants) =>
        prevVariants.map(
          (
            variant,
            variantIndex
          ) =>
            variantIndex ===
            index
              ? {
                  ...variant,
                  [field]:
                    value,
                }
              : variant
        )
    );
  };

  // ================= ADD PRODUCT =================

  const handleAddProduct = async () => {
    const trimmedName =
      productName.trim();

    const trimmedDescription =
      productDescription.trim();

    // ================= PRODUCT VALIDATION =================

    if (!trimmedName) {
      setAddError(
        "Product name is required"
      );

      return;
    }

    if (!trimmedDescription) {
      setAddError(
        "Product description is required"
      );

      return;
    }

    if (!productCategory) {
      setAddError(
        "Category is required"
      );

      return;
    }

    if (
      basePrice === "" ||
      basePrice === null ||
      Number(basePrice) < 0
    ) {
      setAddError(
        "Valid base price is required"
      );

      return;
    }

    // ================= VARIANT VALIDATION =================

    if (
      variantColors.length === 0
    ) {
      setAddError(
        "Please add at least one color"
      );

      return;
    }

    if (
      variantSizes.length === 0
    ) {
      setAddError(
        "Please add at least one size"
      );

      return;
    }

    if (
      variants.length === 0
    ) {
      setAddError(
        "Please generate the product variants"
      );

      return;
    }

    // Every color must have
    // 3 to 5 images
    const colorWithoutImage =
      variantColors.find(
        (color) =>
          !variantImages[color] ||
          variantImages[color].length < 3
      );

    if (colorWithoutImage) {
      setAddError(
        `Please upload 3 to 5 images for ${colorWithoutImage}`
      );

      return;
    }

    const colorWithTooManyImages =
      variantColors.find(
        (color) =>
          variantImages[color] &&
          variantImages[color].length > 5
      );

    if (colorWithTooManyImages) {
      setAddError(
        `You can upload a maximum of 5 images for ${colorWithTooManyImages}`
      );

      return;
    }

    // Check all variants
    const invalidVariant =
      variants.some(
        (variant) =>
          variant.stock === "" ||
          Number(variant.stock) < 0 ||
          variant.price === "" ||
          Number(variant.price) < 0 ||
          !variant.sku ||
          !variant.sku.trim()
      );

    if (invalidVariant) {
      setAddError(
        "Please enter valid stock and price for all variants"
      );

      return;
    }

    try {
      setAdding(true);

      setAddError("");

      // ================= PRODUCT =================

      /*
        IMPORTANT:

        We are NOT adding any product images.

        Images belong to variants/colors.
      */

      const formData =
        new FormData();

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
        Number(basePrice)
      );

      const data =
        await addAdminProduct(
          formData
        );

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to add product"
        );
      }

      // ================= PRODUCT ID =================

      const productId =
        data.product._id;

      // ================= VARIANT IMAGE FILES =================

    
      const variantImageFiles = [];

      const colorImageIndexes = {};

      variantColors.forEach(
        (color) => {
          colorImageIndexes[
            color
          ] = [];

          const images =
            variantImages[color] || [];

          images.forEach(
            (image) => {
              const index =
                variantImageFiles.length;

              variantImageFiles.push(
                image
              );

              colorImageIndexes[
                color
              ].push(index);
            }
          );
        }
      );

      // ================= VARIANT FORM DATA =================

      const variantFormData =
        new FormData();

      variantFormData.append(
        "productId",
        productId
      );

     
      variantFormData.append(
        "variants",
        JSON.stringify(
          variants.map(
            (variant) => ({
              color:
                variant.color,

              size: Number(
                variant.size
              ),

              stock: Number(
                variant.stock
              ),

              price: Number(
                variant.price
              ),

              sku:
                variant.sku.trim(),

              imageIndexes:
                colorImageIndexes[
                  variant.color
                ] || [],
            })
          )
        )
      );

      // Add all color image files
      variantImageFiles.forEach(
        (file) => {
          variantFormData.append(
            "variantImages",
            file
          );
        }
      );

      // ================= CREATE VARIANTS =================

      const variantResponse =
        await createProductVariants(
          variantFormData
        );

      if (
        !variantResponse.success
      ) {
        throw new Error(
          variantResponse.message ||
            "Failed to create variants"
        );
      }

      // ================= SUCCESS =================

      navigate(
        "/admin/products"
      );
    } catch (error) {
      console.error(
        "Add product error:",
        error
      );

      setAddError(
        error.response?.data
          ?.message ||
          error.message ||
          "Failed to add product"
      );
    } finally {
      setAdding(false);
    }
  };

  // ================= RETURN =================

  return (
    <AdminLayout title="Add Product">
      <div className="add-product-page">

        {/* ================= HEADER ================= */}

        <div className="add-product-header">
          <div>
            <h1>Add Product</h1>

            <p>
              Add a new product to your
              store.
            </p>
          </div>

          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate(
                "/admin/products"
              )
            }
            disabled={adding}
          >
            ← Back to Products
          </button>
        </div>

        {/* ================= PRODUCT DETAILS ================= */}

        <div className="add-product-card">
          <h2>
            Product Details
          </h2>

          <div className="form-group">
            <label>
              Product Name
            </label>

            <input
              type="text"
              placeholder="Enter product name"
              value={productName}
              onChange={(e) => {
                setProductName(
                  e.target.value
                );

                setAddError("");
              }}
            />
          </div>

          <div className="form-group">
            <label>
              Description
            </label>

            <textarea
              placeholder="Enter product description"
              value={
                productDescription
              }
              onChange={(e) => {
                setProductDescription(
                  e.target.value
                );

                setAddError("");
              }}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Category
              </label>

              <select
                value={
                  productCategory
                }
                onChange={(e) => {
                  setProductCategory(
                    e.target.value
                  );

                  setAddError("");
                }}
              >
                <option value="">
                  Select category
                </option>

                {categories
                  .filter(
                    (category) =>
                      category.isActive
                  )
                  .map(
                    (category) => (
                      <option
                        key={
                          category._id
                        }
                        value={
                          category._id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    )
                  )}
              </select>
            </div>

            <div className="form-group">
              <label>
                Base Price
              </label>

              <input
                type="number"
                min="0"
                placeholder="Enter base price"
                value={basePrice}
                onChange={(e) => {
                  setBasePrice(
                    e.target.value
                  );

                  setAddError("");
                }}
              />
            </div>
          </div>
        </div>

        {/* ================= VARIANT OPTIONS ================= */}

        <div className="add-product-card">
          <h2>
            Variant Options
          </h2>

          {/* ================= COLORS ================= */}

          <div className="variant-option">
            <label>
              Colors
            </label>

            <div className="variant-input-row">
              <input
                type="text"
                placeholder="Enter color"
                value={newColor}
                onChange={(e) =>
                  setNewColor(
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                className="variant-add-btn"
                onClick={
                  handleAddColor
                }
              >
                + Add Color
              </button>
            </div>

            <div className="variant-chips">
              {variantColors.map(
                (color) => (
                  <span
                    key={color}
                    className="variant-chip"
                  >
                    {color}

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveColor(
                          color
                        )
                      }
                    >
                      ×
                    </button>
                  </span>
                )
              )}
            </div>
          </div>

          {/* ================= COLOR IMAGES ================= */}

          {variantColors.length > 0 && (
            <div className="variant-images-section">
              <h3>
                Color Images
              </h3>

              <p className="section-description">
                Upload 3 to 5 images for
                each color. These images
                will be shared by all
                sizes of that color.
              </p>

              {variantColors.map(
                (color) => (
                  <div
                    key={color}
                    className="variant-image-group"
                  >
                    <div className="variant-image-header">
                      <strong>
                        {color}
                      </strong>

                      {variantImages[
                        color
                      ] &&
                        variantImages[
                          color
                        ].length > 0 && (
                          <span>
                            {
                              variantImages[
                                color
                              ].length
                            }{" "}
                            images
                          </span>
                        )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(
                        event
                      ) =>
                        handleVariantImageChange(
                          color,
                          event
                        )
                      }
                      disabled={adding}
                    />

                    <p className="section-description">
                      Select 3 to 5 images
                      for {color}.
                    </p>

                    {variantImages[
                      color
                    ] &&
                      variantImages[
                        color
                      ].length > 0 && (
                        <div className="variant-image-preview-container">
                          {variantImages[
                            color
                          ].map(
                            (
                              image,
                              index
                            ) => (
                              <div
                                key={
                                  index
                                }
                                className="variant-image-preview"
                              >
                                <img
                                  src={URL.createObjectURL(
                                    image
                                  )}
                                  alt={`${color} ${
                                    index +
                                    1
                                  }`}
                                />
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </div>
                )
              )}
            </div>
          )}

          {/* ================= SIZES ================= */}

          <div className="variant-option">
            <label>
              Sizes
            </label>

            <div className="variant-input-row">
              <input
                type="number"
                placeholder="Enter size"
                value={newSize}
                onChange={(e) =>
                  setNewSize(
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                className="variant-add-btn"
                onClick={
                  handleAddSize
                }
              >
                + Add Size
              </button>
            </div>

            <div className="variant-chips">
              {variantSizes.map(
                (size) => (
                  <span
                    key={size}
                    className="variant-chip"
                  >
                    {size}

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveSize(
                          size
                        )
                      }
                    >
                      ×
                    </button>
                  </span>
                )
              )}
            </div>
          </div>

          {/* ================= GENERATE ================= */}

          <button
            type="button"
            className="generate-variants-btn"
            onClick={
              handleGenerateVariants
            }
            disabled={adding}
          >
            Generate Variants
          </button>

          {/* ================= GENERATED VARIANTS ================= */}

          {variants.length >
            0 && (
            <div className="generated-variants">
              <h3>
                {variantColors.length}{" "}
                Colors ×{" "}
                {variantSizes.length}{" "}
                Sizes ={" "}
                {variants.length}{" "}
                Variants
              </h3>

              <div className="variant-table-wrapper">
                <table className="variant-table">
                  <thead>
                    <tr>
                      <th>
                        Color
                      </th>

                      <th>
                        Size
                      </th>

                      <th>
                        Stock
                      </th>

                      <th>
                        Price
                      </th>

                      <th>
                        SKU
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {variants.map(
                      (
                        variant,
                        index
                      ) => (
                        <tr
                          key={`${variant.color}-${variant.size}`}
                        >
                          <td>
                            {
                              variant.color
                            }
                          </td>

                          <td>
                            {
                              variant.size
                            }
                          </td>

                          <td>
                            <input
                              type="number"
                              min="0"
                              placeholder="Stock"
                              value={
                                variant.stock
                              }
                              onChange={(
                                e
                              ) =>
                                handleVariantChange(
                                  index,
                                  "stock",
                                  e.target
                                    .value
                                )
                              }
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              min="0"
                              placeholder="Price"
                              value={
                                variant.price
                              }
                              onChange={(
                                e
                              ) =>
                                handleVariantChange(
                                  index,
                                  "price",
                                  e.target
                                    .value
                                )
                              }
                            />
                          </td>

                          <td>
                            <span className="variant-sku">
                              {
                                variant.sku
                              }
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ================= ERROR ================= */}

        {addError && (
          <p className="add-product-error">
            {addError}
          </p>
        )}

        {/* ================= ACTIONS ================= */}

        <div className="add-product-actions">
          <button
            type="button"
            className="cancel-product-button"
            onClick={() =>
              navigate(
                "/admin/products"
              )
            }
            disabled={adding}
          >
            Cancel
          </button>

          <button
            type="button"
            className="save-product-button"
            onClick={
              handleAddProduct
            }
            disabled={adding}
          >
            {adding
              ? "Adding Product..."
              : "Add Product"}
          </button>
        </div>
      </div>

      {/* ================= CROP MODAL ================= */}

      {cropImage && (
        <div className="crop-modal-overlay">
          <div className="crop-modal">
            <h3>
              Crop {cropColor} Image{" "}
              {currentCropIndex + 1}{" "}
              of{" "}
              {cropQueue.length}
            </h3>

            <div className="crop-container">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                cropShape="rect"
                showGrid={true}
                onCropChange={
                  setCrop
                }
                onZoomChange={
                  setZoom
                }
                onCropComplete={
                  handleCropComplete
                }
              />
            </div>

            <div className="zoom-control">
              <label>
                Zoom
              </label>

              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(event) =>
                  setZoom(
                    Number(
                      event.target.value
                    )
                  )
                }
              />
            </div>

            <div className="crop-modal-buttons">
              <button
                type="button"
                onClick={
                  handleCancelCrop
                }
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleCropConfirm
                }
              >
                {currentCropIndex +
                  1 ===
                cropQueue.length
                  ? "Finish"
                  : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminAddProduct;