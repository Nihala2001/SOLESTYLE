
const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/user/authMiddleware");
const {
  createOrder,
  getMyOrders,
  getCheckoutDiscountPreview,
  requestReturnExchange,
  cancelOrder,
} = require("../../controllers/user/orderController");

const {
  downloadInvoice,
} = require("../../controllers/user/invoiceController");

const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  expireUpiOrder,
} = require("../../controllers/user/razorpayController");



router.post("/", authMiddleware, createOrder);
router.get("/my-orders", authMiddleware, getMyOrders);
router.post("/return-exchange", authMiddleware, requestReturnExchange);
router.patch("/cancel", authMiddleware, cancelOrder);
router.post(
  "/preview-discounts",
  authMiddleware,
  getCheckoutDiscountPreview
);

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

router.post(
  "/:orderId/razorpay/expire",
  authMiddleware,
  expireUpiOrder
);
module.exports = router;