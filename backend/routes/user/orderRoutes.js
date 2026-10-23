
const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/user/authMiddleware");
const {
  createOrder,
  getMyOrders,
  requestReturnExchange,
  cancelOrder,
} = require("../../controllers/user/orderController");

const {
  downloadInvoice,
} = require("../../controllers/user/invoiceController");

const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../../controllers/user/razorpayController");

router.post("/", authMiddleware, createOrder);
router.get("/my-orders", authMiddleware, getMyOrders);
router.post("/return-exchange", authMiddleware, requestReturnExchange);
router.patch("/cancel", authMiddleware, cancelOrder);
router.get("/:orderId/invoice", authMiddleware, downloadInvoice);

router.post(
  "/:orderId/razorpay/create",
  authMiddleware,
  createRazorpayOrder
);

router.post(
  "/:orderId/razorpay/verify",
  authMiddleware,
  verifyRazorpayPayment
);

module.exports = router;