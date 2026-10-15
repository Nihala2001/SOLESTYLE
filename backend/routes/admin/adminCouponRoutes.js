
const express = require("express");
const router = express.Router();

const adminAuthMiddleware = require("../../middleware/admin/adminAuthMiddleware");

const {
  createCoupon,
  fetchCoupons,
  editCoupon,
  removeCoupon,
  restoreCoupon,
} = require("../../controllers/admin/adminCouponController");

router.post("/", adminAuthMiddleware, createCoupon);

router.get("/", adminAuthMiddleware, fetchCoupons);

router.put("/:couponId", adminAuthMiddleware, editCoupon);

router.patch("/:couponId/deactivate", adminAuthMiddleware, removeCoupon);

router.patch("/:couponId/activate", adminAuthMiddleware, restoreCoupon);

module.exports = router;