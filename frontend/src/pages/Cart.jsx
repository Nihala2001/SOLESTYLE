import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Heart,
} from "lucide-react";

import {
  getCart,
  updateCartItem,
  removeCartItem,
  addToCart,
} from "../api/services/userCartService";

import { addToWishlist } from "../api/services/userWishlistService";

import NotificationModal from "../components/common/NotificationModal";
import "./Cart.css";

function Cart() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState("");
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

  const fetchCart = async () => {
    try {
      const result = await getCart();

      if (result.success) {
        setItems(result.cart?.items || []);
      } else {
        showNotification(
          "Cart Error",
          result.message || "Unable to load your cart.",
          "error",
        );
      }
    } catch (err) {
      showNotification(
        "Cart Error",
        err.response?.data?.message || "Unable to load your cart.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const groupedItems = Object.values(
    items.reduce((groups, item) => {
      const key = String(item.variantId);

      if (!groups[key]) {
        groups[key] = {
          ...item,
          originalItemIds: [item._id],
        };
      } else {
        groups[key].quantity += item.quantity;
        groups[key].originalItemIds.push(item._id);
      }

      return groups;
    }, {}),
  );

  const totalItems = groupedItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const totalPrice = groupedItems.reduce(
    (total, item) => total + Number(item.price || 0) * item.quantity,
    0,
  );

  const changeQuantity = async (item, quantity) => {
    if (quantity < 1 || quantity > item.stock) return;

    if (item.originalItemIds.length > 1) {
      showNotification(
        "Cart Update",
        "This variant has duplicate cart entries. Please remove it and add it again.",
        "info",
      );
      return;
    }

    try {
      setUpdatingItem(item.variantId);

      const result = await updateCartItem(item._id, quantity);

      if (result.success) {
        setItems(result.cart?.items || []);
        showNotification("Cart Updated", "Quantity updated successfully.");
      } else {
        showNotification(
          "Update Failed",
          result.message || "Unable to update quantity.",
          "error",
        );
      }
    } catch (err) {
      showNotification(
        "Update Failed",
        err.response?.data?.message || "Unable to update quantity.",
        "error",
      );
    } finally {
      setUpdatingItem("");
    }
  };

  const handleRemove = async (item) => {
    try {
      setUpdatingItem(item.variantId);

      for (const itemId of item.originalItemIds) {
        const result = await removeCartItem(itemId);

        if (!result.success) {
          throw new Error(result.message || "Unable to remove item from cart.");
        }
      }

      const refreshed = await getCart();
      setItems(refreshed.cart?.items || []);

      showNotification(
        "Item Removed",
        "Product removed from your cart successfully.",
      );
    } catch (err) {
      await fetchCart();

      showNotification(
        "Remove Failed",
        err.response?.data?.message ||
          err.message ||
          "Unable to remove item from cart.",
        "error",
      );
    } finally {
      setUpdatingItem("");
    }
  };

  const handleMoveToWishlist = async (item) => {
    try {
      setUpdatingItem(item.variantId);

      if (!item.variantId) {
        throw new Error("Product variant could not be found.");
      }

      // Save to wishlist first. Do not remove from cart before this succeeds.
      const wishlistResult = await addToWishlist(item.variantId, item.quantity);

      if (!wishlistResult.success) {
        throw new Error(
          wishlistResult.message || "Could not add item to wishlist.",
        );
      }

      // Only after wishlist save succeeds, remove cart entries.
      for (const itemId of item.originalItemIds) {
        const cartResult = await removeCartItem(itemId);

        if (!cartResult.success) {
          await fetchCart();

          showNotification(
            "Partially Completed",
            "Item was saved to your wishlist, but could not be fully removed from your cart.",
            "error",
          );
          return;
        }
      }

      const refreshed = await getCart();
      setItems(refreshed.cart?.items || []);

      showNotification(
        "Moved to Wishlist",
        "Product saved to your wishlist successfully.",
      );
    } catch (err) {
      showNotification(
        "Wishlist Error",
        err.response?.data?.message ||
          err.message ||
          "Could not move product to wishlist.",
        "error",
      );
    } finally {
      setUpdatingItem("");
    }
  };

  if (loading) {
    return <div className="cart-loading">Loading your cart...</div>;
  }

  return (
    <div className="cart-page">
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        duration={2000}
      />

      <button
        type="button"
        className="cart-back-button"
        onClick={() => navigate("/products")}
      >
        <ArrowLeft size={18} />
        Continue Shopping
      </button>

      <h1>My Shopping Cart</h1>

      <p className="cart-subtitle">
        {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
      </p>

      {groupedItems.length === 0 ? (
        <div className="cart-empty">
          <ShoppingBag size={55} />
          <h2>Your cart is empty</h2>
          <p>Discover your favourite footwear at SOLESTYLE.</p>

          <button type="button" onClick={() => navigate("/products")}>
            Shop Now
          </button>

          <button type="button" onClick={() => navigate("/wishlist")}>
            View Wishlist
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {groupedItems.map((item) => (
              <div className="cart-item" key={item.variantId}>
                <img
                  className="cart-item-image"
                  src={item.image || "/placeholder.png"}
                  alt={item.product?.name || "Product"}
                />

                <div className="cart-item-details">
                  <h3>{item.product?.name || "Footwear"}</h3>
                  <p>Color: {item.color}</p>
                  <p>Size: {item.size}</p>

                  <div className="cart-item-price">
                    {Number(item.offerDiscount || 0) > 0 && (
                      <span
                        style={{
                          textDecoration: "line-through",
                          color: "#888",
                          marginRight: "8px",
                          fontWeight: "normal",
                        }}
                      >
                        ₹
                        {Number(item.originalPrice || 0).toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    )}

                    <strong>
                      ₹{Number(item.price || 0).toLocaleString("en-IN")}
                    </strong>

                    {Number(item.offerDiscount || 0) > 0 && (
                      <span
                        style={{
                          display: "block",
                          color: "#c2185b",
                          fontSize: "13px",
                          marginTop: "4px",
                        }}
                      >
                        Offer savings: ₹
                        {Number(item.offerDiscount || 0).toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    )}
                  </div>
                  <div className="cart-quantity">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={
                        updatingItem === item.variantId || item.quantity <= 1
                      }
                      onClick={() => changeQuantity(item, item.quantity - 1)}
                    >
                      <Minus size={16} />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={
                        updatingItem === item.variantId ||
                        item.quantity >= item.stock
                      }
                      onClick={() => changeQuantity(item, item.quantity + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="cart-item-actions">
                    <button
                      type="button"
                      className="cart-remove-button"
                      disabled={updatingItem === item.variantId}
                      onClick={() => handleRemove(item)}
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>

                    <button
                      type="button"
                      className="cart-wishlist-button"
                      disabled={updatingItem === item.variantId}
                      onClick={() => handleMoveToWishlist(item)}
                    >
                      <Heart size={16} />
                      Move to Wishlist
                    </button>
                  </div>
                </div>

                <p className="cart-item-subtotal">
                  ₹
                  {Number(
                    Number(item.price || 0) * item.quantity,
                  ).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>

            <div className="cart-summary-row">
              <span>Total Items</span>
              <span>{totalItems}</span>
            </div>

            <div className="cart-summary-row cart-total">
              <span>Total</span>
              <span>₹{totalPrice.toLocaleString("en-IN")}</span>
            </div>

            <button
              type="button"
              className="cart-checkout-button"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
