
const crypto = require("crypto");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Variant = require("../../models/Variant");

/* Get the logged-in user's ID */
const getUserId = (req) =>
    req.userId ||
    req.user?._id ||
    req.user?.id ||
    req.user?.userId;

/* Initialize Razorpay only when valid credentials are configured */
const getRazorpayClient = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error("Razorpay test credentials are not configured.");
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};

const cleanupVerifiedOrderCart = async (order) => {
    if (
        !order ||
        order.paymentStatus !== "Paid" ||
        order.isBuyNow ||
        order.cartCleanupCompleted
    ) {
        return;
    }

    // Claim cleanup so repeated verification cannot remove quantities twice.
    const claimed = await Order.findOneAndUpdate(
        {
            _id: order._id,
            paymentStatus: "Paid",
            isBuyNow: false,
            cartCleanupCompleted: { $ne: true },
        },
        { $set: { cartCleanupCompleted: true } },
        { new: true }
    );

    if (!claimed) return;

    try {
        const cart = await Cart.findOne({ userId: order.userId });
        if (!cart) return;

        const remainingToRemove = new Map();

        for (const item of order.items) {
            const id = String(item.variantId);
            remainingToRemove.set(
                id,
                (remainingToRemove.get(id) || 0) + Number(item.quantity)
            );
        }

        for (const cartItem of cart.items) {
            const id = String(cartItem.variantId);
            const remove = remainingToRemove.get(id) || 0;
            const quantityRemoved = Math.min(cartItem.quantity, remove);

            cartItem.quantity -= quantityRemoved;
            remainingToRemove.set(id, remove - quantityRemoved);
        }

        cart.items = cart.items.filter((item) => item.quantity > 0);
        await cart.save();
    } catch (error) {
        await Order.updateOne(
            { _id: order._id },
            { $set: { cartCleanupCompleted: false } }
        );
        throw error;
    }
};

/* ================= CREATE RAZORPAY ORDER ================= */

const createRazorpayOrder = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { orderId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in again.",
            });
        }

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID.",
            });
        }

        const order = await Order.findOne({
            _id: orderId,
            userId,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found.",
            });
        }

        if (order.paymentMethod !== "UPI") {
            return res.status(400).json({
                success: false,
                message: "This order is not an online payment order.",
            });
        }

        if (order.paymentStatus === "Paid") {
            return res.status(400).json({
                success: false,
                message: "This order has already been paid.",
            });
        }

        if (order.paymentStatus !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "This order cannot be paid in its current state.",
            });
        }

        const razorpay = getRazorpayClient();

        // Reuse the existing Razorpay order if payment is retried.
        if (order.razorpayOrderId) {
            if (
                order.razorpayPaymentExpiresAt &&
                order.razorpayPaymentExpiresAt <= new Date()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This payment session has expired. Please restart checkout.",
                });
            }

            const existingRazorpayOrder =
                await razorpay.orders.fetch(order.razorpayOrderId);

            return res.status(200).json({
                success: true,
                keyId: process.env.RAZORPAY_KEY_ID,
                razorpayOrder: existingRazorpayOrder,
                orderId: order._id,
                expiresAt: order.razorpayPaymentExpiresAt,
            });
        }

        const amountInPaise = Math.round(order.totalAmount * 100);

        if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid order amount.",
            });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: String(order.orderNumber).slice(0, 40),
            notes: {
                solestyleOrderId: String(order._id),
                userId: String(userId),
            },
        });

        order.razorpayOrderId = razorpayOrder.id;
        order.razorpayPaymentExpiresAt = new Date(
            Date.now() + 0.5 * 60 * 1000
        );

        await order.save();

        return res.status(201).json({
            success: true,
            keyId: process.env.RAZORPAY_KEY_ID,
            razorpayOrder,
            orderId: order._id,
            expiresAt: order.razorpayPaymentExpiresAt,
        });
    } catch (error) {
        console.error("Create Razorpay order error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ===
                    "Razorpay test credentials are not configured."
                    ? error.message
                    : "Unable to start online payment.",
        });
    }
};

/* ================= VERIFY RAZORPAY PAYMENT ================= */

