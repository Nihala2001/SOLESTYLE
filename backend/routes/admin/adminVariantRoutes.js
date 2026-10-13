const express = require("express");
const router = express.Router();

const authMiddleware =
  require("../../middleware/admin/adminAuthMiddleware");

const upload =
  require("../../middleware/admin/uploadMiddleware");


const {
  createProductVariants,
  fetchProductVariants,
  updateProductVariant,
  updateProductMainImage,
  updateProductColorImages,
} = require("../../controllers/admin/adminVariantController");


// Get variants for a product
router.get(
  "/:productId",
  authMiddleware,
  fetchProductVariants
);

// Create product variants
router.post(
  "/",
  authMiddleware,
  upload.array("variantImages", 20),
  createProductVariants
);

// Update a variant
router.put(
  "/:variantId",
  authMiddleware,
  updateProductVariant
);

// Update main image
router.patch(
  "/:productId/main-image",
  authMiddleware,
  updateProductMainImage
);
// Update images shared by all sizes of a color
router.patch(
  "/:productId/images",
  authMiddleware,
  upload.array("variantImages", 20),
  updateProductColorImages
);

module.exports = router;
