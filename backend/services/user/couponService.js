const Coupon = require("../../models/Coupon");

const getAvailableCoupons = async () => {
  const now = new Date();

  return Coupon.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
    ],
  })
    .select(
      "code description discountType discountValue minOrderAmount maxDiscount startDate endDate"
    )
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = { getAvailableCoupons };