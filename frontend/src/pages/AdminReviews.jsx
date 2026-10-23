
import { useEffect, useState } from "react";
import { Star, Search, Eye, EyeOff, Trash2, MessageCircle, X } from "lucide-react";
import AdminLayout from "../components/admin/AdminLayout";
import {
    getAdminReviews,
    deleteAdminReview,
    updateReviewVisibility,
    saveAdminReviewReply,
} from "../api/services/adminReviewService";
import "./AdminReviews.css";

function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [search, setSearch] = useState("");
    const [rating, setRating] = useState("");
    const [visibility, setVisibility] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [replyTarget, setReplyTarget] = useState(null);
    const [reply, setReply] = useState("");
    const [saving, setSaving] = useState(false);

    const loadReviews = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAdminReviews({
                search,
                rating,
                visibility,
            });

            setReviews(data.reviews || []);
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to load reviews."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, [search, rating, visibility]);

    const handleVisibility = async (review) => {
        try {
            setError("");
            setNotice("");

            await updateReviewVisibility(
                review._id,
                !review.isHidden
            );

            setNotice(
                review.isHidden
                    ? "Review restored successfully."
                    : "Review hidden successfully."
            );

            await loadReviews();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to update review visibility."
            );
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setSaving(true);
            setError("");

            await deleteAdminReview(deleteTarget._id);

            setDeleteTarget(null);
            setNotice("Review deleted successfully.");
            await loadReviews();
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to delete review."
            );
        } finally {
            setSaving(false);
        }
    };

    const openReplyEditor = (review) => {
        setReplyTarget(review);
        setReply(review.adminReply || "");
    };

    const handleSaveReply = async () => {
        if (!replyTarget) return;

        try {
            setSaving(true);
            setError("");

            await saveAdminReviewReply(replyTarget._id, reply);

            setReplyTarget(null);
            setReply("");
            setNotice(
                reply.trim()
                    ? "Admin reply saved successfully."
                    : "Admin reply removed successfully."
            );

            await loadReviews();
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to save reply."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout title="Review Management">
            <div className="admin-reviews">
                <div className="reviews-heading">
                    <div>
                        <h2>Customer Reviews</h2>
                        <p>Manage ratings, visibility, and admin replies.</p>
                    </div>

                    <span className="reviews-count">
                        {reviews.length} reviews
                    </span>
                </div>

                <div className="reviews-filters">
                    <div className="reviews-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search customer, product, or comment..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <select
                        value={rating}
                        onChange={(event) => setRating(event.target.value)}
                    >
                        <option value="">All ratings</option>
                        {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>
                                {value} stars
                            </option>
                        ))}
                    </select>

                    <select
                        value={visibility}
                        onChange={(event) => setVisibility(event.target.value)}
                    >
                        <option value="all">All reviews</option>
                        <option value="visible">Visible</option>
                        <option value="hidden">Hidden</option>
                    </select>
                </div>

                {notice && (
                    <div className="reviews-notice">
                        {notice}
                        <button onClick={() => setNotice("")}>
                            <X size={15} />
                        </button>
                    </div>
                )}

                {error && <div className="reviews-error">{error}</div>}

                {loading ? (
                    <div className="reviews-state">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="reviews-state">
                        No reviews found for these filters.
                    </div>
                ) : (
                    <div className="reviews-list">
                        {reviews.map((review) => (
                            <article
                                className="admin-review-card"
                                key={review._id}
                            >
                                <div className="review-card-top">
                                    <div>
                                        <h3>
                                            {review.productName || "Product"}
                                        </h3>
                                        <p className="review-customer">
                                            {review.customerName || "Customer"}
                                            {review.userId?.email
                                                ? ` · ${review.userId.email}`
                                                : ""}
                                        </p>
                                    </div>

                                    <span
                                        className={
                                            review.isHidden
                                                ? "review-status hidden"
                                                : "review-status visible"
                                        }
                                    >
                                        {review.isHidden ? "Hidden" : "Visible"}
                                    </span>
                                </div>

                                <div className="review-stars">
                                    {Array.from({ length: 5 }, (_, index) => (
                                        <Star
                                            key={index}
                                            size={17}
                                            fill={
                                                index < review.rating
                                                    ? "currentColor"
                                                    : "none"
                                            }
                                        />
                                    ))}
                                    <span>{review.rating}/5</span>
                                </div>

                                {review.title && (
                                    <h4 className="review-title">
                                        {review.title}
                                    </h4>
                                )}

                                <p className="review-comment">
                                    {review.comment}
                                </p>

                                <p className="review-date">
                                    {review.createdAt
                                        ? new Date(
                                              review.createdAt
                                          ).toLocaleDateString()
                                        : ""}
                                </p>

                                {review.adminReply && (
                                    <div className="admin-review-reply">
                                        <strong>SOLESTYLE Admin replied</strong>
                                        <p>{review.adminReply}</p>
                                    </div>
                                )}

                                <div className="review-actions">
                                    <button
                                        className="review-action"
                                        onClick={() => handleVisibility(review)}
                                    >
                                        {review.isHidden ? (
                                            <Eye size={16} />
                                        ) : (
                                            <EyeOff size={16} />
                                        )}
                                        {review.isHidden ? "Unhide" : "Hide"}
                                    </button>

                                    <button
                                        className="review-action"
                                        onClick={() => openReplyEditor(review)}
                                    >
                                        <MessageCircle size={16} />
                                        {review.adminReply
                                            ? "Edit Reply"
                                            : "Reply"}
                                    </button>

                                    <button
                                        className="review-action delete"
                                        onClick={() => setDeleteTarget(review)}
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {deleteTarget && (
                    <div className="review-modal-overlay">
                        <div className="review-modal">
                            <h3>Delete review?</h3>
                            <p>
                                This permanently deletes the review. This
                                action cannot be undone.
                            </p>

                            <div className="review-modal-actions">
                                <button
                                    className="review-cancel"
                                    disabled={saving}
                                    onClick={() => setDeleteTarget(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="review-confirm-delete"
                                    disabled={saving}
                                    onClick={handleDelete}
                                >
                                    {saving ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {replyTarget && (
                    <div className="review-modal-overlay">
                        <div className="review-modal">
                            <button
                                className="review-modal-close"
                                onClick={() => {
                                    setReplyTarget(null);
                                    setReply("");
                                }}
                                disabled={saving}
                                aria-label="Close reply editor"
                            >
                                <X size={20} />
                            </button>

                            <h3>Reply to Review</h3>
                            <p>
                                Product: {replyTarget.productName || "Product"}
                            </p>

                            <textarea
                                value={reply}
                                onChange={(event) =>
                                    setReply(event.target.value)
                                }
                                placeholder="Write an optional reply..."
                                maxLength={1000}
                                rows={5}
                            />

                            <div className="reply-character-count">
                                {reply.length}/1000 characters
                            </div>

                            <div className="review-modal-actions">
                                <button
                                    className="review-cancel"
                                    disabled={saving}
                                    onClick={() => {
                                        setReplyTarget(null);
                                        setReply("");
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="review-confirm-save"
                                    disabled={saving}
                                    onClick={handleSaveReply}
                                >
                                    {saving ? "Saving..." : "Save Reply"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

export default AdminReviews;
