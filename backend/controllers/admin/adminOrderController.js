const mongoose = require("mongoose");
const Order = require("../../models/Order");
const Wallet = require("../../models/Wallet");
const Variant = require("../../models/Variant");

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
    let session;

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

        session = await mongoose.startSession();

        let updatedOrder;

        await session.withTransaction(async () => {
            const order = await Order.findById(orderId).session(session);

            if (!order) {
                throw Object.assign(new Error("Order not found"), {
                    statusCode: 404,
                });
            }

            const currentStatus = order.orderStatus;

            if (currentStatus === orderStatus) {
                throw Object.assign(
                    new Error(`Order is already ${currentStatus}`),
                    { statusCode: 400 }
                );
            }

            // Terminal statuses cannot be changed.
            if (["Cancelled", "Returned"].includes(currentStatus)) {
                throw Object.assign(
                    new Error(
                        `An order with status "${currentStatus}" cannot be updated`
                    ),
                    { statusCode: 400 }
                );
            }

            // Return statuses must use the return/exchange workflow.
            if (
                ["Return Requested", "Returned"].includes(orderStatus) ||
                currentStatus === "Return Requested"
            ) {
                throw Object.assign(
                    new Error(
                        "Return statuses must be updated through the return/exchange workflow"
                    ),
                    { statusCode: 400 }
                );
            }

            const allowedTransitions = {
                Placed: ["Confirmed", "Cancelled"],
                Confirmed: ["Shipped", "Cancelled"],
                Shipped: ["Out for Delivery"],
                "Out for Delivery": ["Delivered"],
                Delivered: [],
            };

            const nextStatuses = allowedTransitions[currentStatus];

            if (!nextStatuses || !nextStatuses.includes(orderStatus)) {
                throw Object.assign(
                    new Error(
                        `Invalid status transition: "${currentStatus}" → "${orderStatus}".`
                    ),
                    { statusCode: 400 }
                );
            }

            // ================= CANCEL ORDER =================

            if (orderStatus === "Cancelled") {
                // A paid order must not be treated as a failed payment.
                // Refund handling for paid orders should be separate.
                if (
                    order.paymentMethod === "UPI" &&
                    order.paymentStatus === "Paid"
                ) {
                    throw Object.assign(
                        new Error(
                            "This online payment is already marked Paid. Handle its refund before cancelling."
                        ),
                        { statusCode: 400 }
                    );
                }

                for (const item of order.items) {
                    if (!item.variantId) {
                        throw Object.assign(
                            new Error(
                                `Variant ID is missing for ${item.productName || "an order item"}. Stock was not restored.`
                            ),
                            { statusCode: 400 }
                        );
                    }

                    // Do not restore quantities that were already cancelled
                    // through a separate item-level cancellation flow.
                    const orderedQuantity = Number(item.quantity || 0);
                    const alreadyCancelled = Number(
                        item.cancelledQuantity || 0
                    );

                    const quantityToRestore =
                        orderedQuantity - alreadyCancelled;

                    if (quantityToRestore < 0) {
                        throw Object.assign(
                            new Error(
                                `Invalid cancelled quantity for ${item.productName || "an order item"}.`
                            ),
                            { statusCode: 400 }
                        );
                    }

                    if (quantityToRestore > 0) {
                        const variantUpdate = await Variant.updateOne(
                            { _id: item.variantId },
                            { $inc: { stock: quantityToRestore } },
                            { session }
                        );

                        if (variantUpdate.matchedCount === 0) {
                            throw Object.assign(
                                new Error(
                                    `Variant not found for ${item.productName || "an order item"}.`
                                ),
                                { statusCode: 400 }
                            );
                        }
                    }

                    // Keep the cancellation quantity consistent with the
                    // entire order being cancelled, when this field exists
                    // in the Order item schema.
                    item.cancelledQuantity = orderedQuantity;
                }

                // Block any later payment verification from using the
                // released stock reservation.
                if (order.paymentMethod === "UPI") {
                    if (order.paymentStatus === "Pending") {
                        order.paymentStatus = "Failed";
                    }

                    order.razorpayReservationsReleased = true;
                }
            }

            if (orderStatus === "Delivered" && !order.deliveredAt) {
                order.deliveredAt = new Date();
            }

            order.orderStatus = orderStatus;

            await order.save({ session });

            updatedOrder = order;
        });

        return res.status(200).json({
            success: true,
            message:
                orderStatus === "Cancelled"
                    ? "Order cancelled and stock restored successfully."
                    : `Order status updated to "${orderStatus}" successfully.`,
            order: updatedOrder,
        });
    } catch (error) {
        console.error("Update order status error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message || "Failed to update order status",
        });
    } finally {
        if (session) {
            await session.endSession();
        }
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
            $or: [
                {
                    "items.itemActionRequests.0": {
                        $exists: true,
                    },
                },
                {
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
                },
            ],
        })
            .populate("userId", "name email")
            .sort({ updatedAt: -1 });

        const requests = [];

        orders.forEach((order) => {
            order.items.forEach((item, itemIndex) => {
                // New quantity-based requests.
                (item.itemActionRequests || []).forEach((request) => {
                    requests.push({
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        orderStatus: order.orderStatus,
                        customerName:
                            order.userId?.name || "Unknown customer",
                        customerEmail: order.userId?.email || "",
                        itemIndex,
                        requestId: request._id,
                        item,
                        request,
                    });
                });

                // Keep older requests visible for compatibility.
                const legacy = item.returnExchange;

                if (
                    legacy &&
                    legacy.status &&
                    legacy.status !== "Not Requested" &&
                    !(item.itemActionRequests || []).length
                ) {
                    requests.push({
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        orderStatus: order.orderStatus,
                        customerName:
                            order.userId?.name || "Unknown customer",
                        customerEmail: order.userId?.email || "",
                        itemIndex,
                        requestId: null,
                        item,
                        request: legacy,
                        legacy: true,
                    });
                }
            });
        });

        requests.sort(
            (a, b) =>
                new Date(b.request.requestedAt || 0) -
                new Date(a.request.requestedAt || 0)
        );

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
        const { orderId } = req.params;
        const requestId =
            req.params.requestId || req.body.requestId;
        const { status } = req.body;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        if (!mongoose.isValidObjectId(requestId)) {
            return res.status(400).json({
                success: false,
                message: "A valid request ID is required",
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

        session = await mongoose.startSession();

        let result;

        await session.withTransaction(async () => {
            const order = await Order.findById(orderId).session(session);

            if (!order) {
                throw Object.assign(new Error("Order not found"), {
                    statusCode: 404,
                });
            }

            let item;
            let request;

            for (const orderItem of order.items) {
                const foundRequest = (
                    orderItem.itemActionRequests || []
                ).id(requestId);

                if (foundRequest) {
                    item = orderItem;
                    request = foundRequest;
                    break;
                }
            }

            if (!item || !request) {
                throw Object.assign(
                    new Error("Return/exchange request not found"),
                    { statusCode: 404 }
                );
            }

            if (
                request.status === "Completed" ||
                request.status === "Rejected"
            ) {
                throw Object.assign(
                    new Error("This request has already been processed"),
                    { statusCode: 400 }
                );
            }

            // Review a new request first.
            if (request.status === "Requested") {
                if (!["Approved", "Rejected"].includes(status)) {
                    throw Object.assign(
                        new Error(
                            "Approve or reject the request before proceeding"
                        ),
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

            // Exchange requests must follow the correct stages.
            if (request.type === "Exchange") {
                const nextStage = {
                    Approved: "Pickup Scheduled",
                    "Pickup Scheduled": "Product Received",
                    "Product Received": "Replacement Shipped",
                    "Replacement Shipped": "Out for Delivery",
                    "Out for Delivery": "Completed",
                };

                const expectedStatus = nextStage[request.status];

                if (!expectedStatus || status !== expectedStatus) {
                    throw Object.assign(
                        new Error(
                            expectedStatus
                                ? `The next exchange stage must be "${expectedStatus}"`
                                : "Invalid exchange status transition"
                        ),
                        { statusCode: 400 }
                    );
                }

                // Check and reserve replacement stock when it ships.
                if (status === "Replacement Shipped") {
                    if (
                        !request.replacementVariantId ||
                        !mongoose.isValidObjectId(
                            request.replacementVariantId
                        )
                    ) {
                        throw Object.assign(
                            new Error("Replacement variant is invalid"),
                            { statusCode: 400 }
                        );
                    }

                    const replacementVariant = await Variant.findById(
                        request.replacementVariantId
                    ).session(session);

                    if (
                        !replacementVariant ||
                        replacementVariant.isActive === false ||
                        Number(replacementVariant.stock) <
                        Number(request.quantity)
                    ) {
                        throw Object.assign(
                            new Error(
                                "The replacement variant does not have enough stock"
                            ),
                            { statusCode: 400 }
                        );
                    }

                    replacementVariant.stock -= Number(request.quantity);
                    await replacementVariant.save({ session });
                }

                if (status === "Completed") {
                    item.exchangedQuantity =
                        Number(item.exchangedQuantity || 0) +
                        Number(request.quantity || 1);
                }

                request.status = status;
                await order.save({ session });

                result = {
                    message: `Exchange status updated to ${status}`,
                    refundAmount: 0,
                };

                return;
            }

            // A return can be completed only after approval.
            if (
                request.type !== "Return" ||
                request.status !== "Approved" ||
                status !== "Completed"
            ) {
                throw Object.assign(
                    new Error(
                        "Only approved return requests can be completed"
                    ),
                    { statusCode: 400 }
                );
            }

            if (request.refundedAt || request.refundTransactionId) {
                throw Object.assign(
                    new Error("This request has already been refunded"),
                    { statusCode: 400 }
                );
            }

            if (
                order.orderStatus !== "Delivered" &&
                order.orderStatus !== "Return Requested"
            ) {
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

            const quantity = Number(request.quantity || 1);

            if (
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantity >
                Number(item.quantity) -
                Number(item.cancelledQuantity || 0) -
                Number(item.returnedQuantity || 0) -
                Number(item.exchangedQuantity || 0)
            ) {
                throw Object.assign(
                    new Error(
                        "The requested quantity is no longer available to return"
                    ),
                    { statusCode: 400 }
                );
            }

            // Calculate the refund for this request's quantity only.
            const itemGross = Number(
                (Number(item.price) * quantity).toFixed(2)
            );

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

            const refundAmount = Number(
                Math.max(0, itemGross - couponShare).toFixed(2)
            );

            const transactionId =
                `RETURN-${order._id}-${request._id}`;

            if (refundAmount > 0) {
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

                // Prevent duplicate wallet credits.
                const alreadyCredited = wallet.transactions.some(
                    (transaction) =>
                        transaction.transactionId === transactionId
                );

                if (alreadyCredited) {
                    throw Object.assign(
                        new Error(
                            "This refund transaction has already been credited"
                        ),
                        { statusCode: 400 }
                    );
                }

                const newBalance = Number(
                    (
                        Number(wallet.balance || 0) +
                        refundAmount
                    ).toFixed(2)
                );

                wallet.balance = newBalance;

                wallet.transactions.push({
                    type: "Credit",
                    amount: refundAmount,
                    description:
                        `Refund for ${quantity} returned unit(s) of ${item.productName}`,
                    referenceType: "Refund",
                    referenceId: order._id,
                    balanceAfter: newBalance,
                    transactionId,
                });

                await wallet.save({ session });
            }

            // Restore stock only after the return is completed.
            if (item.variantId) {
                const originalVariant = await Variant.findById(
                    item.variantId
                ).session(session);

                if (originalVariant) {
                    originalVariant.stock =
                        Number(originalVariant.stock || 0) + quantity;

                    await originalVariant.save({ session });
                }
            }

            item.returnedQuantity =
                Number(item.returnedQuantity || 0) + quantity;

            request.refundAmount = refundAmount;
            request.refundedAt = new Date();
            request.refundTransactionId =
                refundAmount > 0 ? transactionId : null;
            request.status = "Completed";

            order.refundAmount = Number(
                (
                    Number(order.refundAmount || 0) +
                    refundAmount
                ).toFixed(2)
            );

            order.refundedAt = new Date();

            // Only mark the whole order Returned if every unit was returned.
            const allUnitsReturned = order.items.every((orderItem) => {
                return (
                    Number(orderItem.returnedQuantity || 0) >=
                    Number(orderItem.quantity || 0)
                );
            });

            if (allUnitsReturned) {
                order.orderStatus = "Returned";

                if (
                    Number(order.refundAmount || 0) >=
                    Number(order.totalAmount || 0)
                ) {
                    order.paymentStatus = "Refunded";
                }
            }

            await order.save({ session });

            result = {
                message:
                    refundAmount > 0
                        ? `Return completed. ₹${refundAmount.toFixed(2)} credited to the customer's wallet.`
                        : "Return completed. No refund was due.",
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
