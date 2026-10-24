
const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Wallet = require("../../models/Wallet");

const getUserId = (req) =>
  req.userId || req.user?._id || req.user?.id || req.user?.userId;

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

// Get wallet, creating it if necessary.
const getMyWallet = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user authentication.",
      });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, balance: 0 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Wallet fetched successfully.",
      wallet: { balance: wallet.balance },
    });
  } catch (error) {
    console.error("Get wallet error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch wallet.",
    });
  }
};

// Get recent wallet transactions.
const getMyWalletTransactions = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user authentication.",
      });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, balance: 0 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .select("transactions")
      .lean();

    const transactions = (wallet.transactions || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);

    return res.status(200).json({
      success: true,
      message: "Wallet transactions fetched successfully.",
      transactions,
    });
  } catch (error) {
    console.error("Get wallet transactions error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch wallet transactions.",
    });
  }
};

// Create a Razorpay order for a wallet top-up.
const createWalletTopUp = async (req, res) => {
  try {
    const userId = getUserId(req);
    const amount = Number(req.body.amount);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please log in again.",
      });
    }

    if (!Number.isFinite(amount) || amount < 1 || amount > 50000) {
      return res.status(400).json({
        success: false,
        message: "Enter an amount between ₹1 and ₹50,000.",
      });
    }

    const amountInPaise = Math.round(amount * 100);

    if (
      !Number.isSafeInteger(amountInPaise) ||
      Math.abs(amount * 100 - amountInPaise) > 0.000001
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid amount with at most two decimal places.",
      });
    }

    const razorpay = getRazorpayClient();

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `wallet_${new mongoose.Types.ObjectId()}`,
      notes: {
        purpose: "SOLESTYLE_WALLET_TOPUP",
        userId: String(userId),
        amountInPaise: String(amountInPaise),
      },
    });

    return res.status(201).json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrder,
    });
  } catch (error) {
    console.error("Create wallet top-up error:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message === "Razorpay credentials are not configured."
          ? error.message
          : "Unable to start wallet top-up.",
    });
  }
};

// Verify the captured payment, then credit the wallet once.
const verifyWalletTopUp = async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
    } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please log in again.",
      });
    }

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Required payment details are missing.",
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay credentials are not configured.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const received = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed.",
      });
    }

    const razorpay = getRazorpayClient();

    const [gatewayOrder, payment] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id),
    ]);

    const notes = gatewayOrder.notes || {};
    const expectedAmount = Number(notes.amountInPaise);

    if (
      notes.purpose !== "SOLESTYLE_WALLET_TOPUP" ||
      notes.userId !== String(userId) ||
      gatewayOrder.currency !== "INR" ||
      !Number.isSafeInteger(expectedAmount) ||
      expectedAmount < 100 ||
      expectedAmount > 5000000 ||
      Number(gatewayOrder.amount) !== expectedAmount ||
      Number(amount) !== expectedAmount / 100 ||
      payment.order_id !== razorpay_order_id ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      return res.status(400).json({
        success: false,
        message: "Captured payment details do not match this top-up.",
      });
    }

    // Create the wallet if it does not exist.
    await Wallet.updateOne(
      { userId },
      { $setOnInsert: { userId, balance: 0 } },
      { upsert: true }
    );

    // The payment ID is the idempotency key. Concurrent or repeated
    // verification requests cannot credit the same payment twice.
    const alreadyCredited = await Wallet.exists({
      userId,
      "transactions.transactionId": `TOPUP-${razorpay_payment_id}`,
    });

    if (alreadyCredited) {
      const existingWallet = await Wallet.findOne({ userId }).lean();

      return res.status(200).json({
        success: true,
        message: "This wallet top-up has already been credited.",
        wallet: { balance: existingWallet.balance },
      });
    }

    const transactionId = `TOPUP-${razorpay_payment_id}`;
    const creditAmount = expectedAmount / 100;

    // Atomic update with a duplicate guard to prevent double credit.
    const creditedWallet = await Wallet.findOneAndUpdate(
      {
        userId,
        "transactions.transactionId": { $ne: transactionId },
      },
      {
        $inc: { balance: creditAmount },
        $push: {
          transactions: {
            type: "Credit",
            amount: creditAmount,
            description: "Wallet top-up via Razorpay",
            referenceType: "WalletTopUp",
            referenceId: null,
            transactionId,
            // Set below to the balance resulting from the atomic credit.
            // This field is corrected using a follow-up update below.
            balanceAfter: 0,
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!creditedWallet) {
      const latestWallet = await Wallet.findOne({ userId }).lean();

      return res.status(200).json({
        success: true,
        message: "This wallet top-up has already been credited.",
        wallet: { balance: latestWallet.balance },
      });
    }

    const transaction = creditedWallet.transactions.find(
      (entry) => entry.transactionId === transactionId
    );

    if (transaction) {
      transaction.balanceAfter = creditedWallet.balance;
      await creditedWallet.save();
    }

    return res.status(200).json({
      success: true,
      message: "Wallet topped up successfully.",
      wallet: { balance: creditedWallet.balance },
    });
  } catch (error) {
    console.error("Verify wallet top-up error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify wallet top-up.",
    });
  }
};

module.exports = {
  getMyWallet,
  getMyWalletTransactions,
  createWalletTopUp,
  verifyWalletTopUp,
};
