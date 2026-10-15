
const Coupon = require("../../models/Coupon");

// ================= CREATE COUPON =================

const addCoupon = async (couponData) => {
  const code = couponData.code?.trim().toUpperCase();

  if (!code) {
    throw new Error("Coupon code is required");
  }

  const existingCoupon = await Coupon.findOne({ code });

  if (existingCoupon) {
    throw new Error("Coupon code already exists");
  }

  const coupon = await Coupon.create({
    ...couponData,
    code,
  });

  return coupon;
};

// ================= GET COUPONS =================

const getCoupons = async ({
  search = "",
  page = 1,
  limit = 5,
}) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(
    100,
    Math.max(1, Number(limit) || 5)
  );

  const query = {};

  if (search.trim()) {
    const escapedSearch = search
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    query.$or = [
      { code: { $regex: escapedSearch, $options: "i" } },
      {
        description: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  const totalCoupons = await Coupon.countDocuments(query);

  const coupons = await Coupon.find(query)
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  return {
    coupons,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalCoupons / limitNumber),
      totalCoupons,
      limit: limitNumber,
    },
  };
};

// ================= UPDATE COUPON =================

const updateCoupon = async (couponId, couponData) => {
  const code = couponData.code?.trim().toUpperCase();

  if (!code) {
    throw new Error("Coupon code is required");
  }

  const existingCoupon = await Coupon.findOne({
    code,
    _id: { $ne: couponId },
  });

  if (existingCoupon) {
    throw new Error("Coupon code already exists");
  }

  const coupon = await Coupon.findByIdAndUpdate(
    couponId,
    {
      ...couponData,
      code,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  return coupon;
};

// ================= DEACTIVATE COUPON =================

const deactivateCoupon = async (couponId) => {
  const coupon = await Coupon.findByIdAndUpdate(
    couponId,
    { isActive: false },
    { new: true }
  );

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  return coupon;
};

// ================= ACTIVATE COUPON =================

const activateCoupon = async (couponId) => {
  const coupon = await Coupon.findByIdAndUpdate(
    couponId,
    { isActive: true },
    { new: true }
  );

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  return coupon;
};

module.exports = {
  addCoupon,
  getCoupons,
  updateCoupon,
  deactivateCoupon,
  activateCoupon,
};