
const mongoose = require("mongoose");
const Review = require("../../models/Review");

/* Get all reviews for admin management */
const getAllReviews = async (req, res) => {
    try {
        const { search = "", rating = "", visibility = "all" } = req.query;

        const filter = {};

        if (rating !== "") {
            const numericRating = Number(rating);

            if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
                return res.status(400).json({
                    message: "Rating must be between 1 and 5",
                });
            }

            filter.rating = numericRating;
        }

        if (visibility === "hidden") {
            filter.isHidden = true;
        } else if (visibility === "visible") {
            filter.isHidden = { $ne: true };
        }

        let reviews = await Review.find(filter)
            .populate("userId", "name firstName lastName email")
            .populate("productId", "name title")
            .sort({ createdAt: -1 })
            .lean();

        const searchText = search.trim().toLowerCase();

        if (searchText) {
            reviews = reviews.filter((review) => {
                const user = review.userId || {};
                const product = review.productId || {};

                const customerName =
                    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    user.name ||
                    "";

                const productName = product.name || product.title || "";

                return [
                    customerName,
                    user.email || "",
                    productName,
                    review.title || "",
                    review.comment || "",
                ].some((value) =>
                    String(value).toLowerCase().includes(searchText)
                );
            });
        }

        const formattedReviews = reviews.map((review) => {
            const user = review.userId || {};
            const customerName =
                [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                user.name ||
                "Customer";

            return {
                ...review,
                customerName,
                productName:
                    review.productId?.name ||
                    review.productId?.title ||
                    "Deleted product",
            };
        });

        return res.status(200).json({
            reviews: formattedReviews,
            totalReviews: formattedReviews.length,
        });
    } catch (error) {
        console.error("Get admin reviews error:", error);
        return res.status(500).json({
            message: "Failed to fetch reviews",
        });
    }
};

/* Permanently delete a review */
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                message: "Invalid review ID",
            });
        }

        const review = await Review.findByIdAndDelete(reviewId);

        if (!review) {
            return res.status(404).json({
                message: "Review not found",
            });
        }

        return res.status(200).json({
            message: "Review deleted successfully",
        });
    } catch (error) {
        console.error("Delete review error:", error);
        return res.status(500).json({
            message: "Failed to delete review",
        });
    }
};

/* Hide or restore a review */
const toggleReviewVisibility = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { isHidden } = req.body;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                message: "Invalid review ID",
            });
        }

        if (typeof isHidden !== "boolean") {
            return res.status(400).json({
                message: "isHidden must be true or false",
            });
        }

        const review = await Review.findByIdAndUpdate(
            reviewId,
            { $set: { isHidden } },
            { new: true, runValidators: true }
        );

        if (!review) {
            return res.status(404).json({
                message: "Review not found",
            });
        }

        return res.status(200).json({
            message: isHidden
                ? "Review hidden successfully"
                : "Review restored successfully",
            review,
        });
    } catch (error) {
        console.error("Toggle review visibility error:", error);
        return res.status(500).json({
            message: "Failed to update review visibility",
        });
    }
};

/* Add, edit, or remove an admin reply */
const replyToReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { reply } = req.body;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                message: "Invalid review ID",
            });
        }

        if (typeof reply !== "string") {
            return res.status(400).json({
                message: "Reply must be text",
            });
        }

        const cleanReply = reply.trim();

        if (cleanReply.length > 1000) {
            return res.status(400).json({
                message: "Reply cannot exceed 1000 characters",
            });
        }

        const review = await Review.findByIdAndUpdate(
            reviewId,
            {
                $set: {
                    adminReply: cleanReply,
                    adminRepliedAt: cleanReply ? new Date() : null,
                },
            },
            { new: true, runValidators: true }
        );

        if (!review) {
            return res.status(404).json({
                message: "Review not found",
            });
        }

        return res.status(200).json({
            message: cleanReply
                ? "Admin reply saved successfully"
                : "Admin reply removed successfully",
            review,
        });
    } catch (error) {
        console.error("Reply to review error:", error);
        return res.status(500).json({
            message: "Failed to save admin reply",
        });
    }
};

module.exports = {
    getAllReviews,
    deleteReview,
    toggleReviewVisibility,
    replyToReview,
};
