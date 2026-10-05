const express = require("express");

const router = express.Router();

const adminAuthMiddleware = require("../../middleware/admin/adminAuthMiddleware");

const {
  getProfile,
  updateProfile,
} = require("../../controllers/admin/adminProfileController");

// Get admin profile
router.get(
  "/profile",
  adminAuthMiddleware,
  getProfile
);

// Update admin profile
router.put(
  "/profile",
  adminAuthMiddleware,
  updateProfile
);

module.exports = router;