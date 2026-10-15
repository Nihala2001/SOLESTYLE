
const {
  addCoupon,
  getCoupons,
  updateCoupon,
  deactivateCoupon,
  activateCoupon,
} = require("../../services/admin/adminCouponService");

// ================= CREATE COUPON =================

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
    } = req.body;

    if (
      !code?.trim() ||
      !description?.trim() ||
      !discountType ||
      discountValue === undefined ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required coupon fields",
      });
    }

    if (!["Percentage", "Fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    const value = Number(discountValue);
    const minimum = Number(minOrderAmount ?? 0);
    const maximum =
      maxDiscount === "" || maxDiscount === null ||
      maxDiscount === undefined
        ? null
        : Number(maxDiscount);

    const limit =
      usageLimit === "" || usageLimit === null ||
      usageLimit === undefined
        ? null
        : Number(usageLimit);

    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than zero",
      });
    }

    if (discountType === "Percentage" && value > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    if (!Number.isFinite(minimum) || minimum < 0) {
      return res.status(400).json({
        success: false,
        message: "Minimum order amount cannot be negative",
      });
    }

    if (maximum !== null && (
      !Number.isFinite(maximum) || maximum < 0
    )) {
      return res.status(400).json({
        success: false,
        message: "Maximum discount must be zero or greater",
      });
    }

    if (discountType === "Fixed" && maximum !== null) {
      return res.status(400).json({
        success: false,
        message: "Maximum discount is only for percentage coupons",
      });
    }

    if (limit !== null && (
      !Number.isInteger(limit) || limit < 1
    )) {
      return res.status(400).json({
        success: false,
        message: "Usage limit must be a positive whole number",
      });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime()) ||
      parsedEndDate < parsedStartDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid coupon dates",
      });
    }

    const coupon = await addCoupon({
      code,
      description,
      discountType,
      discountValue: value,
      minOrderAmount: minimum,
      maxDiscount: discountType === "Percentage" ? maximum : null,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      usageLimit: limit,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Create coupon error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create coupon",
    });
  }
};

// ================= GET COUPONS =================

const fetchCoupons = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 5 } = req.query;

    const result = await getCoupons({ search, page, limit });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Fetch coupons error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
    });
  }
};

// ================= UPDATE COUPON =================

const editCoupon = async (req, res) => {
  try {
    const coupon = await updateCoupon(req.params.couponId, req.body);

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Update coupon error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update coupon",
    });
  }
};

// ================= DEACTIVATE COUPON =================

const removeCoupon = async (req, res) => {
  try {
    const coupon = await deactivateCoupon(req.params.couponId);

    return res.status(200).json({
      success: true,
      message: "Coupon deactivated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Deactivate coupon error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to deactivate coupon",
    });
  }
};

// ================= ACTIVATE COUPON =================

const restoreCoupon = async (req, res) => {
  try {
    const coupon = await activateCoupon(req.params.couponId);

    return res.status(200).json({
      success: true,
      message: "Coupon activated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Activate coupon error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to activate coupon",
    });
  }
};

module.exports = {
  createCoupon,
  fetchCoupons,
  editCoupon,
  removeCoupon,
  restoreCoupon,
};