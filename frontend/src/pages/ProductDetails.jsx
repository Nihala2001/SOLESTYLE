import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";

import { getActiveProducts } from "../api/services/userProductService";
import { getProductVariants } from "../api/services/userVariantService";
import { addToCart } from "../api/services/userCartService";

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../api/services/userWishlistService";

import NotificationModal from "../components/common/NotificationModal";

import "./ProductDetails.css";

function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState(null);

  const [loading, setLoading] = useState(true);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const [cartMessage, setCartMessage] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);

  const [isWishlisted, setIsWishlisted] = useState(false);

  const [wishlistBusy, setWishlistBusy] = useState(false);

  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  const showNotification = (title, message, type = "success") => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const closeNotification = () => {
    setNotification((previous) => ({
      ...previous,
      isOpen: false,
    }));
  };

  // ================= FETCH PRODUCT =================

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        // Declare foundProduct outside the if block
        let foundProduct = null;

        const productData = await getActiveProducts({
          limit: 100,
        });

        if (productData.success) {
          foundProduct =
            productData.products.find((item) => item._id === productId) || null;

          setProduct(foundProduct);
        }

        // Fetch product variants
        const variantData = await getProductVariants(productId);

        if (variantData.success) {
          const fetchedVariants = variantData.variants || [];

          setVariants(fetchedVariants);

          if (fetchedVariants.length > 0) {
            // Use the color saved by the admin
            const preferredColor = foundProduct?.displayColor;

            const matchingColor = fetchedVariants.find(
              (variant) =>
                variant.color?.trim().toLowerCase() ===
                preferredColor?.trim().toLowerCase(),
            );

            // Fall back to the first variant if no saved color matches
            setSelectedColor(
              matchingColor?.color || fetchedVariants[0].color || "",
            );
          } else {
            setSelectedColor("");
          }

          setSelectedSize(null);
          setSelectedImageIndex(0);
          setIsZoomed(false);
        }
      } catch (error) {
        console.error("Failed to fetch product details:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // ================= COLORS =================

  const colors = [
    ...new Set(variants.map((variant) => variant.color).filter(Boolean)),
  ];

  // ================= SIZES =================

  const availableSizes = variants.filter(
    (variant) =>
      variant.color?.trim().toLowerCase() ===
      selectedColor.trim().toLowerCase(),
  );

  // ================= SELECTED VARIANT =================

  const selectedVariant = variants.find(
    (variant) =>
      variant.color?.trim().toLowerCase() ===
        selectedColor.trim().toLowerCase() &&
      String(variant.size) === String(selectedSize),
  );

  // ================= SELECTED COLOR IMAGES =================

  const selectedColorVariants = variants.filter(
    (variant) =>
      variant.color?.trim().toLowerCase() ===
      selectedColor.trim().toLowerCase(),
  );

  // Prefer a variant that has a valid main image.
  // Otherwise, use another variant of the same color with images.
  const selectedColorVariant =
    selectedColorVariants.find(
      (variant) =>
        Array.isArray(variant.productImages) &&
        variant.productImages.length > 0 &&
        variant.mainImage &&
        variant.productImages.includes(variant.mainImage),
    ) ||
    selectedColorVariants.find(
      (variant) =>
        Array.isArray(variant.productImages) &&
        variant.productImages.length > 0,
    );

  const colorImages = Array.isArray(selectedColorVariant?.productImages)
    ? selectedColorVariant.productImages.filter(
        (image) => typeof image === "string" && image.trim(),
      )
    : [];

  // Use only images belonging to the selected color.
  // Put its main image first when it belongs to that color.
  const selectedImages = selectedColorVariant
    ? [
        ...(selectedColorVariant.mainImage &&
        colorImages.includes(selectedColorVariant.mainImage)
          ? [selectedColorVariant.mainImage]
          : []),
        ...colorImages.filter(
          (image) => image !== selectedColorVariant.mainImage,
        ),
      ]
    : [];

  const currentImage =
    selectedImages[selectedImageIndex] || selectedImages[0] || "";

  // ================= COLOR CHANGE =================

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setSelectedSize(null);
    setSelectedImageIndex(0);
    setIsZoomed(false);
  };

  //......................addtocart...................//

  const handleAddToCart = async () => {
    if (!selectedColor) {
      showNotification(
        "Select a Color",
        "Please select a color first.",
        "info",
      );
      return;
    }

    if (!selectedSize || !selectedVariant) {
      showNotification(
        "Select a Size",
        "Please select a valid size first.",
        "info",
      );
      return;
    }

    if (selectedVariant.stock <= 0) {
      showNotification(
        "Out of Stock",
        "This variant is currently out of stock.",
        "error",
      );
      return;
    }

    try {
      setAddingToCart(true);

      const result = await addToCart(selectedVariant._id, 1);

      if (result.success) {
        showNotification(
          "Added to Cart",
          "Product added to your cart successfully.",
        );
      } else {
        showNotification(
          "Cart Error",
          result.message || "Failed to add product to cart.",
          "error",
        );
      }
    } catch (error) {
      showNotification(
        "Cart Error",
        error.response?.data?.message ||
          (error.response?.status === 401
            ? "Please log in to add products to your cart."
            : "Unable to add product to cart. Please try again."),
        "error",
      );
    } finally {
      setAddingToCart(false);
    }
  };

  //.................wishlist............//
  const handleWishlistToggle = async () => {
    if (!selectedColor) {
      showNotification(
        "Select a Color",
        "Please select a color first.",
        "info",
      );
      return;
    }

    if (!selectedSize || !selectedVariant) {
      showNotification(
        "Select a Size",
        "Please select a size before adding this product to your wishlist.",
        "info",
      );
      return;
    }

    try {
      setWishlistBusy(true);

      // Read the latest wishlist to avoid relying on stale UI state.
      const result = await getWishlist();

      if (!result.success) {
        throw new Error(result.message || "Unable to load wishlist.");
      }

      const wishlistItems = result.wishlist?.items || [];

      const existingItem = wishlistItems.find(
        (item) => String(item.variantId) === String(selectedVariant._id),
      );

      if (existingItem) {
        const removeResult = await removeFromWishlist(existingItem._id);

        if (!removeResult.success) {
          throw new Error(
            removeResult.message || "Unable to remove from wishlist.",
          );
        }

        setIsWishlisted(false);

        showNotification(
          "Removed from Wishlist",
          "Product removed from your wishlist.",
        );
      } else {
        const addResult = await addToWishlist(selectedVariant._id, 1);

        if (!addResult.success) {
          throw new Error(addResult.message || "Unable to add to wishlist.");
        }

        setIsWishlisted(true);

        showNotification(
          "Added to Wishlist",
          "Product added to your wishlist successfully.",
        );
      }
    } catch (error) {
      showNotification(
        "Wishlist Error",
        error.response?.data?.message ||
          error.message ||
          "Unable to update your wishlist. Please log in and try again.",
        "error",
      );
    } finally {
      setWishlistBusy(false);
    }
  };

  // ================= LOADING =================

  if (loading) {
    return <div className="product-details-loading">Loading product...</div>;
  }

  // ================= PRODUCT NOT FOUND =================

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Product not found</h2>

        <button onClick={() => navigate("/products")}>Back to Shop</button>
      </div>
    );
  }

  // ================= PAGE =================

  return (
    <div className="product-details-page">
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        duration={2000}
      />
      {/* BACK BUTTON */}

      <button className="product-back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        Back to Shop
      </button>

      <div className="product-details-container">
        {/* ================= IMAGE SECTION ================= */}

        <div className="product-details-images">
          <div className="product-main-image-container">
            <button
              type="button"
              className={`product-details-wishlist ${isWishlisted ? "active" : ""}`}
              onClick={handleWishlistToggle}
              disabled={wishlistBusy}
              aria-label={
                isWishlisted ? "Remove from wishlist" : "Add to wishlist"
              }
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                size={22}
                fill={isWishlisted ? "#c47d91" : "none"}
                color={isWishlisted ? "#c47d91" : "currentColor"}
              />
            </button>

            {currentImage ? (
              <img
                key={currentImage}
                src={currentImage}
                alt={`${product.name} - ${selectedColor}`}
                className="product-main-image"
                onClick={() => setIsZoomed(true)}
              />
            ) : (
              <div className="product-details-no-image">
                No Image Available for {selectedColor || "this color"}
              </div>
            )}
          </div>

          {/* IMAGE THUMBNAILS */}

          {selectedImages.length > 1 && (
            <div className="product-image-thumbnails">
              {selectedImages.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={`product-image-thumbnail ${
                    selectedImageIndex === index ? "active" : ""
                  }`}
                  onClick={() => {
                    setSelectedImageIndex(index);
                    setIsZoomed(false);
                  }}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${selectedColor} view ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================= PRODUCT INFORMATION ================= */}

        <div className="product-details-info">
          <p className="product-details-category">{product.categoryId?.name}</p>

          <h1>{product.name}</h1>

          <p className="product-details-price">
            ₹{selectedVariant?.price ?? product.basePrice}
          </p>

          <p className="product-details-description">{product.description}</p>

          {/* ================= COLOR ================= */}

          {colors.length > 0 && (
            <div className="variant-section">
              <h3>
                Color
                {selectedColor && <span> - {selectedColor}</span>}
              </h3>

              <div className="color-options">
                {colors.map((color) => (
                  <button
                    type="button"
                    key={color}
                    className={`color-option ${
                      selectedColor === color ? "selected" : ""
                    }`}
                    onClick={() => handleColorChange(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ================= SIZE ================= */}

          {selectedColor && (
            <div className="variant-section">
              <h3>Size</h3>

              <div className="size-options">
                {availableSizes.map((variant) => (
                  <button
                    type="button"
                    key={variant._id}
                    className={`size-option ${
                      String(selectedSize) === String(variant.size)
                        ? "selected"
                        : ""
                    } ${variant.stock === 0 ? "out-of-stock" : ""}`}
                    disabled={variant.stock === 0}
                    onClick={() => setSelectedSize(variant.size)}
                  >
                    {variant.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ================= STOCK ================= */}

          {selectedVariant && (
            <p
              className={
                selectedVariant.stock > 0
                  ? "product-stock"
                  : "product-stock out"
              }
            >
              {selectedVariant.stock > 0
                ? `${selectedVariant.stock} items available`
                : "Out of stock"}
            </p>
          )}

          {/* ================= ADD TO CART ================= */}

          <button
            type="button"
            className="add-to-cart-button"
            disabled={addingToCart}
            onClick={handleAddToCart}
          >
            {addingToCart ? "Adding..." : "Add to Cart"}
          </button>

          {cartMessage && (
            <p role="status" aria-live="polite" className="cart-message">
              {cartMessage}
            </p>
          )}
        </div>
      </div>

      {/* ================= IMAGE VIEWER ================= */}

      {isZoomed && currentImage && (
        <div
          className="image-viewer-overlay"
          onClick={() => setIsZoomed(false)}
        >
          <button
            type="button"
            className="image-viewer-close"
            onClick={() => setIsZoomed(false)}
            aria-label="Close image viewer"
          >
            ×
          </button>

          <img
            src={currentImage}
            alt={`${product.name} - ${selectedColor}`}
            className="image-viewer-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default ProductDetails;
