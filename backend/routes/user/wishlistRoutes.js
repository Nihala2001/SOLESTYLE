
const express = require("express");
const router = express.Router();

const {
  fetchWishlist,
  addWishlistItem,
  deleteWishlistItem,
} = require("../../controllers/user/wishlistController");

const authMiddleware = require("../../middleware/user/authMiddleware");

// Get wishlist
router.get("/", authMiddleware, fetchWishlist);

// Add item to wishlist
router.post("/items", authMiddleware, addWishlistItem);

// Remove item from wishlist
router.delete("/items/:itemId", authMiddleware, deleteWishlistItem);

module.exports = router;