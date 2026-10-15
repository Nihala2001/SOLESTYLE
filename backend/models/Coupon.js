
const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    description: {
      type: String,
      required: [true, "Coupon description is required"],
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["Percentage", "Fixed"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: [0.01, "Discount must be greater than zero"],
    },

    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxDiscount: {
      type: Number,
      default: null,
      min: 0,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.pre("validate", function () {
  if (this.discountType === "Percentage" && this.discountValue > 100) {
    this.invalidate(
      "discountValue",
      "Percentage discount cannot exceed 100"
    );
  }

  if (
    this.discountType === "Fixed" &&
    this.maxDiscount !== null &&
    this.maxDiscount !== undefined
  ) {
    this.invalidate(
      "maxDiscount",
      "Maximum discount applies only to percentage coupons"
    );
  }

  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate(
      "endDate",
      "End date must be on or after the start date"
    );
  }
});

module.exports = mongoose.model("Coupon", couponSchema);