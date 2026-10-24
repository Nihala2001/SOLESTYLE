const express = require("express");
const router = express.Router();

const adminAuthMiddleware = require("../../middleware/admin/adminAuthMiddleware");

const {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    updateOrderItemStatus,
    updatePaymentStatus,
    getReturnExchangeRequests,
    updateReturnExchangeStatus,
} = require("../../controllers/admin/adminOrderController");
// Get all orders with search, status filter, and pagination
router.get("/", adminAuthMiddleware, getAllOrders);

// Return and exchange requests
router.get("/returns", adminAuthMiddleware, getReturnExchangeRequests);

router.patch(
    "/returns/:orderId/:requestId",
    adminAuthMiddleware,
    updateReturnExchangeStatus
);

// Get one order's details
router.get("/:orderId", adminAuthMiddleware, getOrderById);

// Update an order's status
router.patch("/:orderId/status", adminAuthMiddleware, updateOrderStatus);

// Update payment status
router.patch(
    "/:orderId/payment-status",
    adminAuthMiddleware,
    updatePaymentStatus
);

// Update one product's delivery status.
router.patch(
    "/:orderId/items/:itemId/status",
    adminAuthMiddleware,
    updateOrderItemStatus
);


module.exports = router;
