
const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/user/authMiddleware");

const {
    createReview,
    getProductReviews,
    getMyReviews,
    deleteMyReview,
} = require("../../controllers/user/reviewController");

// Public: display reviews on Product Details.
router.get("/product/:productId", getProductReviews);

// Authenticated: submit a review.
router.post("/", authMiddleware, createReview);

// Authenticated: find the current customer's reviews.
router.get("/my-reviews", authMiddleware, getMyReviews);

// Authenticated: delete only the logged-in customer's own review.
router.delete("/:reviewId", authMiddleware, deleteMyReview);

module.exports = router;
