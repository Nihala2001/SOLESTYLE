
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ShoppingBag, CreditCard, ArrowLeft } from "lucide-react";

import { getAddresses } from "../api/services/userService";
import { getCart } from "../api/services/userCartService";
import { createOrder } from "../api/services/userOrderService";
import NotificationModal from "../components/common/NotificationModal";

import "./Checkout.css";

function Checkout() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showNotification = (title, message, type = "info") => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  useEffect(() => {
    const loadCheckout = async () => {
      try {
        const [addressResponse, cartResponse] = await Promise.all([
          getAddresses(),
          getCart(),
        ]);

        const addressList = addressResponse.addresses || [];
        const cartItems = cartResponse.cart?.items || [];

        setAddresses(addressList);
        setItems(cartItems);

        const defaultAddress = addressList.find(
          (address) => address.isDefault
        );

        setSelectedAddress(
          defaultAddress?._id || addressList[0]?._id || ""
        );
      } catch (error) {
        showNotification(
          "Unable to load checkout",
          error.response?.data?.message ||
            "Please log in and try again.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCheckout();
  }, []);

  const subtotal = items.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const shippingFee = 0;
  const total = subtotal + shippingFee;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      showNotification(
        "Delivery address required",
        "Please add a delivery address before placing your order.",
        "error"
      );
      return;
    }

    if (items.length === 0) {
      showNotification(
        "Your cart is empty",
        "Add products to your cart before checking out.",
        "error"
      );
      return;
    }

    // UPI needs payment-gateway integration and server-side
    // payment verification before it can be used safely.
    if (paymentMethod === "UPI") {
      showNotification(
        "UPI payment unavailable",
        "UPI payment integration is not connected yet. Please choose Cash on Delivery.",
        "info"
      );
      return;
    }

    try {
      setPlacingOrder(true);

      const response = await createOrder(selectedAddress, paymentMethod);

      if (!response.success) {
        throw new Error(response.message || "Failed to place order");
      }

      setCompletedOrder(response.order);
      setItems([]);
    } catch (error) {
      showNotification(
        "Order failed",
        error.response?.data?.message ||
          error.message ||
          "Unable to place your order. Please try again.",
        "error"
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <p className="checkout-loading">Loading checkout...</p>
      </div>
    );
  }

  if (completedOrder) {
    return (
      <div className="checkout-page">
        <div className="checkout-success">
          <div className="checkout-success-icon">✓</div>
          <h1>Order placed successfully!</h1>
          <p>Thank you for shopping with SOLESTYLE.</p>

          <div className="checkout-order-number">
            <span>Order number</span>
            <strong>{completedOrder.orderNumber}</strong>
          </div>

          <p>
            Payment method:{" "}
            <strong>{completedOrder.paymentMethod}</strong>
          </p>
          <p>
            Total:{" "}
            <strong>
              ₹{Number(completedOrder.totalAmount).toFixed(2)}
            </strong>
          </p>

          <button
            className="checkout-primary-button"
            onClick={() => navigate("/products")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <button
        className="checkout-back-button"
        onClick={() => navigate("/cart")}
      >
        <ArrowLeft size={18} />
        Back to Cart
      </button>

      <h1 className="checkout-title">Checkout</h1>

      <div className="checkout-layout">
        <div className="checkout-main">
          <section className="checkout-section">
            <div className="checkout-section-heading">
              <MapPin size={21} />
              <h2>Delivery Address</h2>
            </div>

            {addresses.length === 0 ? (
              <div className="checkout-empty-address">
                <p>You haven't added a delivery address yet.</p>
                <button
                  className="checkout-primary-button"
                  onClick={() => navigate("/profile")}
                >
                  Add Address in Profile
                </button>
              </div>
            ) : (
              <>
                <div className="checkout-address-list">
                  {addresses.map((address) => (
                    <label
                      key={address._id}
                      className={`checkout-address-card ${
                        selectedAddress === address._id
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryAddress"
                        value={address._id}
                        checked={selectedAddress === address._id}
                        onChange={() => setSelectedAddress(address._id)}
                      />

                      <div>
                        <div className="checkout-address-title">
                          <strong>{address.fullName}</strong>
                          <span>{address.addressType}</span>
                          {address.isDefault && (
                            <span className="checkout-default-badge">
                              Default
                            </span>
                          )}
                        </div>

                        <p>{address.addressLine}</p>
                        <p>
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p>Phone: {address.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  className="checkout-text-button"
                  onClick={() => navigate("/profile#addresses")}
                >
                  Manage or Add Addresses
                </button>
              </>
            )}
          </section>

          <section className="checkout-section">
            <div className="checkout-section-heading">
              <CreditCard size={21} />
              <h2>Payment Method</h2>
            </div>

            <label
              className={`checkout-payment-card ${
                paymentMethod === "COD" ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
              />
              <div>
                <strong>Cash on Delivery</strong>
                <p>Pay when your order arrives.</p>
              </div>
            </label>

            <label
              className={`checkout-payment-card ${
                paymentMethod === "UPI" ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="UPI"
                checked={paymentMethod === "UPI"}
                onChange={() => setPaymentMethod("UPI")}
              />
              <div>
                <strong>UPI Payment</strong>
                <p>Online payment integration is coming soon.</p>
              </div>
            </label>
          </section>
        </div>

        <aside className="checkout-summary">
          <div className="checkout-section-heading">
            <ShoppingBag size={21} />
            <h2>Order Summary</h2>
          </div>

          {items.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <div className="checkout-items">
              {items.map((item, index) => (
                <div
                  className="checkout-item"
                  key={item._id || item.variantId || index}
                >
                  <div className="checkout-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.product?.name || "Shoe"} />
                    ) : (
                      <ShoppingBag size={24} />
                    )}
                  </div>

                  <div className="checkout-item-info">
                    <strong>{item.product?.name || "Product"}</strong>
                    <span>
                      {item.color} {item.size ? `· Size ${item.size}` : ""}
                    </span>
                    <span>Qty: {item.quantity}</span>
                  </div>

                  <strong>
                    ₹
                    {(
                      Number(item.price || 0) * Number(item.quantity || 0)
                    ).toFixed(2)}
                  </strong>
                </div>
              ))}
            </div>
          )}

          <div className="checkout-price-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="checkout-price-row">
            <span>Shipping</span>
            <span>{shippingFee === 0 ? "FREE" : `₹${shippingFee}`}</span>
          </div>

          <div className="checkout-price-row checkout-total-row">
            <strong>Total</strong>
            <strong>₹{total.toFixed(2)}</strong>
          </div>

          <button
            className="checkout-primary-button checkout-place-order"
            onClick={handlePlaceOrder}
            disabled={
              placingOrder ||
              items.length === 0 ||
              addresses.length === 0
            }
          >
            {placingOrder ? "Placing Order..." : "Place Order"}
          </button>

          <p className="checkout-secure-note">
            Your order will be created after the server validates your cart.
          </p>
        </aside>
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() =>
          setNotification((previous) => ({
            ...previous,
            isOpen: false,
          }))
        }
        title={notification.title}
        message={notification.message}
        type={notification.type}
        duration={3000}
      />
    </div>
  );
}

export default Checkout;