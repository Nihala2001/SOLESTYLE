import { useEffect, useState } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import NotificationModal from "../components/common/NotificationModal";
import {
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
} from "../api/services/adminOrderService";
import ConfirmationModal from "../components/common/ConfirmationModal";
import "./AdminOrders.css";

const ORDER_STATUSES = [
  "Placed",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Returned",
];

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
  });

  const [notification, setNotification] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
  });

  const showNotification = (title, message, type = "success") => {
    setNotification({ show: true, title, message, type });
  };

  const closeNotification = () => {
    setNotification((previous) => ({ ...previous, show: false }));
  };

  const [paymentConfirmation, setPaymentConfirmation] = useState({
    isOpen: false,
    orderId: null,
  });

  const fetchOrders = async (
    searchValue = search,
    statusValue = status,
    pageNumber = 1,
  ) => {
    try {
      setLoading(true);

      const data = await getAllOrders({
        search: searchValue,
        status: statusValue,
        page: pageNumber,
        limit: 5,
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch orders");
      }

      setOrders(data.orders || []);
      setPagination(
        data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalOrders: 0,
        },
      );
    } catch (error) {
      console.error("Fetch orders error:", error);

      showNotification(
        "Failed to Load Orders",
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch orders",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders("", "", 1);
  }, []);

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearch(value);
    fetchOrders(value, status, 1);
  };

  const handleStatusFilter = (event) => {
    const value = event.target.value;
    setStatus(value);
    fetchOrders(search, value, 1);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const data = await updateOrderStatus(orderId, newStatus);

      if (!data.success) {
        showNotification(
          "Update Failed",
          data.message || "Failed to update order status",
          "error",
        );
        return;
      }

      showNotification(
        "Status Updated",
        "Order status updated successfully.",
        "success",
      );

      await fetchOrders(search, status, pagination.currentPage);
    } catch (error) {
      console.error("Update order status error:", error);

      showNotification(
        "Update Failed",
        error.response?.data?.message || "Failed to update order status",
        "error",
      );

      await fetchOrders(search, status, pagination.currentPage);
    }
  };

  const handlePaymentUpdate = async (orderId) => {
    try {
      const data = await updatePaymentStatus(orderId, "Paid");

      if (!data.success) {
        showNotification(
          "Payment Update Failed",
          data.message || "Failed to update payment status",
          "error",
        );
        return;
      }

      showNotification(
        "Payment Updated",
        "Payment status marked as Paid.",
        "success",
      );

      await fetchOrders(search, status, pagination.currentPage);
    } catch (error) {
      console.error("Update payment status error:", error);

      showNotification(
        "Payment Update Failed",
        error.response?.data?.message || "Failed to update payment status",
        "error",
      );

      await fetchOrders(search, status, pagination.currentPage);
    }
  };

  return (
    <AdminLayout title="Order Management">
      {" "}
      <NotificationModal
        isOpen={notification.show}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
      />
      <div className="admin-orders-header">
        <div>
          <h1>Orders</h1>
          <p>View customer orders and manage order status.</p>
        </div>

        <div className="admin-orders-count">
          {pagination.totalOrders} Orders
        </div>
      </div>
      <div className="admin-orders-card">
        <div className="admin-orders-toolbar">
          <div className="admin-orders-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search order number or customer..."
              value={search}
              onChange={handleSearch}
            />
          </div>

          <select value={status} onChange={handleStatusFilter}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((orderStatus) => (
              <option key={orderStatus} value={orderStatus}>
                {orderStatus}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="admin-orders-empty">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="admin-orders-empty">
            <h3>No orders found</h3>
            <p>Orders matching your search will appear here.</p>
          </div>
        ) : (
          <>
            <div className="admin-orders-table-wrapper">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Update Status</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <strong>
                          {order.orderNumber || order._id.slice(-8)}
                        </strong>
                      </td>

                      <td>
                        <div className="admin-order-customer">
                          <strong>{order.userId?.name || "Customer"}</strong>
                          <span>{order.userId?.email || "—"}</span>
                        </div>
                      </td>

                      <td>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>₹{Number(order.totalAmount || 0).toFixed(2)}</td>

                      <td>
                        <div className="admin-order-customer">
                          <span>{order.paymentMethod || "—"}</span>
                          <span>{order.paymentStatus || "Pending"}</span>

                          {order.paymentStatus !== "Paid" &&
                            !["Cancelled", "Returned"].includes(
                              order.orderStatus,
                            ) && (
                              <button
                                type="button"
                                className="admin-order-payment-btn"
                                onClick={() =>
                                  setPaymentConfirmation({
                                    isOpen: true,
                                    orderId: order._id,
                                  })
                                }
                              >
                                Mark as Paid
                              </button>
                            )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-order-status status-${(
                            order.orderStatus || "placed"
                          )
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {order.orderStatus || "Placed"}
                        </span>
                      </td>

                      <td>
                        <select
                          className="admin-order-status-select"
                          value={order.orderStatus || "Placed"}
                          disabled={["Cancelled", "Returned"].includes(
                            order.orderStatus,
                          )}
                          onChange={(event) =>
                            handleStatusUpdate(order._id, event.target.value)
                          }
                        >
                          {ORDER_STATUSES.map((orderStatus) => (
                            <option key={orderStatus} value={orderStatus}>
                              {orderStatus}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-orders-pagination">
              <button
                onClick={() =>
                  fetchOrders(search, status, pagination.currentPage - 1)
                }
                disabled={pagination.currentPage <= 1}
              >
                Previous
              </button>

              <span>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() =>
                  fetchOrders(search, status, pagination.currentPage + 1)
                }
                disabled={pagination.currentPage >= pagination.totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>


<ConfirmationModal
  isOpen={paymentConfirmation.isOpen}
  title="Confirm Payment"
  message="Have you confirmed that the payment has actually been received?"
  confirmText="Yes, Mark as Paid"
  cancelText="Cancel"
  onCancel={() =>
    setPaymentConfirmation({
      isOpen: false,
      orderId: null,
    })
  }
  onConfirm={async () => {
    const orderId = paymentConfirmation.orderId;

    setPaymentConfirmation({
      isOpen: false,
      orderId: null,
    });

    if (orderId) {
      await handlePaymentUpdate(orderId);
    }
  }}
/>
</AdminLayout>
  );
}

export default AdminOrders;
