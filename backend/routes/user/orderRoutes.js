
const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/user/authMiddleware");
const {
  createOrder,
  getMyOrders,
} = require("../../controllers/user/orderController");

router.post("/", authMiddleware, createOrder);
router.get("/my-orders", authMiddleware, getMyOrders);

module.exports = router;