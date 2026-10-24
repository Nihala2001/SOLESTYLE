import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Star, X, RotateCcw, RefreshCw, Ban } from "lucide-react";

import {
  getMyOrders,
  requestReturnExchange,
  cancelOrder,
} from "../api/services/userOrderService";

import { createReview, getMyReviews } from "../api/services/userReviewService";
import ConfirmationModal from "../components/common/ConfirmationModal";

import "./OrderTracking.css";
const orderStatuses = [
  "Placed",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const getRequestList = (item) => item.itemActionRequests || [];

const getRemainingQuantity = (item) =>
  Math.max(
    0,
    Number(item.quantity || 0) -
      Number(item.Quantity || 0) -
      Number(item.returnedQuantity || 0) -
      Number(item.exchangedQuantity || 0),
  );

const getDeliveryDate = (item, order) => {
  // Prefer this product's delivery date. The order-level date is
  // only a compatibility fallback for previously delivered orders.
  return (
    item.deliveredAt || (item.status === "Delivered" ? order.deliveredAt : null)
  );
};

const isReturnExchangeAvailable = (item, order, type) => {
  if (item.status !== "Delivered") return false;

  const deliveryDateValue = getDeliveryDate(item, order);
  if (!deliveryDateValue) return false;

  const allowedDays = type === "Return" ? 7 : 10;
  const deliveryDate = new Date(deliveryDateValue);

  if (Number.isNaN(deliveryDate.getTime())) return false;

  deliveryDate.setHours(0, 0, 0, 0);

  const deadline = new Date(deliveryDate);
  deadline.setDate(deadline.getDate() + allowedDays);
  deadline.setHours(23, 59, 59, 999);

  return new Date() <= deadline;
};

const getRequestLabel = (request) => {
  if (!request) return "";

  return `${request.type || "Return/Exchange"} status: ${
    request.status || "Requested"
  }`;
};

function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [returnExchangeForm, setReturnExchangeForm] = useState(null);
  const [returnExchangeReason, setReturnExchangeReason] = useState("");
  const [returnExchangeError, setReturnExchangeError] = useState("");
  const [returnExchangeLoading, setReturnExchangeLoading] = useState(false);
  const [returnExchangeQuantity, setReturnExchangeQuantity] = useState(1);

  const [selectedReplacementVariant, setSelectedReplacementVariant] =
    useState("");
  const [replacementVariantDetails, setReplacementVariantDetails] =
    useState(null);

  const [myReviews, setMyReviews] = useState([]);
  const [cancelLoadingIndex, setCancelLoadingIndex] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  const [reviewForm, setReviewForm] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const [cancelModal, setCancelModal] = useState(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyOrders();

      if (!response.success) {
        throw new Error(response.message || "Unable to fetch order");
      }

      const foundOrder = (response.orders || []).find(
        (item) => String(item._id) === String(orderId),
      );

      if (!foundOrder) {
        setOrder(null);
        setError("Order not found.");
        return;
      }

      setOrder(foundOrder);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load order details.",
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Restore the selected replacement after returning from Product Details.
  useEffect(() => {
    const exchangeReturn = location.state?.exchangeReturn;

    if (!exchangeReturn || String(exchangeReturn.orderId) !== String(orderId)) {
      return;
    }

    setReturnExchangeForm({
      orderId: exchangeReturn.orderId,
      itemIndex: Number(exchangeReturn.itemIndex),
      type: "Exchange",
    });

    setReturnExchangeReason(exchangeReturn.reason || "");
    setReturnExchangeQuantity(Number(exchangeReturn.quantity || 1));
    setSelectedReplacementVariant(exchangeReturn.replacementVariantId || "");

    setReplacementVariantDetails(
      exchangeReturn.replacementVariantId
        ? {
            variantId: exchangeReturn.replacementVariantId,
            color: exchangeReturn.replacementColor,
            size: exchangeReturn.replacementSize,
            price: exchangeReturn.replacementPrice,
          }
        : null,
    );

    setReturnExchangeError("");

    // Clear navigation state so refreshing the page does not reopen it.
    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.state, location.pathname, navigate, orderId]);

  const closeReturnExchangeForm = () => {
    if (returnExchangeLoading) return;

    setReturnExchangeForm(null);
    setReturnExchangeReason("");
    setReturnExchangeError("");
    setReturnExchangeQuantity(1);
    setSelectedReplacementVariant("");
    setReplacementVariantDetails(null);
  };

  const handleReturnExchangeClick = (itemIndex, type) => {
    const item = order?.items?.[itemIndex];

    if (!item) return;

    if (!isReturnExchangeAvailable(item, order, type)) {
      setReturnExchangeError(
        `This product is not eligible for a ${type.toLowerCase()}.`,
      );
      return;
    }

    if (getRemainingQuantity(item) < 1) {
      setReturnExchangeError(
        "There is no remaining quantity available for this request.",
      );
      return;
    }

    setReturnExchangeForm({
      orderId: order._id,
      itemIndex,
      type,
    });

    setReturnExchangeReason("");
    setReturnExchangeError("");
    setReturnExchangeQuantity(1);
    setSelectedReplacementVariant("");
    setReplacementVariantDetails(null);
  };

  const handleChooseReplacement = () => {
    const form = returnExchangeForm;
    const item = order?.items?.[form?.itemIndex];

    if (!form || !item) return;

    if (!returnExchangeReason.trim()) {
      setReturnExchangeError(
        "Please enter a reason before choosing a replacement.",
      );
      return;
    }

    const productId = getProductId(item);

    if (!productId) {
      setReturnExchangeError("Unable to identify this product.");
      return;
    }

    navigate(`/products/${productId}`, {
      state: {
        exchangeContext: {
          orderId: order._id,
          itemIndex: form.itemIndex,
          originalVariantId: item.variantId,
          originalPrice: item.price,
          originalColor: item.color,
          originalSize: item.size,
          productId: item.productId,
          reason: returnExchangeReason.trim(),
          quantity: Number(returnExchangeQuantity),
          returnToTracking: true,
        },
      },
    });
  };

  const handleReturnExchangeSubmit = async (event) => {
    event.preventDefault();

    if (!returnExchangeForm || !order) return;

    const { orderId: requestOrderId, itemIndex, type } = returnExchangeForm;

    const item = order.items[itemIndex];

    if (!item) {
      setReturnExchangeError("The selected product could not be found.");
      return;
    }

    if (!returnExchangeReason.trim()) {
      setReturnExchangeError("Please provide a reason.");
      return;
    }

    if (
      !Number.isInteger(Number(returnExchangeQuantity)) ||
      Number(returnExchangeQuantity) < 1 ||
      Number(returnExchangeQuantity) > getRemainingQuantity(item)
    ) {
      setReturnExchangeError("Please select a valid quantity.");
      return;
    }

    if (type === "Exchange" && !selectedReplacementVariant) {
      setReturnExchangeError("Please choose a replacement color and size.");
      return;
    }

    if (!isReturnExchangeAvailable(item, order, type)) {
      setReturnExchangeError(
        "The eligibility period for this product has ended.",
      );
      return;
    }

    setReturnExchangeLoading(true);
    setReturnExchangeError("");

    try {
      const response = await requestReturnExchange(
        requestOrderId,
        itemIndex,
        type,
        returnExchangeReason.trim(),
        type === "Exchange" ? selectedReplacementVariant : null,
        Number(returnExchangeQuantity),
      );

      if (!response.success) {
        throw new Error(response.message || "Unable to submit your request.");
      }

      closeReturnExchangeForm();
      await fetchOrder();
    } catch (err) {
      console.error(
        "Return/Exchange submission failed:",
        err.response?.status,
        err.response?.data || err.message,
      );

      setReturnExchangeError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to submit your request.",
      );
    } finally {
      setReturnExchangeLoading(false);
    }
  };
  const getProductId = (item) => {
    const product = item?.productId;

    if (typeof product === "string") return product;

    return product?._id || product?.id || "";
  };

  const loadMyReviews = useCallback(async () => {
    try {
      const response = await getMyReviews();

      const reviews = Array.isArray(response)
        ? response
        : response?.reviews || response?.data?.reviews || [];

      setMyReviews(reviews);
    } catch (err) {
      console.error("Unable to load reviews:", err);
    }
  }, []);

  useEffect(() => {
    loadMyReviews();
  }, [loadMyReviews]);

  const hasReviewedProduct = (item) => {
    const productId = String(getProductId(item));

    if (!productId) return false;

    return myReviews.some((review) => {
      const reviewedProductId =
        review.productId?._id || review.productId?.id || review.productId;

      return String(reviewedProductId || "") === productId;
    });
  };

  const canCancelItem = (item) => {
    const status = String(item.status || "Placed").toLowerCase();

    return (
      ["placed", "confirmed"].includes(status) &&
      getRemainingQuantity(item) > 0 &&
      !item.cancelledAt
    );
  };

  const openCancelModal = (itemIndex) => {
    const item = order?.items?.[itemIndex];

    if (!item || !canCancelItem(item)) return;

    setCancelModal({
      itemIndex,
      productName: item.productName || "this product",
    });
  };

  const handleCancelProduct = async () => {
    if (!cancelModal || !order || cancelLoadingIndex !== null) return;

    const { itemIndex } = cancelModal;
    const item = order.items[itemIndex];

    if (!item || !canCancelItem(item)) {
      setCancelModal(null);
      return;
    }

    setCancelLoadingIndex(itemIndex);
    setActionMessage("");

    try {
      const response = await cancelOrder(order._id, itemIndex);

      if (!response.success) {
        throw new Error(response.message || "Unable to cancel this product.");
      }

      setCancelModal(null);
      setActionMessage("Product cancelled successfully.");
      await fetchOrder();
    } catch (err) {
      setActionMessage(
        err.response?.data?.message ||
          err.message ||
          "Unable to cancel this product.",
      );
    } finally {
      setCancelLoadingIndex(null);
    }
  };

  const openReviewForm = (item, itemIndex) => {
    setReviewForm({ item, itemIndex });
    setReviewRating(0);
    setReviewTitle("");
    setReviewComment("");
    setReviewError("");
  };

  const closeReviewForm = (force = false) => {
    if (reviewLoading && !force) return;

    setReviewForm(null);
    setReviewRating(0);
    setReviewTitle("");
    setReviewComment("");
    setReviewError("");
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!reviewForm || !order) return;

    const { item, itemIndex } = reviewForm;
    const productId = getProductId(item);

    if (!productId) {
      setReviewError("Unable to identify this product.");
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError("Please select a rating from 1 to 5 stars.");
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError("Please enter your review.");
      return;
    }

    setReviewLoading(true);
    setReviewError("");

    try {
      const response = await createReview({
        productId,
        orderId: order._id,
        itemIndex,
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });

      if (response?.success === false) {
        throw new Error(response.message || "Unable to submit review.");
      }

      closeReviewForm(true);
      await loadMyReviews();
      setActionMessage("Your review has been submitted.");
    } catch (error) {
      console.error(
        "Review submission failed:",
        error.response?.status,
        error.response?.data || error.message,
      );

      setReviewError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to submit review. Please try again.",
      );
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return <div className="order-tracking-page">Loading order...</div>;
  }

  if (error || !order) {
    return (
      <div className="order-tracking-page">
        <div className="order-tracking-card">
          <h2>Unable to track order</h2>
          <p>{error || "Order not found."}</p>
          <button onClick={() => navigate("/profile")}>
            Back to My Account
          </button>
        </div>
      </div>
    );
  }

  const isCancelled = order.orderStatus === "Cancelled";
  const isReturned = order.orderStatus === "Returned";
  const isReturnRequested = order.orderStatus === "Return Requested";

  const modalItem = returnExchangeForm
    ? order.items[returnExchangeForm.itemIndex]
    : null;

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
          <strong>₹{Number(order.totalAmount || 0).toFixed(2)}</strong>
        </div>

        <div className="tracking-summary">
          <span>Payment method</span>
          <strong>{order.paymentMethod}</strong>
        </div>

        <div className="tracking-summary">
          <span>Overall order status</span>
          <strong>{order.orderStatus}</strong>
        </div>

        {isReturned && (
          <div className="tracking-special-status">
            This order has been returned.
          </div>
        )}

        {isReturnRequested && (
          <div className="tracking-special-status">
            A return request for this order is being reviewed.
          </div>
        )}

        <h3>Product delivery progress</h3>

        {actionMessage && (
          <p className="tracking-action-message" role="status">
            {actionMessage}
          </p>
        )}

        <div className="tracking-items-list">
          {order.items.map((item, index) => {
            const quantity = Number(item.quantity || 0);
            const cancelledQuantity = Number(item.cancelledQuantity || 0);

            const fullyCancelled =
              quantity > 0 && cancelledQuantity >= quantity;

            const partiallyCancelled = cancelledQuantity > 0 && !fullyCancelled;

            const itemStatus = item.status || "Placed";
            const currentIndex = orderStatuses.indexOf(itemStatus);
            const remainingQuantity = getRemainingQuantity(item);

            const requests = getRequestList(item).filter((request) =>
              ["Return", "Exchange"].includes(request.type),
            );

            const hasLegacyRequest =
              item.returnExchange?.status &&
              item.returnExchange.status !== "Not Requested";

            const hasActiveRequest = requests.some(
              (request) => request.status !== "Rejected",
            );

            const hasCompletedRequest =
              Number(item.returnedQuantity || 0) > 0 ||
              Number(item.exchangedQuantity || 0) > 0;

            const canRequest =
              itemStatus === "Delivered" &&
              !fullyCancelled &&
              remainingQuantity > 0 &&
              !hasActiveRequest &&
              !hasLegacyRequest &&
              !hasCompletedRequest;

            const canReturn =
              canRequest && isReturnExchangeAvailable(item, order, "Return");

            const canExchange =
              canRequest && isReturnExchangeAvailable(item, order, "Exchange");

            const canCancel = !fullyCancelled && canCancelItem(item);

            const canReview =
              (String(itemStatus).toLowerCase() === "delivered" ||
                String(order.orderStatus).toLowerCase() === "delivered") &&
              !fullyCancelled &&
              remainingQuantity > 0 &&
              !hasReviewedProduct(item);

            return (
              <div
                className="tracking-item-card"
                key={item._id || `${getProductId(item)}-${index}`}
              >
                <div className="tracking-product">
                  {item.image && (
                    <img src={item.image} alt={item.productName} />
                  )}

                  <div className="tracking-product-info">
                    <strong>{item.productName}</strong>

                    <p>
                      Color: {item.color || "N/A"} · Size: {item.size || "N/A"}
                    </p>

                    <p>Quantity: {quantity}</p>

                    <p>Price: ₹{Number(item.price || 0).toFixed(2)}</p>

                    {partiallyCancelled && (
                      <p className="tracking-item-note">
                        {cancelledQuantity} of {quantity} item(s) cancelled.
                      </p>
                    )}

                    {Number(item.returnedQuantity || 0) > 0 && (
                      <p className="tracking-item-note">
                        Returned quantity: {item.returnedQuantity}
                      </p>
                    )}

                    {Number(item.exchangedQuantity || 0) > 0 && (
                      <p className="tracking-item-note">
                        Exchanged quantity: {item.exchangedQuantity}
                      </p>
                    )}
                  </div>
                </div>

                <div className="tracking-item-status-heading">
                  <span>Product status</span>

                  <strong
                    className={
                      fullyCancelled
                        ? "tracking-status-cancelled"
                        : "tracking-status-current"
                    }
                  >
                    {fullyCancelled ? "Cancelled" : itemStatus}
                  </strong>
                </div>

                {fullyCancelled ? (
                  <div className="tracking-special-status">
                    This product has been cancelled.
                  </div>
                ) : currentIndex === -1 ? (
                  <div className="tracking-special-status">
                    Current product status: {itemStatus}. Delivery progress is
                    unavailable for this status.
                  </div>
                ) : (
                  <div className="item-tracking-timeline">
                    {orderStatuses.map((status, statusIndex) => {
                      const completed = currentIndex >= statusIndex;
                      const isCurrent = currentIndex === statusIndex;

                      return (
                        <div
                          className={`item-tracking-step ${
                            completed ? "completed" : ""
                          } ${isCurrent ? "current" : ""}`}
                          key={status}
                        >
                          <div className="item-tracking-step-icon">
                            {completed ? "✓" : statusIndex + 1}
                          </div>

                          <span>{status}</span>

                          {isCurrent && <small>Current status</small>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {item.deliveredAt && itemStatus === "Delivered" && (
                  <p className="tracking-item-note">
                    Delivered on:{" "}
                    {new Date(item.deliveredAt).toLocaleDateString()}
                  </p>
                )}

                {requests.map((request, requestIndex) => (
                  <div
                    className="tracking-item-note"
                    key={request._id || `${request.type}-${requestIndex}`}
                  >
                    {getRequestLabel(request)}
                    {request.reason ? ` — ${request.reason}` : ""}
                  </div>
                ))}

                {hasLegacyRequest && (
                  <div className="tracking-item-note">
                    {getRequestLabel(item.returnExchange)}
                  </div>
                )}

                <div className="tracking-item-actions">
                  {canCancel && (
                    <button
                      type="button"
                      className="tracking-action-btn cancel-product-btn"
                      onClick={() => openCancelModal(index)}
                      disabled={cancelLoadingIndex !== null}
                    >
                      <Ban size={16} />
                      {cancelLoadingIndex === index
                        ? "Cancelling..."
                        : "Cancel Product"}
                    </button>
                  )}

                  {canReturn && (
                    <button
                      type="button"
                      className="tracking-action-btn return-product-btn"
                      onClick={() => handleReturnExchangeClick(index, "Return")}
                    >
                      <RotateCcw size={16} />
                      Return Product
                    </button>
                  )}

                  {canExchange && (
                    <button
                      type="button"
                      className="tracking-action-btn exchange-product-btn"
                      onClick={() =>
                        handleReturnExchangeClick(index, "Exchange")
                      }
                    >
                      <RefreshCw size={16} />
                      Exchange Product
                    </button>
                  )}

                  {canReview && (
                    <button
                      type="button"
                      className="tracking-action-btn review-product-btn"
                      onClick={() => openReviewForm(item, index)}
                    >
                      <Star size={16} />
                      Add Review
                    </button>
                  )}
                </div>

                {!fullyCancelled &&
                  itemStatus === "Delivered" &&
                  !hasActiveRequest &&
                  !hasLegacyRequest &&
                  !hasCompletedRequest &&
                  remainingQuantity > 0 &&
                  !canReturn &&
                  !canExchange && (
                    <p className="tracking-item-note">
                      The return/exchange eligibility period has ended.
                    </p>
                  )}
              </div>
            );
          })}
        </div>

        <h3>Delivery address</h3>

        {order.shippingAddress ? (
          <>
            <p>{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.addressLine}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
              {order.shippingAddress.pincode}
            </p>
            <p>Phone: {order.shippingAddress.phone}</p>
          </>
        ) : (
          <p>Delivery address is unavailable.</p>
        )}

        {returnExchangeForm && modalItem && (
          <div
            className="return-modal-overlay"
            onClick={closeReturnExchangeForm}
          >
            <form
              className="return-modal"
              onSubmit={handleReturnExchangeSubmit}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="return-modal-title"
            >
              <div className="return-modal-header">
                <div>
                  <p className="return-modal-eyebrow">SOLESTYLE</p>

                  <h2 id="return-modal-title">
                    {returnExchangeForm.type === "Return"
                      ? "Return Product"
                      : "Exchange Product"}
                  </h2>

                  <p className="return-modal-subtitle">
                    {returnExchangeForm.type === "Return"
                      ? "Please tell us why you would like to return this product."
                      : "Choose a replacement and tell us why you would like to exchange this product."}
                  </p>
                </div>

                <button
                  type="button"
                  className="return-modal-close"
                  aria-label="Close modal"
                  disabled={returnExchangeLoading}
                  onClick={closeReturnExchangeForm}
                >
                  ×
                </button>
              </div>

              <div className="return-modal-body">
                <div className="return-modal-product">
                  {modalItem.image && (
                    <img
                      src={modalItem.image}
                      alt={modalItem.productName}
                      className="return-modal-product-image"
                    />
                  )}

                  <div>
                    <strong>{modalItem.productName}</strong>
                    <p>
                      Color: {modalItem.color || "N/A"} | Size:{" "}
                      {modalItem.size || "N/A"}
                    </p>
                    <p>Ordered quantity: {modalItem.quantity}</p>
                  </div>
                </div>

                <div className="return-modal-field">
                  <label htmlFor="return-exchange-quantity">
                    Quantity to{" "}
                    {returnExchangeForm.type === "Return"
                      ? "return"
                      : "exchange"}
                  </label>

                  <select
                    id="return-exchange-quantity"
                    value={returnExchangeQuantity}
                    onChange={(event) =>
                      setReturnExchangeQuantity(Number(event.target.value))
                    }
                    disabled={returnExchangeLoading}
                  >
                    {Array.from(
                      {
                        length: getRemainingQuantity(modalItem),
                      },
                      (_, index) => index + 1,
                    ).map((value) => (
                      <option key={value} value={value}>
                        {value} {value === 1 ? "unit" : "units"}
                      </option>
                    ))}
                  </select>
                </div>

                {returnExchangeForm.type === "Exchange" && (
                  <div className="return-modal-replacement">
                    <h3>Replacement product</h3>

                    {replacementVariantDetails ? (
                      <div className="selected-replacement">
                        <p>
                          <strong>Selected replacement</strong>
                        </p>
                        <p>Color: {replacementVariantDetails.color || "N/A"}</p>
                        <p>Size: {replacementVariantDetails.size || "N/A"}</p>
                        {replacementVariantDetails.price != null && (
                          <p>
                            Price: ₹
                            {Number(replacementVariantDetails.price).toFixed(2)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p>
                        Choose a replacement color and size from the Product
                        Details page.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleChooseReplacement}
                      disabled={returnExchangeLoading}
                    >
                      {replacementVariantDetails
                        ? "Choose a Different Replacement"
                        : "Choose Replacement"}
                    </button>
                  </div>
                )}

                <div className="return-modal-field">
                  <label htmlFor="return-exchange-reason">Reason</label>

                  <textarea
                    id="return-exchange-reason"
                    value={returnExchangeReason}
                    onChange={(event) =>
                      setReturnExchangeReason(event.target.value)
                    }
                    placeholder="Please explain why you want to return or exchange this product."
                    rows={4}
                    disabled={returnExchangeLoading}
                    required
                  />
                </div>

                {returnExchangeError && (
                  <p className="return-modal-error" role="alert">
                    {returnExchangeError}
                  </p>
                )}

                <div className="return-modal-actions">
                  <button
                    type="button"
                    onClick={closeReturnExchangeForm}
                    disabled={returnExchangeLoading}
                  >
                    Cancel
                  </button>

                  <button type="submit" disabled={returnExchangeLoading}>
                    {returnExchangeLoading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {reviewForm && (
          <div className="review-modal-overlay" onClick={closeReviewForm}>
            <form
              className="tracking-review-modal"
              onSubmit={handleReviewSubmit}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="tracking-review-heading"
            >
              <div className="tracking-review-header">
                <div>
                  <span className="tracking-review-eyebrow">SOLESTYLE</span>
                  <h2 id="tracking-review-heading">Write a Review</h2>
                  <p>
                    Share your experience with {reviewForm.item.productName}.
                  </p>
                </div>

                <button
                  type="button"
                  className="tracking-review-close"
                  onClick={closeReviewForm}
                  disabled={reviewLoading}
                  aria-label="Close review"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="tracking-review-body">
                <label>Your rating</label>

                <div className="tracking-review-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={star <= reviewRating ? "selected" : ""}
                      onClick={() => setReviewRating(star)}
                      disabled={reviewLoading}
                      aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    >
                      <Star size={28} fill="currentColor" />
                    </button>
                  ))}
                </div>

                <label htmlFor="tracking-review-title-input">
                  Review title (optional)
                </label>

                <input
                  id="tracking-review-title-input"
                  value={reviewTitle}
                  onChange={(event) => setReviewTitle(event.target.value)}
                  placeholder="Summarize your experience"
                  maxLength={100}
                  disabled={reviewLoading}
                />

                <label htmlFor="tracking-review-comment">Your review</label>

                <textarea
                  id="tracking-review-comment"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="What did you like or dislike?"
                  rows={4}
                  maxLength={1000}
                  required
                  disabled={reviewLoading}
                />

                {reviewError && (
                  <p className="tracking-review-error" role="alert">
                    {reviewError}
                  </p>
                )}

                <div className="tracking-review-actions">
                  <button
                    type="button"
                    onClick={closeReviewForm}
                    disabled={reviewLoading}
                  >
                    Cancel
                  </button>

                  <button type="submit" disabled={reviewLoading}>
                    {reviewLoading ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <ConfirmationModal
          isOpen={cancelModal !== null}
          title="Cancel Product?"
          message={`Are you sure you want to cancel ${
            cancelModal?.productName || "this product"
          }? This action cannot be undone.`}
          confirmText={
            cancelLoadingIndex !== null ? "Cancelling..." : "Yes, Cancel"
          }
          cancelText="Keep Product"
          onCancel={() => {
            if (cancelLoadingIndex === null) {
              setCancelModal(null);
            }
          }}
          onConfirm={handleCancelProduct}
        />
      </div>
    </div>
  );
}

export default OrderTracking;
