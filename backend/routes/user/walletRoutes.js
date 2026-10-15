const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/user/authMiddleware");

const {
  getMyWallet,
  getMyWalletTransactions,
} = require("../../controllers/user/walletController");

router.get("/", authMiddleware, getMyWallet);

router.get(
  "/transactions",
  authMiddleware,
  getMyWalletTransactions
);

module.exports = router;
