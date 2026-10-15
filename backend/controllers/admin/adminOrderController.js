const mongoose = require("mongoose");
const Order = require("../../models/Order");
const Wallet = require("../../models/Wallet");

// Get all orders
const getAllOrders = async (req, res) => {
    try {
        const { search = "", status = "", page = 1, limit = 5 } = req.query;


        const currentPage = Math.max(1, Number(page) || 1);
        const pageLimit = Math.max(1, Math.min(50, Number(limit) || 5));

        const filter = {};

        if (status) {
            filter.orderStatus = status;
        }

        if (search.trim()) {
            const matchingUsers = await mongoose
                .model("User")
                .find({
                    $or: [
                        { name: { $regex: search.trim(), $options: "i" } },
                        { email: { $regex: search.trim(), $options: "i" } },
                    ],
                })
                .select("_id");

            filter.$or = [
                { orderNumber: { $regex: search.trim(), $options: "i" } },
                { userId: { $in: matchingUsers.map((user) => user._id) } },
            ];
        }

        const totalOrders = await Order.countDocuments(filter);

        const orders = await Order.find(filter)
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * pageLimit)
            .limit(pageLimit);

        return res.status(200).json({
            success: true,
            orders,
            pagination: {
                currentPage,
                totalPages: Math.ceil(totalOrders / pageLimit),
                totalOrders,
            },
        });
    } catch (error) {
        console.error("Get all orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
        });
    }


};

// Get one order
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        const order = await Order.findById(orderId).populate(
            "userId",
            "name email"
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        return res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error("Get order details error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch order details",
        });
    }


};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus } = req.body;


        const allowedStatuses = [
            "Placed",
            "Confirmed",
            "Shipped",
            "Out for Delivery",
            "Delivered",
            "Cancelled",
            "Return Requested",
            "Returned",
        ];

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status",
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (["Cancelled", "Returned"].includes(order.orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "This order can no longer be updated",
            });
        }

        // Save the delivery date when the order is marked Delivered.
        if (orderStatus === "Delivered" && !order.deliveredAt) {
            order.deliveredAt = new Date();
        }

        order.orderStatus = orderStatus;
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order,
        });
    } catch (error) {
        console.error("Update order status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update order status",
        });
    }


};

// Update payment status after confirming payment
const updatePaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentStatus } = req.body;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        // Admin can confirm payment as Paid only.
        if (paymentStatus !== "Paid") {
            return res.status(400).json({
                success: false,
                message: "Only payment confirmation is allowed here",
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (order.paymentStatus === "Paid") {
            return res.status(400).json({
                success: false,
                message: "Payment is already marked as Paid",
            });
        }

        order.paymentStatus = "Paid";
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Payment status updated successfully",
            order,
        });
    } catch (error) {
        console.error("Update payment status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update payment status",
        });
    }
};

const getReturnExchangeRequests = async (req, res) => {
    try {

        const orders = await Order.find({
            "items.returnExchange.status": {
                $in: [
                    "Requested",
                    "Approved",
                    "Rejected",
                    "Pickup Scheduled",
                    "Product Received",
                    "Replacement Shipped",
                    "Out for Delivery",
                    "Completed",
                ],
            },
        })
            .populate("userId", "name email")
            .sort({ updatedAt: -1 });

        const requests = [];

        orders.forEach((order) => {
            order.items.forEach((item, itemIndex) => {
                if (
                    item.returnExchange &&
                    item.returnExchange.status !== "Not Requested"
                ) {
                    requests.push({
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        orderStatus: order.orderStatus,
                        customerName: order.userId?.name || "Unknown customer",
                        customerEmail: order.userId?.email || "",
                        itemIndex,
                        item,
                        request: item.returnExchange,
                    });
                }
            });
        });

        return res.status(200).json({
            success: true,
            requests,
        });
    } catch (error) {
        console.error("Get return/exchange requests error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch return/exchange requests",
        });
    }
};


