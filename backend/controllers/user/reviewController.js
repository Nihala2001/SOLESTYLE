
const mongoose = require("mongoose");
const Review = require("../../models/Review");
const Order = require("../../models/Order");


/* ================= CREATE REVIEW ================= */

const createReview = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId, orderId, rating, title, comment } = req.body;

        if (
            !mongoose.Types.ObjectId.isValid(productId) ||
            !mongoose.Types.ObjectId.isValid(orderId)
        ) {
            return res.status(400).json({
                message: "Invalid product or order",
            });
        }

        const numericRating = Number(rating);
        const cleanComment =
            typeof comment === "string" ? comment.trim() : "";
        const cleanTitle =
            typeof title === "string" ? title.trim() : "";

        if (
            !Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                message: "Please select a rating from 1 to 5 stars",
            });
        }

        if (cleanComment.length < 3 || cleanComment.length > 1000) {
            return res.status(400).json({
                message: "Comment must contain 3 to 1000 characters",
            });
        }

        if (cleanTitle.length > 100) {
            return res.status(400).json({
                message: "Review title cannot exceed 100 characters",
            });
        }

        // Verify that the order belongs to the logged-in customer.
        const order = await Order.findOne({
            _id: orderId,
            userId,
        });

        if (!order) {
            return res.status(403).json({
                message: "Order not found or you are not authorized to review it.",
            });
        }

       // Find the exact product item in this order.
const { itemIndex } = req.body;

let matchingItem;

if (
    itemIndex !== undefined &&
    Number.isInteger(Number(itemIndex)) &&
    Number(itemIndex) >= 0
) {
    matchingItem = order.items[Number(itemIndex)];

    const selectedProductId =
        matchingItem?.productId?._id || matchingItem?.productId;

    if (
        !matchingItem ||
        String(selectedProductId) !== String(productId)
    ) {
        return res.status(403).json({
            message: "This product does not belong to the selected order.",
        });
    }
} else {
    matchingItem = order.items.find((item) => {
        const itemProductId =
            item.productId?._id || item.productId;

        return String(itemProductId) === String(productId);
    });
}

if (!matchingItem) {
    return res.status(403).json({
        message: "This product does not belong to the selected order.",
    });
}

// Validate the individual item's delivery status.
const itemStatus = String(matchingItem.status || "").toLowerCase();

if (itemStatus !== "delivered") {
    return res.status(403).json({
        message: "You can review this product only after receiving it.",
    });
}

// Prevent reviews for items whose entire quantity was cancelled.
const quantity = Number(matchingItem.quantity || 0);
const cancelledQuantity = Number(matchingItem.cancelledQuantity || 0);

if (quantity > 0 && cancelledQuantity >= quantity) {
    return res.status(403).json({
        message: "A fully cancelled product cannot be reviewed.",
    });
}

// A hidden review still counts as an existing review.
const existingReview = await Review.findOne({
    userId,
    productId,
});

if (existingReview) {
    return res.status(409).json({
        message: "You have already reviewed this product.",
    });
}

const review = await Review.create({
    userId,
    productId,
    orderId,
    rating: numericRating,
    title: cleanTitle,
    comment: cleanComment,
});

return res.status(201).json({
    success: true,
    message: "Review submitted successfully",
    review,
})    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "You have already reviewed this product.",
            });
        }

        console.error("Create review error:", error);

        return res.status(500).json({
            message: "Failed to submit review",
        });
    }
};



    
/* ================= GET PUBLIC PRODUCT REVIEWS ================= */

const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: "Invalid product ID",
            });
        }

        // Exclude hidden reviews from public reviews and ratings.
        const reviews = await Review.find({
            productId,
            isHidden: { $ne: true },
        })
            .populate("userId", "name firstName lastName")
            .sort({ createdAt: -1 })
            .lean();

        const formattedReviews = reviews.map((review) => {
            const customer = review.userId || {};

            const customerName =
                [customer.firstName, customer.lastName]
                    .filter(Boolean)
                    .join(" ") ||
                customer.name ||
                "Customer";

            return {
                ...review,
                customerName,
            };
        });

        const totalReviews = formattedReviews.length;

        const averageRating =
            totalReviews > 0
                ? Number(
                      (
                          formattedReviews.reduce(
                              (sum, review) => sum + review.rating,
                              0
                          ) / totalReviews
                      ).toFixed(1)
                  )
                : 0;

        return res.status(200).json({
            averageRating,
            totalReviews,
            reviews: formattedReviews,
        });
    } catch (error) {
        console.error("Get product reviews error:", error);

        return res.status(500).json({
            message: "Failed to fetch product reviews",
        });
    }
};

/* ================= GET MY REVIEWS ================= */

const getMyReviews = async (req, res) => {
    try {
        // Customers can still see their own reviews if hidden publicly.
        const reviews = await Review.find({
            userId: req.userId,
        })
            .select(
                "productId orderId rating title comment createdAt isHidden adminReply adminRepliedAt"
            )
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ reviews });
    } catch (error) {
        console.error("Get my reviews error:", error);

        return res.status(500).json({
            message: "Failed to fetch your reviews",
        });
    }
};

module.exports = {
    createReview,
    getProductReviews,
    getMyReviews,
};
