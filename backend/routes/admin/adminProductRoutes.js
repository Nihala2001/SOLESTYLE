const express = require("express");

const router = express.Router();

const authMiddleware = require("../../middleware/admin/adminAuthMiddleware");

const upload = require("../../middleware/admin/uploadMiddleware");

const {
  createProduct,
  fetchProducts,
  editProduct,
  removeProduct,
  restoreProduct,
} = require("../../controllers/admin/adminProductController");

// Add product
router.post(
  "/",
  authMiddleware,
  upload.array("images", 5),
  createProduct
);

// Get products
router.get(
  "/",
  authMiddleware,
  fetchProducts
);

// Edit product
router.put(
  "/:productId",
  authMiddleware,
  editProduct
);

// Soft delete product
router.delete(
  "/:productId",
  authMiddleware,
  removeProduct
);

// Activate product
router.patch(
  "/:productId/activate",
  authMiddleware,
  restoreProduct
);

module.exports = router;