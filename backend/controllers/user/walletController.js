const mongoose = require("mongoose");
const Wallet = require("../../models/Wallet");

// Get the logged-in user's wallet, creating one if it does not exist.
const getMyWallet = async (req, res) => {
  try {
    const userId = req.userId;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user authentication.",
      });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          balance: 0,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Wallet fetched successfully.",
      wallet: {
        balance: wallet.balance,
      },
    });
  } catch (error) {
    console.error("Get wallet error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch wallet.",
    });
  }
};

// Get the logged-in user's recent wallet transactions.
const getMyWalletTransactions = async (req, res) => {
  try {
    const userId = req.userId;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user authentication.",
      });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          balance: 0,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
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

module.exports = {
  getMyWallet,
  getMyWalletTransactions,
};