const verifyRazorpayPayment = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { orderId } = req.params;

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in again.",
            });
        }

        if (
            !mongoose.isValidObjectId(orderId) ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Required payment details are missing.",
            });
        }

        const order = await Order.findOne({
            _id: orderId,
            userId,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found.",
            });
        }

        if (order.paymentMethod !== "UPI") {
            return res.status(400).json({
                success: false,
                message: "This is not an online payment order.",
            });
        }
        if (order.razorpayReservationsReleased) {
            return res.status(400).json({
                success: false,
                message:
                    "This order's stock reservation has been released. Please contact support if your payment was charged.",
            });
        }

        // Make repeated verification requests safe.
        if (
            order.paymentStatus === "Paid" &&
            order.razorpayPaymentId === razorpay_payment_id
        ) {
            return res.status(200).json({
                success: true,
                message: "Payment has already been verified.",
                order,
            });
        }

        if (order.paymentStatus !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "This order cannot be verified.",
            });
        }

        // Never trust an order ID supplied only by the browser.
        if (
            !order.razorpayOrderId ||
            order.razorpayOrderId !== razorpay_order_id
        ) {
            return res.status(400).json({
                success: false,
                message: "Razorpay order ID does not match.",
            });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keySecret) {
            return res.status(500).json({
                success: false,
                message: "Razorpay credentials are not configured.",
            });
        }

        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
            .digest("hex");

        const receivedBuffer = Buffer.from(razorpay_signature, "hex");
        const expectedBuffer = Buffer.from(expectedSignature, "hex");

        const signatureIsValid =
            receivedBuffer.length === expectedBuffer.length &&
            crypto.timingSafeEqual(receivedBuffer, expectedBuffer);

        if (!signatureIsValid) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed.",
            });
        }

        // Confirm the payment directly with Razorpay.
        const razorpay = getRazorpayClient();

        const payment = await razorpay.payments.fetch(
            razorpay_payment_id
        );

        const expectedAmount = Math.round(order.totalAmount * 100);

        if (
            payment.order_id !== order.razorpayOrderId ||
            payment.amount !== expectedAmount ||
            payment.currency !== "INR" ||
            payment.status !== "captured"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment is not captured or the payment details do not match.",
            });
        }

        // Atomically mark the order as paid.
        // Only one payment-verification request can change Pending to Paid.
        const updatedOrder = await Order.findOneAndUpdate(
            {
                _id: order._id,
                userId,
                paymentMethod: "UPI",
                paymentStatus: "Pending",
                razorpayOrderId: razorpay_order_id,
                razorpayReservationsReleased: { $ne: true },
            },
            {
                $set: {
                    razorpayPaymentId: razorpay_payment_id,
                    paymentReference: razorpay_payment_id,
                    paymentStatus: "Paid",
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedOrder) {
            // Another request may already have verified this same payment.
            const latestOrder = await Order.findOne({
                _id: order._id,
                userId,
            });

            if (
                latestOrder?.paymentStatus === "Paid" &&
                latestOrder?.razorpayPaymentId === razorpay_payment_id
            ) {
                return res.status(200).json({
                    success: true,
                    message: "Payment has already been verified.",
                    order: latestOrder,
                });
            }

            return res.status(409).json({
                success: false,
                message:
                    "The order changed while verifying payment. Please refresh your orders.",
            });
        }

        await cleanupVerifiedOrderCart(updatedOrder);

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully.",
            order: updatedOrder,
        });
    } catch (error) {
        console.error("Verify Razorpay payment error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify online payment.",
        });
    }
};

const expireUpiOrder = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const userId = getUserId(req);
        const { orderId } = req.params;

        const order = await Order.findOne({
            _id: orderId,
            userId,
            paymentMethod: "UPI",
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        if (order.paymentStatus === "Paid") {
            return res.status(400).json({
                message: "Payment succeeded. Stock will not be restored.",
            });
        }

        if (order.razorpayReservationsReleased) {
            return res.json({ message: "Stock was already restored." });
        }

        if (
            !order.razorpayPaymentExpiresAt ||
            new Date(order.razorpayPaymentExpiresAt) > new Date()
        ) {
            return res.status(400).json({
                message: "Payment session has not expired yet.",
            });
        }

        // Check Razorpay before restoring stock.
        if (order.razorpayOrderId) {
            const razorpay = getRazorpayClient();
            const result = await razorpay.orders.fetchPayments(
                order.razorpayOrderId
            );

            const payments = result.items || [];
            const unsettledPayment = payments.some((payment) =>
                ["authorized", "captured"].includes(payment.status)
            );

            if (unsettledPayment) {
                return res.status(409).json({
                    message:
                        "A payment may have succeeded. Verify its status before releasing stock.",
                });
            }
        }

        await session.withTransaction(async () => {
            const currentOrder = await Order.findOne({
                _id: orderId,
                userId,
                paymentMethod: "UPI",
                paymentStatus: "Pending",
                razorpayReservationsReleased: { $ne: true },
                razorpayPaymentExpiresAt: { $lte: new Date() },
            }).session(session);

            if (!currentOrder) return;

            for (const item of currentOrder.items) {
                const quantityToRestore = Math.max(
                    0,
                    Number(item.quantity) - Number(item.cancelledQuantity || 0)
                );

                if (quantityToRestore > 0) {
                    await Variant.updateOne(
                        { _id: item.variantId },
                        { $inc: { stock: quantityToRestore } },
                        { session }
                    );
                }
            }

            currentOrder.paymentStatus = "Failed";
            currentOrder.orderStatus = "Cancelled";
            currentOrder.razorpayReservationsReleased = true;

            await currentOrder.save({ session });
        });

        return res.json({
            message: "Expired order processed. Any remaining reserved stock was restored.",
        });
    } catch (error) {
        console.error("UPI expiry error:", error);
        return res.status(500).json({
            message: "Unable to process expired payment.",
        });
    } finally {
        await session.endSession();
    }
};

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment,
    expireUpiOrder,
};
