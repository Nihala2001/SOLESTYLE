import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  ShoppingBag,
  CreditCard,
  ArrowLeft,
  Wallet,
} from "lucide-react";

import { getAddresses } from "../api/services/userService";
import { getCart } from "../api/services/userCartService";
import { createOrder } from "../api/services/userOrderService";
import { getAvailableCoupons } from "../api/services/userCouponService";
import { getWallet } from "../api/services/userWalletService";

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

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState(false);

  const showNotification = (title, message, type = "info") => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  // ================= LOAD ADDRESSES AND CART =================

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
          (address) => address.isDefault,
        );

        setSelectedAddress(
          defaultAddress?._id || addressList[0]?._id || "",
        );
      } catch (error) {
        showNotification(
          "Unable to load checkout",
          error.response?.data?.message ||
            "Please log in and try again.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };

    loadCheckout();
  }, []);

  // ================= LOAD WALLET =================

  useEffect(() => {
    const loadWallet = async () => {
      try {
        setWalletLoading(true);
        setWalletError(false);

        const response = await getWallet();

        setWalletBalance(
          Number(response.wallet?.balance ?? 0),
        );
      } catch (error) {
        console.error("Failed to load wallet:", error);

        setWalletBalance(0);
        setWalletError(true);
      } finally {
        setWalletLoading(false);
      }
    };

    loadWallet();
  }, []);

  // ================= LOAD AVAILABLE COUPONS =================

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setCouponLoading(true);

        const response = await getAvailableCoupons();

        setAvailableCoupons(response.coupons || []);
      } catch (error) {
        console.error("Failed to load available coupons:", error);
      } finally {
        setCouponLoading(false);
      }
    };

    loadCoupons();
  }, []);

  // ================= PRICE CALCULATIONS =================

  const subtotal = items.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );

  const shippingFee = 0;

  const discount = appliedCoupon
    ? Math.min(
        subtotal,
        appliedCoupon.discountType === "Percentage"
          ? Math.min(
              (subtotal * Number(appliedCoupon.discountValue)) / 100,
              appliedCoupon.maxDiscount ?? Infinity,
            )
          : Number(appliedCoupon.discountValue || 0),
      )
    : 0;

  const total = Math.max(
    0,
    subtotal - discount + shippingFee,
  );

  const hasSufficientWalletBalance = walletBalance >= total;

  // ================= APPLY COUPON =================

  const handleApplyCoupon = () => {
    const enteredCode = couponCode.trim().toUpperCase();

    if (!enteredCode) {
      showNotification(
        "Coupon required",
        "Please enter a coupon code.",
        "error",
      );
      return;
    }

    const coupon = availableCoupons.find(
      (item) => item.code.toUpperCase() === enteredCode,
    );

    if (!coupon) {
      showNotification(
        "Invalid coupon",
        "This coupon is unavailable or has expired.",
        "error",
      );
      return;
    }

    if (subtotal < Number(coupon.minOrderAmount || 0)) {
      showNotification(
        "Minimum order amount not reached",
        `This coupon requires a minimum order of ₹${Number(
          coupon.minOrderAmount || 0,
        ).toFixed(2)}.`,
        "error",
      );
      return;
    }

    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);

    showNotification(
      "Coupon applied",
      `${coupon.code} has been applied successfully.`,
      "success",
    );
  };

  // ================= REMOVE COUPON =================

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");

    showNotification(
      "Coupon removed",
      "The coupon discount has been removed.",
      "info",
    );
  };

  // ================= PLACE ORDER =================

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      showNotification(
        "Delivery address required",
        "Please add a delivery address before placing your order.",
        "error",
      );
      return;
    }

    if (items.length === 0) {
      showNotification(
        "Your cart is empty",
        "Add products to your cart before checking out.",
        "error",
      );
      return;
    }

    // UPI requires a verified payment-gateway integration.
    if (paymentMethod === "UPI") {
      showNotification(
        "UPI payment unavailable",
        "UPI payment integration is not connected yet. Please choose Cash on Delivery or Wallet.",
        "info",
      );
      return;
    }

    // Do not attempt wallet payment while its balance is unknown.
    if (paymentMethod === "WALLET") {
      if (walletLoading) {
        showNotification(
          "Please wait",
          "Your wallet balance is still loading.",
          "info",
        );
        return;
      }

      if (walletError) {
        showNotification(
          "Wallet unavailable",
          "Unable to load your wallet balance. Please try again.",
          "error",
        );
        return;
      }

      if (!hasSufficientWalletBalance) {
        showNotification(
          "Insufficient wallet balance",
          `Your wallet balance is ₹${walletBalance.toFixed(
            2,
          )}, but your order total is ₹${total.toFixed(
            2,
          )}. Please choose another payment method.`,
          "error",
        );
        return;
      }
    }

    try {
      setPlacingOrder(true);

      const response = await createOrder(
        selectedAddress,
        paymentMethod,
        appliedCoupon?.code || null,
      );

      if (!response.success || !response.order) {
        throw new Error(
          response.message || "Failed to place order",
        );
      }

      setCompletedOrder(response.order);
      setItems([]);

      // Reflect the successful wallet payment in the checkout UI.
      // The server remains responsible for the actual deduction.
      if (paymentMethod === "WALLET") {
        if (response.wallet?.balance !== undefined) {
          setWalletBalance(Number(response.wallet.balance));
        } else {
          setWalletBalance((previous) =>
            Math.max(0, previous - Number(response.order.totalAmount)),
          );
        }
      }
    } catch (error) {
      showNotification(
        "Order failed",
        error.response?.data?.message ||
          error.message ||
          "Unable to place your order. Please try again.",
        "error",
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // ================= LOADING SCREEN =================

  if (loading) {
    return (
      <div className="checkout-page">
        <p className="checkout-loading">
          Loading checkout...
        </p>
      </div>
    );
  }

  // ================= ORDER SUCCESS SCREEN =================

  if (completedOrder) {
    return (
      <div className="checkout-page">
        <div className="checkout-success">
          <div className="checkout-success-icon">✓</div>

          <h1>Order placed successfully!</h1>

          <p>
            Thank you for shopping with SOLESTYLE.
          </p>

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

          {completedOrder.paymentMethod === "WALLET" && (
            <p>
              <Wallet size={16} style={{ verticalAlign: "middle" }} />{" "}
              Paid using your SOLESTYLE Wallet.
            </p>
          )}

          <button
            className="checkout-primary-button"
            onClick={() =>
              navigate(`/orders/${completedOrder._id}/track`)
            }
          >
            Track Order
          </button>

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

  // ================= CHECKOUT PAGE =================

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
          {/* DELIVERY ADDRESS */}

          <section className="checkout-section">
            <div className="checkout-section-heading">
              <MapPin size={21} />
              <h2>Delivery Address</h2>
            </div>

            {addresses.length === 0 ? (
              <div className="checkout-empty-address">
                <p>
                  You haven't added a delivery address yet.
                </p>

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
                        checked={
                          selectedAddress === address._id
                        }
                        onChange={() =>
                          setSelectedAddress(address._id)
                        }
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
                          {address.city}, {address.state} -{" "}
                          {address.pincode}
                        </p>

                        <p>Phone: {address.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  className="checkout-text-button"
                  onClick={() =>
                    navigate("/profile#addresses")
                  }
                >
                  Manage or Add Addresses
                </button>
              </>
            )}
          </section>

          {/* PAYMENT METHODS */}

          <section className="checkout-section">
            <div className="checkout-section-heading">
              <CreditCard size={21} />
              <h2>Payment Method</h2>
            </div>

            {/* CASH ON DELIVERY */}

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

            {/* UPI */}

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
                <p>
                  Online payment integration is coming soon.
                </p>
              </div>
            </label>

            {/* WALLET */}

            <label
              className={`checkout-payment-card ${
                paymentMethod === "WALLET" ? "selected" : ""
              }`}
              style={{
                border:
                  paymentMethod === "WALLET"
                    ? "1px solid #c2185b"
                    : undefined,
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="WALLET"
                checked={paymentMethod === "WALLET"}
                onChange={() => setPaymentMethod("WALLET")}
                disabled={walletLoading || walletError}
              />

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Wallet size={20} color="#c2185b" />
                  <strong>SOLESTYLE Wallet</strong>
                </div>

                {walletLoading ? (
                  <p>Loading wallet balance...</p>
                ) : walletError ? (
                  <p style={{ color: "#c62828" }}>
                    Unable to load wallet. Please try again.
                  </p>
                ) : (
                  <>
                    <p>
                      Available balance:{" "}
                      <strong>
                        ₹{walletBalance.toFixed(2)}
                      </strong>
                    </p>

                    {paymentMethod === "WALLET" &&
                      !hasSufficientWalletBalance && (
                        <p
                          style={{
                            color: "#c62828",
                            fontSize: "13px",
                            marginTop: "6px",
                          }}
                        >
                          Insufficient balance. You need ₹
                          {Math.max(
                            0,
                            total - walletBalance,
                          ).toFixed(2)}{" "}
                          more.
                        </p>
                      )}

                    {paymentMethod === "WALLET" &&
                      hasSufficientWalletBalance && (
                        <p
                          style={{
                            color: "#2e7d32",
                            fontSize: "13px",
                            marginTop: "6px",
                          }}
                        >
                          Your wallet can cover this order.
                        </p>
                      )}
                  </>
                )}
              </div>
            </label>

            {paymentMethod === "WALLET" &&
              !walletLoading &&
              !walletError &&
              !hasSufficientWalletBalance && (
                <button
                  type="button"
                  className="checkout-text-button"
                  onClick={() => navigate("/wallet")}
                >
                  View Wallet
                </button>
              )}
          </section>
        </div>

        {/* ORDER SUMMARY */}

        <aside className="checkout-summary">
          <div className="checkout-section-heading">
            <ShoppingBag size={21} />
            <h2>Order Summary</h2>
          </div>

          {/* COUPON SECTION */}

          <div
            style={{
              margin: "16px 0",
              padding: "14px",
              border: "1px solid #e5d5cc",
              borderRadius: "10px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Apply Coupon
            </h3>

            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              <input
                type="text"
                value={couponCode}
                onChange={(event) =>
                  setCouponCode(
                    event.target.value.toUpperCase(),
                  )
                }
                placeholder="Enter coupon code"
                disabled={
                  Boolean(appliedCoupon) || couponLoading
                }
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "10px",
                  border: "1px solid #d6c4bb",
                  borderRadius: "6px",
                }}
              />

              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="checkout-text-button"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  className="checkout-primary-button"
                  disabled={
                    couponLoading || items.length === 0
                  }
                  onClick={handleApplyCoupon}
                >
                  {couponLoading ? "Loading..." : "Apply"}
                </button>
              )}
            </div>

            {availableCoupons.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <p style={{ marginBottom: "8px" }}>
                  Available coupons:
                </p>

                {availableCoupons.map((coupon) => (
                  <button
                    key={coupon._id || coupon.code}
                    type="button"
                    onClick={() => {
                      setCouponCode(coupon.code);

                      if (appliedCoupon) {
                        setAppliedCoupon(null);
                      }
                    }}
                    disabled={Boolean(appliedCoupon)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "9px",
                      marginBottom: "6px",
                      background: "#fff8f5",
                      border: "1px dashed #d6b7a8",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <strong>{coupon.code}</strong>
                    {" — "}
                    {coupon.discountType === "Percentage"
                      ? `${coupon.discountValue}% off`
                      : `₹${coupon.discountValue} off`}

                    {Number(coupon.minOrderAmount) > 0 &&
                      ` (Min. order ₹${Number(
                        coupon.minOrderAmount,
                      ).toFixed(2)})`}
                  </button>
                ))}
              </div>
            )}

            {availableCoupons.length === 0 && (
              <p style={{ fontSize: "13px" }}>
                {couponLoading
                  ? "Loading available coupons..."
                  : "No coupons are currently available."}
              </p>
            )}
          </div>

          {/* CART ITEMS */}

          {items.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <div className="checkout-items">
              {items.map((item, index) => (
                <div
                  className="checkout-item"
                  key={
                    item._id || item.variantId || index
                  }
                >
                  <div className="checkout-item-image">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.product?.name || "Shoe"}
                      />
                    ) : (
                      <ShoppingBag size={24} />
                    )}
                  </div>

                  <div className="checkout-item-info">
                    <strong>
                      {item.product?.name || "Product"}
                    </strong>

                    <span>
                      {item.color}
                      {item.size
                        ? ` · Size ${item.size}`
                        : ""}
                    </span>

                    <span>Qty: {item.quantity}</span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    {Number(item.offerDiscount || 0) > 0 && (
                      <div
                        style={{
                          textDecoration: "line-through",
                          color: "#888",
                          fontSize: "13px",
                        }}
                      >
                        ₹
                        {(
                          Number(item.originalPrice || 0) *
                          Number(item.quantity || 0)
                        ).toFixed(2)}
                      </div>
                    )}

                    <strong>
                      ₹
                      {(
                        Number(item.price || 0) *
                        Number(item.quantity || 0)
                      ).toFixed(2)}
                    </strong>

                    {Number(item.offerDiscount || 0) > 0 && (
                      <div
                        style={{
                          color: "#c2185b",
                          fontSize: "12px",
                          marginTop: "4px",
                        }}
                      >
                        Offer savings: ₹
                        {(
                          Number(item.offerDiscount || 0) *
                          Number(item.quantity || 0)
                        ).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PRICE BREAKDOWN */}

          <div className="checkout-price-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="checkout-price-row">
            <span>Shipping</span>
            <span>
              {shippingFee === 0
                ? "FREE"
                : `₹${shippingFee.toFixed(2)}`}
            </span>
          </div>

          {appliedCoupon && (
            <div className="checkout-price-row">
              <span>
                Discount ({appliedCoupon.code})
              </span>

              <span style={{ color: "green" }}>
                -₹{discount.toFixed(2)}
              </span>
            </div>
          )}

          <div className="checkout-price-row checkout-total-row">
            <strong>Total</strong>
            <strong>₹{total.toFixed(2)}</strong>
          </div>

          {paymentMethod === "WALLET" && (
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                borderRadius: "8px",
                background: hasSufficientWalletBalance
                  ? "#f0f8f0"
                  : "#fff1f1",
                color: hasSufficientWalletBalance
                  ? "#2e7d32"
                  : "#c62828",
                fontSize: "14px",
              }}
            >
              <div>
                Wallet balance: ₹{walletBalance.toFixed(2)}
              </div>

              <div>
                Order total: ₹{total.toFixed(2)}
              </div>

              {hasSufficientWalletBalance && !walletError && (
                <div>
                  Balance after payment: ₹
                  {(walletBalance - total).toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* PLACE ORDER */}

          <button
            className="checkout-primary-button checkout-place-order"
            onClick={handlePlaceOrder}
            disabled={
              placingOrder ||
              items.length === 0 ||
              addresses.length === 0 ||
              (paymentMethod === "WALLET" &&
                (walletLoading ||
                  walletError ||
                  !hasSufficientWalletBalance))
            }
          >
            {placingOrder
              ? "Placing Order..."
              : paymentMethod === "WALLET"
                ? "Pay with Wallet"
                : "Place Order"}
          </button>

          <p className="checkout-secure-note">
            Your order will be created after the server
            validates your cart and payment method.
          </p>
        </aside>
      </div>

      {/* NOTIFICATION MODAL */}

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