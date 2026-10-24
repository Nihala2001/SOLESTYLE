
const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Credit", "Debit"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    referenceType: {
      type: String,
      enum: ["Order", "Refund", "Adjustment", "Referral", "WalletTopUp"],
      default: "Adjustment",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    transactionId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    transactions: {
      type: [walletTransactionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
