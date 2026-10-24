const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String
    },

    passwordResetVerified: {
      type: Boolean,
      default: false
    },

    profileImage: {
      type: [String],
      default: []
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true
    },

    referralCodeUsed: {
      type: String,
      default: null
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    referralFirstOrderDiscountUsed: {
      type: Boolean,
      default: false,
    },

    referralFirstOrderDiscountUsed: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;