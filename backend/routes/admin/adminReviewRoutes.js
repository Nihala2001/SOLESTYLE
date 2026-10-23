const express = require("express");
const router = express.Router();

const adminAuthMiddleware = require("../../middleware/admin/adminAuthMiddleware");

const {
    getAllReviews,
    deleteReview,
    toggleReviewVisibility,
    replyToReview,
} = require("../../controllers/admin/adminReviewController");

router.get("/", adminAuthMiddleware, getAllReviews);

router.delete("/:reviewId", adminAuthMiddleware, deleteReview);

router.patch(
    "/:reviewId/visibility",
    adminAuthMiddleware,
    toggleReviewVisibility
);

router.patch(
    "/:reviewId/reply",
    adminAuthMiddleware,
    replyToReview
);

module.exports = router;