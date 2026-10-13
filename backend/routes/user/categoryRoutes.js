const express = require("express");

const router = express.Router();

const {
  fetchActiveCategories,
} = require("../../controllers/user/categoryController");

// ================= GET ACTIVE CATEGORIES =================

router.get("/", fetchActiveCategories);

module.exports = router;