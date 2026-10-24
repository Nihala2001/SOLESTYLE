
const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/user/authMiddleware");

const {
  getMyWallet,
  getMyWalletTransactions,
  createWalletTopUp,
  verifyWalletTopUp,
} = require("../../controllers/user/walletController");

router.get("/", authMiddleware, getMyWallet);

router.get(
  "/transactions",
  authMiddleware,
  getMyWalletTransactions
);

router.post(
  "/top-up/create",
  authMiddleware,
  createWalletTopUp
);

router.post(
  "/top-up/verify",
  authMiddleware,
  verifyWalletTopUp
);

module.exports = router;
