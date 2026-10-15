
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMyOrders } from "../api/services/userOrderService";
import "./OrderTracking.css";

const orderStatuses = [
  "Placed",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getMyOrders();

        if (!response.success) {
          throw new Error(response.message || "Unable to fetch order");
        }

        const foundOrder = response.orders.find(
          (item) => item._id === orderId
        );

        if (!foundOrder) {
          setError("Order not found.");
          return;
        }

        setOrder(foundOrder);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load order details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <div className="order-tracking-page">Loading order...</div>;
  }

  if (error || !order) {
    return (
      <div className="order-tracking-page">
        <h2>Unable to track order</h2>
        <p>{error || "Order not found."}</p>
        <button onClick={() => navigate("/profile")}>
          Back to My Account
        </button>
      </div>
    );
  }

  const isCancelled = order.orderStatus === "Cancelled";
  const isReturned = order.orderStatus === "Returned";
  const isReturnRequested = order.orderStatus === "Return Requested";
  const currentIndex = orderStatuses.indexOf(order.orderStatus);

  return (
    <div className="order-tracking-page">
      <div className="order-tracking-card">
        <button
          className="tracking-back-button"
          onClick={() => navigate("/profile")}
        >
          ← My Account
        </button>

        <h1>Track Your Order</h1>
        <p className="tracking-order-number">
          Order number: <strong>{order.orderNumber}</strong>
        </p>

        <div className="tracking-summary">
          <span>Order total</span>
          <strong>₹{Number(order.totalAmount).toFixed(2)}</strong>
        </div>

        <div className="tracking-summary">
          <span>Payment method</span>
          <strong>{order.paymentMethod}</strong>
        </div>

        <div className="tracking-summary">
          <span>Current status</span>
          <strong>{order.orderStatus}</strong>
        </div>

        {isCancelled || isReturned || isReturnRequested ? (
          <div className="tracking-special-status">
            {isCancelled
              ? "This order has been cancelled."
              : isReturned
                ? "This order has been returned."
                : "Your return request is being reviewed."}
          </div>
        ) : (
          <div className="tracking-timeline">
            {orderStatuses.map((status, index) => {
              const completed = currentIndex >= index;

              return (
                <div
                  className={`tracking-step ${
                    completed ? "completed" : ""
                  }`}
                  key={status}
                >
                  <div className="tracking-step-icon">
                    {completed ? "✓" : index + 1}
                  </div>

                  <div className="tracking-step-content">
                    <strong>{status}</strong>
                    {index === currentIndex && (
                      <span>Current order status</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <h3>Items in this order</h3>

        {order.items.map((item, index) => (
          <div
            className="tracking-product"
            key={`${item.productId}-${index}`}
          >
            {item.image && (
              <img src={item.image} alt={item.productName} />
            )}

            <div>
              <strong>{item.productName}</strong>
              <p>
                Color: {item.color || "N/A"} · Size: {item.size || "N/A"}
              </p>
              <p>Quantity: {item.quantity}</p>
              <p>₹{Number(item.price).toFixed(2)}</p>
            </div>
          </div>
        ))}

        <h3>Delivery address</h3>
        <p>{order.shippingAddress.fullName}</p>
        <p>{order.shippingAddress.addressLine}</p>
        <p>
          {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
          {order.shippingAddress.pincode}
        </p>
        <p>Phone: {order.shippingAddress.phone}</p>
      </div>
    </div>
  );
}

export default OrderTracking;