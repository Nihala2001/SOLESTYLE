import { useEffect, useState } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import NotificationModal from "../components/common/NotificationModal";
import {
  getReturnExchangeRequests,
  updateReturnExchangeStatus,
} from "../api/services/adminOrderService";
import "./AdminReturns.css";

const EXCHANGE_STAGES = {
  Approved: {
    next: "Pickup Scheduled",
    label: "Schedule Pickup",
  },
  "Pickup Scheduled": {
    next: "Product Received",
    label: "Confirm Product Received",
  },
  "Product Received": {
    next: "Replacement Shipped",
    label: "Dispatch Replacement",
  },
  "Replacement Shipped": {
    next: "Out for Delivery",
    label: "Mark Out for Delivery",
  },
  "Out for Delivery": {
    next: "Completed",
    label: "Complete Exchange",
  },
};

const FILTERS = [
  { value: "All", label: "All Requests" },
  { value: "Requested", label: "Pending Requests" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "Pickup Scheduled", label: "Pickup Scheduled" },
  { value: "Product Received", label: "Product Received" },
  { value: "Replacement Shipped", label: "Replacement Shipped" },
  { value: "Out for Delivery", label: "Out for Delivery" },
  { value: "Completed", label: "Completed" },
];

function AdminReturns() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [processing, setProcessing] = useState(null);

  const [notification, setNotification] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
  });

  const showNotification = (title, message, type = "success") => {
    setNotification({ show: true, title, message, type });
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const data = await getReturnExchangeRequests();

      if (!data.success) {
        throw new Error(data.message || "Failed to load requests");
      }

      setRequests(data.requests || []);
    } catch (error) {
      console.error("Fetch return/exchange requests error:", error);

      showNotification(
        "Failed to Load Requests",
        error.response?.data?.message ||
          error.message ||
          "Could not load return/exchange requests",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdate = async (request, status) => {
    const key = `${request.orderId}-${request.itemIndex}`;

    try {
      setProcessing(key);

      const data = await updateReturnExchangeStatus(
        request.orderId,
        request.itemIndex,
        status,
      );

      if (!data.success) {
        throw new Error(data.message || "Failed to update request");
      }

      showNotification(
        "Request Updated",
        data.message || `Request updated to ${status} successfully`,
      );

      await fetchRequests();
    } catch (error) {
      console.error("Update return/exchange request error:", error);

      showNotification(
        "Update Failed",
        error.response?.data?.message ||
          error.message ||
          "Could not update request",
        "error",
      );
    } finally {
      setProcessing(null);
    }
  };

  const visibleRequests = requests.filter(
    (request) => filter === "All" || request.request?.status === filter,
  );

  const getCount = (status) =>
    requests.filter((request) => request.request?.status === status).length;

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "—"
      : parsedDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  const getItemName = (item) =>
    item.productName || item.name || item.title || "Footwear item";

  const getStatusClass = (status) =>
    `status-${(status || "unknown").toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <AdminLayout title="Returns">
      <div className="admin-returns">
        <div className="admin-returns-header">
          <div>
            <h1>Returns & Exchanges</h1>
            <p>Review and manage customer return and exchange requests.</p>
          </div>

          <button
            type="button"
            className="returns-refresh-btn"
            onClick={fetchRequests}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="returns-summary">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`returns-filter-card ${
                filter === item.value ? "active" : ""
              }`}
              onClick={() => setFilter(item.value)}
            >
              <span>{item.label}</span>
              <strong>
                {item.value === "All" ? requests.length : getCount(item.value)}
              </strong>
            </button>
          ))}
        </div>

        <div className="returns-list-header">
          <h2>
            {FILTERS.find((item) => item.value === filter)?.label || filter}{" "}
            Requests
          </h2>
          <span>{visibleRequests.length} request(s)</span>
        </div>

        {loading ? (
          <div className="returns-empty">Loading requests...</div>
        ) : visibleRequests.length === 0 ? (
          <div className="returns-empty">
            <h3>No {filter.toLowerCase()} requests</h3>
            <p>
              Requests with this status will appear here. Select All Requests to
              see every return and exchange.
            </p>
          </div>
        ) : (
          <div className="returns-request-list">
            {visibleRequests.map((request) => {
              const key = `${request.orderId}-${request.itemIndex}`;
              const item = request.item || {};
              const requestStatus = request.request?.status;
              const requestType = request.request?.type;
              const exchangeStage = EXCHANGE_STAGES[requestStatus];

              return (
                <article className="returns-request-card" key={key}>
                  <div className="returns-card-top">
                    <div>
                      <span className="returns-request-type">
                        {requestType || "Request"}
                      </span>
                      <h3>Order #{request.orderNumber}</h3>
                    </div>

                    <span
                      className={`returns-status ${getStatusClass(
                        requestStatus,
                      )}`}
                    >
                      {requestStatus}
                    </span>
                  </div>

                  <div className="returns-card-details">
                    <div>
                      <span className="returns-label">Product</span>
                      <strong>{getItemName(item)}</strong>
                      <p>Quantity: {item.quantity ?? "—"}</p>
                      {item.color && <p>Color: {item.color}</p>}
                      {item.size && <p>Size: {item.size}</p>}

                      {requestType === "Exchange" &&
                        request.request?.replacementVariantId && (
                          <div className="replacement-request-details">
                            <span className="returns-label">
                              Requested replacement
                            </span>
                            <p>
                              Color: {request.request.replacementColor || "—"}
                            </p>
                            <p>
                              Size: {request.request.replacementSize ?? "—"}
                            </p>
                          </div>
                        )}
                    </div>

                    <div>
                      <span className="returns-label">Customer</span>
                      <strong>{request.customerName || "Customer"}</strong>
                      <p>{request.customerEmail || "No email available"}</p>
                    </div>

                    <div>
                      <span className="returns-label">Request date</span>
                      <strong>
                        {formatDate(request.request?.requestedAt)}
                      </strong>
                    </div>
                  </div>

                  <div className="returns-reason">
                    <span className="returns-label">Customer's reason</span>
                    <p>{request.request?.reason || "No reason provided"}</p>
                  </div>

                  {requestStatus === "Requested" && (
                    <div className="returns-actions">
                      <button
                        type="button"
                        className="returns-approve-btn"
                        disabled={processing === key}
                        onClick={() => handleUpdate(request, "Approved")}
                      >
                        {processing === key ? "Updating..." : "Approve"}
                      </button>

                      <button
                        type="button"
                        className="returns-reject-btn"
                        disabled={processing === key}
                        onClick={() => handleUpdate(request, "Rejected")}
                      >
                        {processing === key ? "Updating..." : "Reject"}
                      </button>
                    </div>
                  )}

                  {requestStatus === "Approved" && requestType === "Return" && (
                    <div className="returns-actions">
                      <button
                        type="button"
                        className="returns-approve-btn"
                        disabled={processing === key}
                        onClick={() => handleUpdate(request, "Completed")}
                      >
                        {processing === key
                          ? "Processing..."
                          : "Complete Return & Refund"}
                      </button>
                    </div>
                  )}

                  {requestType === "Exchange" && exchangeStage && (
                    <div className="returns-actions">
                      <button
                        type="button"
                        className="returns-approve-btn"
                        disabled={processing === key}
                        onClick={() =>
                          handleUpdate(request, exchangeStage.next)
                        }
                      >
                        {processing === key
                          ? "Updating..."
                          : exchangeStage.label}
                      </button>
                    </div>
                  )}

                  {requestStatus === "Completed" &&
                    requestType === "Return" && (
                      <div className="returns-reason">
                        <span className="returns-label">Refund status</span>
                        <p>
                          {Number(request.request?.refundAmount || 0) > 0
                            ? `₹${Number(request.request.refundAmount).toFixed(
                                2,
                              )} credited to wallet`
                            : "Return completed"}
                        </p>
                      </div>
                    )}

                  {requestStatus === "Completed" &&
                    requestType === "Exchange" && (
                      <div className="returns-reason">
                        <span className="returns-label">Exchange status</span>
                        <p>Replacement exchange completed successfully.</p>
                      </div>
                    )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <NotificationModal
        show={notification.show}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() =>
          setNotification((previous) => ({
            ...previous,
            show: false,
          }))
        }
      />
    </AdminLayout>
  );
}

export default AdminReturns;
