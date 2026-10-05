const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    code: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 6
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    expireAt: {
      type: Date,
      required: true,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;