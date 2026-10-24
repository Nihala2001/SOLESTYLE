import { Fragment, useEffect, useState } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import NotificationModal from "../components/common/NotificationModal";
import ConfirmationModal from "../components/common/ConfirmationModal";
import {
  getAllOrders,
  updatePaymentStatus,
  updateOrderItemStatus,
} from "../api/services/adminOrderService";
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

const DELIVERY_STATUSES = [
  "Placed",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "—");

const getStatusClass = (status) =>
  (status || "Placed").toLowerCase().replace(/\s+/g, "-");

const getItemStatus = (item, order) => {
  if (Number(item.cancelledQuantity || 0) >= Number(item.quantity || 0)) {
    return "Cancelled";
  }

  if (DELIVERY_STATUSES.includes(item.status)) {
    return item.status;
  }

  // Fallback for older orders that do not yet have item-level status.
  if (DELIVERY_STATUSES.includes(order.orderStatus)) {
    return order.orderStatus;
  }

  return "Placed";
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);

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

  const [paymentConfirmation, setPaymentConfirmation] = useState({
    isOpen: false,
    orderId: null,
  });

  const showNotification = (title, message, type = "success") => {
    setNotification({ show: true, title, message, type });
  };

  const closeNotification = () => {
    setNotification((previous) => ({
      ...previous,
      show: false,
    }));
  };

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

  const handleItemStatusUpdate = async (orderId, itemId, newStatus) => {
    try {
      setUpdatingItemId(itemId);

      const data = await updateOrderItemStatus(orderId, itemId, newStatus);

      if (!data.success) {
        showNotification(
          "Status Update Failed",
          data.message || "Failed to update product delivery status",
          "error",
        );
        return;
      }

      showNotification(
        "Status Updated",
        "Product delivery status updated successfully.",
      );

      await fetchOrders(search, status, pagination.currentPage);
    } catch (error) {
      console.error("Update product status error:", error);

      showNotification(
        "Status Update Failed",
        error.response?.data?.message ||
          error.message ||
          "Failed to update product delivery status",
        "error",
      );

      await fetchOrders(search, status, pagination.currentPage);
    } finally {
      setUpdatingItemId(null);
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

      showNotification("Payment Updated", "Payment status marked as Paid.");

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

  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId((currentId) => (currentId === orderId ? null : orderId));
  };

  return (
    <AdminLayout title="Order Management">
      <NotificationModal
        isOpen={notification.show}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
      />

      <div className="admin-orders-header">
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

          <select
            value={status}
            onChange={handleStatusFilter}
            aria-label="Filter orders by status"
          >
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
                    <th>Details</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <Fragment key={order._id}>
                      <tr>
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

                        <td>{formatDate(order.createdAt)}</td>

                        <td>{formatCurrency(order.totalAmount)}</td>

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
                            className={`admin-order-status status-${getStatusClass(
                              order.orderStatus,
                            )}`}
                          >
                            {order.orderStatus || "Placed"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="admin-order-details-btn"
                            onClick={() => toggleOrderDetails(order._id)}
                            aria-expanded={expandedOrderId === order._id}
                          >
                            {expandedOrderId === order._id
                              ? "Hide Details −"
                              : "View Details +"}
                          </button>
                        </td>
                      </tr>

                      {expandedOrderId === order._id && (
                        <tr className="admin-order-expanded-row">
                          <td colSpan={7}>
                            <div className="admin-order-details">
                              <div className="admin-order-details-heading">
                                <div>
                                  <h3>Order Details</h3>
                                  <p>
                                    Order #
                                    {order.orderNumber || order._id.slice(-8)}
                                  </p>
                                </div>

                                <div>
                                  <span className="admin-order-details-label">
                                    Overall Status
                                  </span>
                                  <span
                                    className={`admin-order-status status-${getStatusClass(
                                      order.orderStatus,
                                    )}`}
                                  >
                                    {order.orderStatus || "Placed"}
                                  </span>
                                </div>
                              </div>

                              <div className="admin-order-details-grid">
                                <div>
                                  <span className="admin-order-details-label">
                                    Customer
                                  </span>
                                  <strong>
                                    {order.userId?.name || "Customer"}
                                  </strong>
                                  <span>{order.userId?.email || "—"}</span>
                                </div>

                                <div>
                                  <span className="admin-order-details-label">
                                    Payment
                                  </span>
                                  <strong>{order.paymentMethod || "—"}</strong>
                                  <span>
                                    {order.paymentStatus || "Pending"}
                                  </span>
                                </div>

                                <div>
                                  <span className="admin-order-details-label">
                                    Order Total
                                  </span>
                                  <strong>
                                    {formatCurrency(order.totalAmount)}
                                  </strong>
                                </div>
                              </div>

                              <h4 className="admin-order-products-heading">
                                Products ({order.items?.length || 0})
                              </h4>

                              {!order.items?.length ? (
                                <p>No product details available.</p>
                              ) : (
                                <div className="admin-order-products">
                                  {order.items.map((item, index) => {
                                    const itemStatus = getItemStatus(
                                      item,
                                      order,
                                    );

                                    const isFullyCancelled =
                                      itemStatus === "Cancelled";

                                    return (
                                      <div
                                        className="admin-order-product"
                                        key={
                                          item._id ||
                                          `${item.productId}-${index}`
                                        }
                                      >
                                        <div className="admin-order-product-info">
                                          {item.image ? (
                                            <img
                                              className="admin-order-product-image"
                                              src={item.image}
                                              alt={
                                                item.productName || "Product"
                                              }
                                            />
                                          ) : (
                                            <div className="admin-order-product-image admin-order-product-image-placeholder">
                                              No image
                                            </div>
                                          )}

                                          <div className="admin-order-product-description">
                                            <strong>
                                              {item.productName || "Product"}
                                            </strong>
                                            <span>
                                              Color: {item.color || "—"}
                                            </span>
                                            <span>
                                              Size: {item.size || "—"}
                                            </span>
                                            <span>
                                              Quantity: {item.quantity ?? 1}
                                            </span>
                                            <strong>
                                              {formatCurrency(
                                                Number(item.price || 0) *
                                                  Number(item.quantity || 1),
                                              )}
                                            </strong>

                                            {Number(
                                              item.cancelledQuantity || 0,
                                            ) > 0 && (
                                              <span>
                                                Cancelled quantity:{" "}
                                                {item.cancelledQuantity}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="admin-order-product-status">
                                          <label>Delivery Status</label>

                                          <span
                                            className={`admin-order-status status-${getStatusClass(
                                              itemStatus,
                                            )}`}
                                          >
                                            {itemStatus}
                                          </span>

                                          <select
                                            className="admin-order-status-select"
                                            value={
                                              DELIVERY_STATUSES.includes(
                                                itemStatus,
                                              )
                                                ? itemStatus
                                                : "Placed"
                                            }
                                            disabled={
                                              isFullyCancelled ||
                                              itemStatus === "Delivered" ||
                                              updatingItemId === item._id
                                            }
                                            onChange={(event) =>
                                              handleItemStatusUpdate(
                                                order._id,
                                                item._id,
                                                event.target.value,
                                              )
                                            }
                                            aria-label={`Update delivery status for ${item.productName || "product"}`}
                                          >
                                            {DELIVERY_STATUSES.map(
                                              (deliveryStatus) => (
                                                <option
                                                  key={deliveryStatus}
                                                  value={deliveryStatus}
                                                >
                                                  {deliveryStatus}
                                                </option>
                                              ),
                                            )}
                                          </select>

                                          {updatingItemId === item._id && (
                                            <span>Updating...</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              <div className="admin-order-price-summary">
                                <div>
                                  <span>Subtotal</span>
                                  <span>{formatCurrency(order.subtotal)}</span>
                                </div>

                                {Number(order.discount || 0) > 0 && (
                                  <div>
                                    <span>Discount</span>
                                    <span>
                                      −{formatCurrency(order.discount)}
                                    </span>
                                  </div>
                                )}

                                <div>
                                  <span>Shipping</span>
                                  <span>
                                    {formatCurrency(order.shippingFee)}
                                  </span>
                                </div>

                                <div className="admin-order-grand-total">
                                  <strong>Total</strong>
                                  <strong>
                                    {formatCurrency(order.totalAmount)}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
