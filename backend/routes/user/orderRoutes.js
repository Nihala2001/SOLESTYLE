
const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/user/authMiddleware");
const {
  createOrder,
  getMyOrders,
  requestReturnExchange,
  cancelOrder,
} = require("../../controllers/user/orderController");

router.post("/", authMiddleware, createOrder);
router.get("/my-orders", authMiddleware, getMyOrders);
router.post("/return-exchange", authMiddleware, requestReturnExchange);
router.patch("/cancel", authMiddleware, cancelOrder);

module.exports = router;