const updateReturnExchangeStatus = async (req, res) => {
    let session;

    try {
        const { orderId, itemIndex } = req.params;
        const { status } = req.body;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        const allowedStatuses = [
            "Approved",
            "Rejected",
            "Pickup Scheduled",
            "Product Received",
            "Replacement Shipped",
            "Out for Delivery",
            "Completed",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid return/exchange status",
            });
        }

        const index = Number(itemIndex);

        if (!Number.isInteger(index) || index < 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid order item",
            });
        }

        session = await mongoose.startSession();

        let result;

        await session.withTransaction(async () => {
            const order = await Order.findById(orderId).session(session);

            if (!order) {
                throw Object.assign(new Error("Order not found"), {
                    statusCode: 404,
                });
            }

            if (index >= order.items.length) {
                throw Object.assign(new Error("Invalid order item"), {
                    statusCode: 400,
                });
            }

            const item = order.items[index];
            const request = item.returnExchange;

            if (
                !request ||
                request.status === "Not Requested"
            ) {
                throw Object.assign(
                    new Error("No return/exchange request exists for this item"),
                    { statusCode: 400 }
                );
            }

            // Requests must be reviewed before they can be completed.
            if (request.status === "Requested") {
                if (!["Approved", "Rejected"].includes(status)) {
                    throw Object.assign(
                        new Error("Approve the request before completing it"),
                        { statusCode: 400 }
                    );
                }

                request.status = status;
                await order.save({ session });

                result = {
                    message: `Request ${status.toLowerCase()} successfully`,
                    refundAmount: 0,
                };

                return;
            }


            // Exchange requests must follow each stage in order.
            if (request.type === "Exchange") {
                const nextExchangeStage = {
                    Approved: "Pickup Scheduled",
                    "Pickup Scheduled": "Product Received",
                    "Product Received": "Replacement Shipped",
                    "Replacement Shipped": "Out for Delivery",
                    "Out for Delivery": "Completed",
                };

                const expectedStatus = nextExchangeStage[request.status];

                if (!expectedStatus || status !== expectedStatus) {
                    throw Object.assign(
                        new Error(
                            expectedStatus
                                ? `The next exchange stage must be "${expectedStatus}"`
                                : "This exchange request has already been processed"
                        ),
                        { statusCode: 400 }
                    );
                }

                request.status = status;
                await order.save({ session });

                result = {
                    message:
                        status === "Completed"
                            ? "Exchange completed successfully"
                            : `Exchange status updated to ${status}`,
                    refundAmount: 0,
                };

                return;
            }

            // Returns can be completed only after approval.
            if (request.status !== "Approved" || status !== "Completed") {
                throw Object.assign(
                    new Error(
                        "Only approved return requests can be completed"
                    ),
                    { statusCode: 400 }
                );
            }


            let refundAmount = 0;
            let transactionId = null;

            if (request.type === "Return") {
                if (
                    request.refundedAt ||
                    request.refundTransactionId
                ) {
                    throw Object.assign(
                        new Error("This item has already been refunded"),
                        { statusCode: 400 }
                    );
                }

                if (order.orderStatus !== "Delivered") {
                    throw Object.assign(
                        new Error("Only delivered orders can be refunded"),
                        { statusCode: 400 }
                    );
                }

                // A delivered COD order counts as paid.
                if (
                    order.paymentMethod === "COD" &&
                    order.paymentStatus === "Pending"
                ) {
                    order.paymentStatus = "Paid";
                }

                if (order.paymentStatus !== "Paid") {
                    throw Object.assign(
                        new Error(
                            "Payment must be confirmed before issuing a refund"
                        ),
                        { statusCode: 400 }
                    );
                }

                // Item price already includes any product-level offer.
                const itemGross = Number(
                    (Number(item.price) * Number(item.quantity)).toFixed(2)
                );

                // Allocate the order coupon discount proportionally.
                const subtotal = Number(order.subtotal || 0);
                const orderDiscount = Number(order.discount || 0);

                const couponShare =
                    subtotal > 0
                        ? Math.min(
                            itemGross,
                            Number(
                                (
                                    orderDiscount *
                                    itemGross /
                                    subtotal
                                ).toFixed(2)
                            )
                        )
                        : 0;

                refundAmount = Number(
                    Math.max(0, itemGross - couponShare).toFixed(2)
                );

                if (refundAmount > 0) {
                    transactionId = `RETURN-${order._id}-${index}`;

                    let wallet = await Wallet.findOne({
                        userId: order.userId,
                    }).session(session);

                    if (!wallet) {
                        wallet = new Wallet({
                            userId: order.userId,
                            balance: 0,
                            transactions: [],
                        });
                    }

                    // Idempotency protection: never credit the same item twice.
                    const alreadyCredited = wallet.transactions.some(
                        (transaction) =>
                            transaction.transactionId === transactionId
                    );

                    if (alreadyCredited) {
                        throw Object.assign(
                            new Error(
                                "A refund transaction already exists for this item"
                            ),
                            { statusCode: 400 }
                        );
                    }

                    const newBalance = Number(
                        (Number(wallet.balance || 0) + refundAmount).toFixed(2)
                    );

                    wallet.balance = newBalance;

                    wallet.transactions.push({
                        type: "Credit",
                        amount: refundAmount,
                        description: `Refund for returned item: ${item.productName}`,
                        referenceType: "Refund",
                        referenceId: order._id,
                        balanceAfter: newBalance,
                        transactionId,
                    });

                    await wallet.save({ session });

                    request.refundAmount = refundAmount;
                    request.refundedAt = new Date();
                    request.refundTransactionId = transactionId;

                    order.refundAmount = Number(
                        (
                            Number(order.refundAmount || 0) +
                            refundAmount
                        ).toFixed(2)
                    );
                    order.refundedAt = new Date();
                }
            }

            request.status = "Completed";

            // Mark the order Returned only when every item has been returned.
            const allItemsReturned = order.items.every((orderItem) => {
                const returnRequest = orderItem.returnExchange;

                return (
                    returnRequest?.type === "Return" &&
                    returnRequest?.status === "Completed"
                );
            });

            if (allItemsReturned) {
                order.orderStatus = "Returned";
                order.paymentStatus = "Refunded";
            }

            await order.save({ session });

            result = {
                message:
                    request.type === "Return"
                        ? refundAmount > 0
                            ? `Return completed. ₹${refundAmount.toFixed(2)} credited to the customer's wallet.`
                            : "Return completed. No refund was due for this item."
                        : "Exchange completed successfully",
                refundAmount,
            };
        });

        return res.status(200).json({
            success: true,
            message: result.message,
            refundAmount: result.refundAmount,
        });
    } catch (error) {
        console.error("Update return/exchange status error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Failed to update return/exchange status",
        });
    } finally {
        if (session) {
            await session.endSession();
        }
    }
};


module.exports = {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    getReturnExchangeRequests,
    updateReturnExchangeStatus,
};
