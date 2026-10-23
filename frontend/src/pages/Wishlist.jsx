import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";

import {
  getWishlist,
  removeFromWishlist,
} from "../api/services/userWishlistService";

import { addToCart } from "../api/services/userCartService";

import "./Wishlist.css";

function Wishlist() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchWishlist = async () => {
    try {
      setLoading(true);

      const response = await getWishlist();

      if (response.success) {
        setItems(response.wishlist?.items || []);
      } else {
        setError(response.message || "Failed to load wishlist");
      }
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
      setError(err.response?.data?.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (item) => {
    try {
      setBusyItemId(item._id);
      setMessage("");
      setError("");

      const response = await removeFromWishlist(item._id);

      if (response.success) {
        setItems(response.wishlist?.items || []);
        setMessage("Item removed from wishlist.");
      } else {
        setError(response.message || "Could not remove item.");
      }
    } catch (err) {
      console.error("Remove wishlist item error:", err);
      setError(err.response?.data?.message || "Could not remove item.");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleMoveToCart = async (item) => {
    try {
      setBusyItemId(item._id);
      setMessage("");
      setError("");

      if (!item.variantId) {
        setError("Product variant not found.");
        return;
      }

      if (item.stock < item.quantity) {
        setError(`Only ${item.stock} item(s) are currently in stock.`);
        return;
      }

      // Add to cart first.
      await addToCart(item.variantId, item.quantity);

      // Remove from wishlist only after adding to cart succeeds.
      const response = await removeFromWishlist(item._id);

      if (response.success) {
        setItems(response.wishlist?.items || []);
        setMessage("Item moved to cart successfully.");
      } else {
        setError(
          "Item was added to cart, but could not be removed from wishlist.",
        );
      }
    } catch (err) {
      console.error("Move to cart error:", err);
      setError(
        err.response?.data?.message ||
          "Could not move item to cart. Please try again.",
      );
    } finally {
      setBusyItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <p className="wishlist-status">Loading wishlist...</p>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <button
          type="button"
          className="wishlist-back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div>
          <h1>My Wishlist</h1>
          <p>{items.length} item(s) saved</p>
        </div>
      </div>

      {message && <p className="wishlist-message">{message}</p>}

      {error && <p className="wishlist-error">{error}</p>}

      {items.length === 0 ? (
        <div className="wishlist-empty">
          <ShoppingBag size={45} />
          <h2>Your wishlist is empty</h2>
          <p>Save your favourite footwear here.</p>

          <button type="button" onClick={() => navigate("/products")}>
            Explore Products
          </button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map((item) => (
            <article className="wishlist-card" key={item._id}>
              <button
                type="button"
                className="wishlist-product-image"
                onClick={() => navigate(`/products/${item.product?._id}`)}
                aria-label={`View ${item.product?.name || "product"}`}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.product?.name || "Footwear"}
                  />
                ) : (
                  <div className="wishlist-no-image">No image available</div>
                )}
              </button>

              <div className="wishlist-card-content">
                <h3>{item.product?.name || "Product no longer available"}</h3>

                {item.availability === "unavailable" && (
                  <p className="wishlist-error" role="alert">
                    Product not available
                  </p>
                )}

                {item.availability === "out_of_stock" && (
                  <p className="wishlist-stock">
                    This product is out of stock.
                  </p>
                )}

                {item.availability === "insufficient_stock" && (
                  <p className="wishlist-error" role="alert">
                    {item.unavailableReason}
                  </p>
                )}

                <p>Color: {item.color || "N/A"}</p>
                <p>Size: {item.size || "N/A"}</p>

                <p className="wishlist-price">
                  ₹{Number(item.price || 0).toLocaleString("en-IN")}
                </p>

                <p className="wishlist-stock">
                  {item.stock > 0 ? `${item.stock} available` : "Out of stock"}
                </p>

                <div className="wishlist-actions">
                  <button
                    type="button"
                    className="wishlist-move-btn"
                    disabled={
                      busyItemId === item._id ||
                      item.availability !== "available" ||
                      !(item.stock > 0) ||
                      item.quantity > item.stock
                    }
                    onClick={() => handleMoveToCart(item)}
                  >
                    <ShoppingBag size={16} />
                    {busyItemId === item._id
                      ? "Please wait..."
                      : "Move to Cart"}
                  </button>

                  <button
                    type="button"
                    className="wishlist-remove-btn"
                    disabled={busyItemId === item._id}
                    onClick={() => handleRemove(item)}
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={17} />
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
