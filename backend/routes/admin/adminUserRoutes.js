const express = require("express");

const router = express.Router();

const adminAuthMiddleware = require("../../middleware/admin/adminAuthMiddleware");

const {
  getUsers,
  getUser,
  blockUserAccount,
  unblockUserAccount,
} = require("../../controllers/admin/adminUserController");

// Get all users + search
router.get("/users", adminAuthMiddleware, getUsers);

// Get single user
router.get("/users/:id", adminAuthMiddleware, getUser);

// Block user
router.patch(
  "/users/:id/block",
  adminAuthMiddleware,
  blockUserAccount
);

// Unblock user
router.patch(
  "/users/:id/unblock",
  adminAuthMiddleware,
  unblockUserAccount
);

module.exports = router;