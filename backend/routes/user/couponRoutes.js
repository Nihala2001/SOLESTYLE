const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/user/authMiddleware");
const {
fetchAvailableCoupons,
} = require("../../controllers/user/couponController");

router.get("/", authMiddleware, fetchAvailableCoupons);

module.exports = router;
