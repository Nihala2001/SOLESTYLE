const express = require("express");

const router = express.Router();

const adminAuthMiddleware = require("../../middleware/admin/adminAuthMiddleware");

const {
  createCategory,
  fetchCategories,
  editCategory,
  removeCategory,
  restoreCategory
} = require("../../controllers/admin/adminCategoryController");


// Add category
router.post(
  "/",
  adminAuthMiddleware,
  createCategory
);


// Get categories
router.get(
  "/",
  adminAuthMiddleware,
  fetchCategories
);


// Edit category
router.put(
  "/:categoryId",
  adminAuthMiddleware,
  editCategory
);


// Soft delete category
router.delete(
  "/:categoryId",
  adminAuthMiddleware,
  removeCategory
);

// Reactivate category
router.patch(
  "/:categoryId/activate",
  restoreCategory
);

module.exports = router;