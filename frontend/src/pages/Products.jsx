import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

import { getActiveProducts } from "../api/services/userProductService";
import { getProductVariants } from "../api/services/userVariantService";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../api/services/userWishlistService";

import NotificationModal from "../components/common/NotificationModal";
import "./Products.css";

function Products() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryId = searchParams.get("category") || "";
  const searchQuery = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistBusy, setWishlistBusy] = useState({});
  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  const PRODUCTS_PER_PAGE = 12;

  const showNotification = (title, message, type = "success") => {
    setNotification({ isOpen: true, title, message, type });
  };

  const closeNotification = () => {
    setNotification((previous) => ({
      ...previous,
      isOpen: false,
    }));
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const data = await getActiveProducts({
        search: searchQuery.trim(),
        categoryId,
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
      });

      if (data.success) {
        setProducts(data.products || []);

        const pages = data.totalPages ?? data.pagination?.totalPages ?? 1;
        setTotalPages(Math.max(1, Number(pages) || 1));
      } else {
        setProducts([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    if (!localStorage.getItem("userToken")) {
      setWishlistItems([]);
      return;
    }

    try {
      const data = await getWishlist();

      if (data.success) {
        setWishlistItems(data.wishlist?.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [categoryId, searchQuery, currentPage]);

  useEffect(() => {
    fetchWishlist();

    const handleWishlistUpdated = () => {
      fetchWishlist();
    };

    window.addEventListener("wishlistUpdated", handleWishlistUpdated);

    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdated);
    };
  }, []);

  const getWishlistVariantId = (item) => {
    if (item.variantId && typeof item.variantId === "object") {
      return String(item.variantId._id);
    }

    return String(item.variantId || "");
  };

  const handleWishlistToggle = async (event, product) => {
    event.stopPropagation();

    if (!localStorage.getItem("userToken")) {
      showNotification(
        "Login Required",
        "Please log in to add products to your wishlist.",
        "info",
      );
      return;
    }

    if (wishlistBusy[product._id]) return;

    setWishlistBusy((previous) => ({
      ...previous,
      [product._id]: true,
    }));

    try {
      // Fetch variants so the wishlist receives a valid variant ID.
      const variantData = await getProductVariants(product._id);

      if (!variantData.success || !variantData.variants?.length) {
        showNotification(
          "Unavailable",
          "No variants are available for this product.",
          "error",
        );
        return;
      }

      const variants = variantData.variants;
      const availableVariants = variants.filter(
        (variant) => Number(variant.stock) > 0,
      );

      if (!availableVariants.length) {
        showNotification(
          "Out of Stock",
          "This product is currently out of stock.",
          "error",
        );
        return;
      }

      const availableVariantIds = availableVariants.map((variant) =>
        String(variant._id),
      );

      // If a variant of this product is already wishlisted, remove it.
      const existingItem = wishlistItems.find((item) =>
        availableVariantIds.includes(getWishlistVariantId(item)),
      );

      if (existingItem) {
        const result = await removeFromWishlist(existingItem._id);

        if (!result.success) {
          throw new Error(result.message || "Unable to remove from wishlist.");
        }

        setWishlistItems((previous) =>
          previous.filter(
            (item) => String(item._id) !== String(existingItem._id),
          ),
        );

        showNotification(
          "Removed from Wishlist",
          "Product removed from your wishlist.",
        );
      } else {
        // Add the first in-stock variant.
        const variant = availableVariants[0];
        const result = await addToWishlist(variant._id, 1);

        if (!result.success) {
          throw new Error(result.message || "Unable to add to wishlist.");
        }

        // Refresh from the server to get the actual wishlist item ID.
        const updatedWishlist = await getWishlist();
        const items = updatedWishlist.wishlist?.items || [];

        setWishlistItems(items);

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
          "Unable to update your wishlist. Please try again.",
        "error",
      );
    } finally {
      setWishlistBusy((previous) => ({
        ...previous,
        [product._id]: false,
      }));
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <div className="products-loading">Loading products...</div>;
  }

  return (
    <div className="products-page">
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        duration={2000}
      />

      <div className="products-header">
        <h1>Shop</h1>
        <p>Discover our collection of women’s footwear</p>
      </div>

      <div className="products-grid">
        {products.map((product) => {
          const productVariantIds = wishlistItems.map(getWishlistVariantId);

          // A card appears wishlisted if any of its variants is wishlisted.
          // Product variant data is fetched when the heart is clicked.
          const isWishlisted = wishlistItems.some((item) => {
            const variantId = getWishlistVariantId(item);
            return (
              variantId &&
              (String(item.productId?._id || item.productId || "") ===
                String(product._id) ||
                String(item.variantId?.productId?._id || "") ===
                  String(product._id))
            );
          });

          return (
            <div
              className="product-card"
              key={product._id}
              onClick={() => navigate(`/products/${product._id}`)}
            >
              <div className="product-image-container">
                {product.displayImage ? (
                  <img
                    src={product.displayImage}
                    alt={product.name}
                    className="product-image"
                  />
                ) : (
                  <div className="product-no-image">No Image</div>
                )}

                <button
                  type="button"
                  className={`product-wishlist-button ${
                    isWishlisted ? "active" : ""
                  }`}
                  aria-label={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                  title={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                  disabled={Boolean(wishlistBusy[product._id])}
                  onClick={(event) => handleWishlistToggle(event, product)}
                >
                  <Heart
                    size={19}
                    fill={isWishlisted ? "#c47d91" : "none"}
                    color={isWishlisted ? "#c47d91" : "currentColor"}
                  />
                </button>
              </div>

              <div className="product-details">
                <p className="product-category">{product.categoryId?.name}</p>
                <h2 className="product-name">{product.name}</h2>

                <div className="product-price-container">
                  {Number(product.offerDiscount || 0) > 0 ? (
                    <>
                      <p className="product-price product-discounted-price">
                        ₹{Number(product.displayPrice).toLocaleString("en-IN")}
                      </p>

                      <p className="product-original-price">
                        ₹{Number(product.originalPrice).toLocaleString("en-IN")}
                      </p>

                      {product.discountType === "Percentage" && (
                        <span className="product-offer-badge">
                          {Number(product.discountValue)}% OFF
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="product-price">
                      ₹
                      {Number(
                        product.displayPrice ?? product.basePrice,
                      ).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="no-products">No products available.</div>
      )}

      {totalPages > 1 && products.length > 0 && (
        <div className="products-pagination">
          <button
            type="button"
            className="pagination-button"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  className={`pagination-page ${
                    currentPage === page ? "active" : ""
                  }`}
                  aria-current={currentPage === page ? "page" : undefined}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            className="pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default Products;
