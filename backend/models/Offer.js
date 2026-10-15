
const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      enum: ["Product", "Category"],
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    discountType: {
      type: String,
      enum: ["Fixed", "Percentage"],
      required: true,
      default: "Percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0.01,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("Offer", offerSchema);
