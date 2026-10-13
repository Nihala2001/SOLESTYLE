const express = require("express");

const router = express.Router();

const {
  fetchActiveProducts,
} = require("../../controllers/user/productController");

// ================= GET ACTIVE PRODUCTS =================

router.get("/", fetchActiveProducts);

module.exports = router;