const express = require("express");

const router = express.Router();

const {
  fetchActiveProductVariants,
} = require("../../controllers/user/variantController");

// ================= GET ACTIVE PRODUCT VARIANTS =================

router.get(
  "/:productId",
  fetchActiveProductVariants
);

module.exports = router;