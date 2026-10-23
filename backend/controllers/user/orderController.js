
const mongoose = require("mongoose");
const Order = require("../../models/Order");
const Address = require("../../models/Address");
const Cart = require("../../models/Cart");
const Variant = require("../../models/Variant");
const Coupon = require("../../models/Coupon");
const Wallet = require("../../models/Wallet");
const Product = require("../../models/Product");

const { getCart } = require("../../services/user/cartService");
const {
    getVariantPricing,
} = require("../../services/user/offerPricingService");

// ================= CREATE ORDER =================

const createOrder = async (req, res) => {
    let reservedCouponId = null;
    let orderCreated = false;
    let walletDebited = false;
    let walletDebitTransactionId = null;
    let walletBalanceAfterDebit = null;
    let totalAmount = 0;

    // Track stock deducted during checkout so it can be restored
    // if order creation fails.
    const reservedStock = [];

    try {
        const {
            addressId,
            paymentMethod,
            couponCode,
            buyNowVariantId,
        } = req.body;

        // Validate delivery address ID.
        if (!mongoose.isValidObjectId(addressId)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid delivery address",
            });
        }

        // Validate payment method.
        if (!["COD", "UPI", "WALLET"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method",
            });
        }

        // Ensure the address belongs to the logged-in customer.
        const address = await Address.findOne({
            _id: addressId,
            userId: req.userId,
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Delivery address not found",
            });
        }

        // ================= BUY NOW OR CART CHECKOUT =================

        let checkoutItems = [];
        const isBuyNow = Boolean(buyNowVariantId);

        if (isBuyNow) {
            // Validate the selected variant ID.
            if (!mongoose.isValidObjectId(buyNowVariantId)) {
                return res.status(400).json({
                    success: false,
                    message: "Please select a valid product variant",
                });
            }

            // Find an active variant with available stock.
            const variant = await Variant.findOne({
                _id: buyNowVariantId,
                isActive: true,
                stock: { $gt: 0 },
            });

            if (!variant) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This product variant is unavailable or out of stock",
                });
            }

            // Verify that the associated product is active.
            const product = await Product.findOne({
                _id: variant.productId,
                isActive: true,
            });

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "This product is unavailable",
                });
            }

            // Buy Now always orders one unit of the selected variant.
            // The customer's cart remains unchanged.
            checkoutItems = [
                {
                    variantId: variant._id,
                    product,
                    color: variant.color,
                    size: variant.size,
                    image: variant.mainImage || "",
                    quantity: 1,
                },
            ];
        } else {
            // Normal checkout uses the existing cart.
            const cart = await getCart(req.userId);

            if (!cart || !cart.items || cart.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Your cart is empty",
                });
            }

            checkoutItems = cart.items;
        }

        // ================= VALIDATE ITEMS AND PRICES =================

        const orderItems = [];
        let subtotal = 0;

        for (const item of checkoutItems) {
            if (
                !item.variantId ||
                !mongoose.isValidObjectId(item.variantId) ||
                !item.product ||
                !Number.isInteger(Number(item.quantity)) ||
                Number(item.quantity) < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Your cart contains an invalid item",
                });
            }

            // Recheck the variant and its stock before creating the order.
            const variant = await Variant.findOne({
                _id: item.variantId,
                isActive: true,
            });

            if (!variant || variant.stock < Number(item.quantity)) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${item.product.name}`,
                });
            }

            // Calculate the current effective price on the server.
            const pricing = await getVariantPricing(
                variant,
                item.product
            );

            const price = Number(pricing.price);
            const originalPrice = Number(pricing.originalPrice);
            const offerDiscount = Number(pricing.offerDiscount);

            if (
                !Number.isFinite(price) ||
                price < 0 ||
                !Number.isFinite(originalPrice) ||
                originalPrice < 0 ||
                !Number.isFinite(offerDiscount) ||
                offerDiscount < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product price",
                });
            }

            orderItems.push({
                productId: item.product._id,
                variantId: variant._id,
                productName: item.product.name,
                color: item.color || variant.color || "",
                size: item.size || variant.size || "",
                image: item.image || variant.mainImage || "",
                price,
                originalPrice,
                offerDiscount,
                quantity: Number(item.quantity),
            });

            subtotal += price * Number(item.quantity);
        }

        subtotal = Math.round(subtotal * 100) / 100;

        const shippingFee = 0;
        let discount = 0;
        let validatedCouponCode = null;

        // ================= VALIDATE AND RESERVE COUPON =================

        if (couponCode && String(couponCode).trim()) {
            const normalizedCode = String(couponCode)
                .trim()
                .toUpperCase();

            const now = new Date();

            const coupon = await Coupon.findOne({
                code: normalizedCode,
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now },
                $or: [
                    { usageLimit: null },
                    {
                        $expr: {
                            $lt: ["$usedCount", "$usageLimit"],
                        },
                    },
                ],
            }).lean();

            if (!coupon) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This coupon is invalid, expired, or has reached its usage limit.",
                });
            }

            if (subtotal < Number(coupon.minOrderAmount || 0)) {
                return res.status(400).json({
                    success: false,
                    message: `This coupon requires a minimum order amount of ₹${Number(
                        coupon.minOrderAmount || 0
                    ).toFixed(2)}.`,
                });
            }

            if (coupon.discountType === "Percentage") {
                discount =
                    (subtotal * Number(coupon.discountValue)) / 100;

                if (coupon.maxDiscount != null) {
                    discount = Math.min(
                        discount,
                        Number(coupon.maxDiscount)
                    );
                }
            } else if (coupon.discountType === "Fixed") {
                discount = Number(coupon.discountValue);
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid coupon discount type.",
                });
            }

            discount =
                Math.round(
                    Math.min(subtotal, Math.max(0, discount)) * 100
                ) / 100;

            // Atomically reserve one use of this coupon.
            const reservedCoupon = await Coupon.findOneAndUpdate(
                {
                    _id: coupon._id,
                    isActive: true,
                    startDate: { $lte: now },
                    endDate: { $gte: now },
                    $or: [
                        { usageLimit: null },
                        {
                            $expr: {
                                $lt: ["$usedCount", "$usageLimit"],
                            },
                        },
                    ],
                },
                {
                    $inc: { usedCount: 1 },
                },
                { new: true }
            );

            if (!reservedCoupon) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This coupon has just become unavailable. Please try another coupon.",
                });
            }

            reservedCouponId = reservedCoupon._id;
            validatedCouponCode = reservedCoupon.code;
        }

        // Calculate the final payable amount.
        totalAmount = Math.max(
            0,
            Math.round(
                (subtotal - discount + shippingFee) * 100
            ) / 100
        );

        // ================= WALLET PAYMENT =================

        if (paymentMethod === "WALLET") {
            walletDebitTransactionId =
                `WALLET-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 10)}`;

            const wallet = await Wallet.findOne({
                userId: req.userId,
                balance: { $gte: totalAmount },
            });

            if (!wallet) {
                walletDebitTransactionId = null;

                if (reservedCouponId) {
                    await Coupon.updateOne(
                        {
                            _id: reservedCouponId,
                            usedCount: { $gt: 0 },
                        },
                        {
                            $inc: { usedCount: -1 },
                        }
                    );

                    reservedCouponId = null;
                }

                const existingWallet = await Wallet.findOne({
                    userId: req.userId,
                }).select("balance");

                return res.status(400).json({
                    success: false,
                    message: existingWallet
                        ? `Insufficient wallet balance. Available: ₹${Number(
                            existingWallet.balance
                        ).toFixed(2)}. Required: ₹${totalAmount.toFixed(2)}.`
                        : "Wallet not found. Please contact support.",
                });
            }

            const balanceBefore = Number(wallet.balance || 0);
            const balanceAfter = Number(
                (balanceBefore - totalAmount).toFixed(2)
            );

            // Deduct funds only if the current balance is still sufficient.
            const updatedWallet = await Wallet.findOneAndUpdate(
                {
                    _id: wallet._id,
                    balance: { $gte: totalAmount },
                },
                {
                    $inc: { balance: -totalAmount },
                    $push: {
                        transactions: {
                            type: "Debit",
                            amount: totalAmount,
                            description: "Payment for SOLESTYLE order",
                            referenceType: "Order",
                            referenceId: null,
                            balanceAfter,
                            transactionId: walletDebitTransactionId,
                        },
                    },
                },
                { returnDocument: "after" }
            );

            if (!updatedWallet) {
                walletDebitTransactionId = null;

                if (reservedCouponId) {
                    await Coupon.updateOne(
                        {
                            _id: reservedCouponId,
                            usedCount: { $gt: 0 },
                        },
                        {
                            $inc: { usedCount: -1 },
                        }
                    );

                    reservedCouponId = null;
                }

                const latestWallet = await Wallet.findOne({
                    userId: req.userId,
                }).select("balance");

                return res.status(400).json({
                    success: false,
                    message: latestWallet
                        ? `Insufficient wallet balance. Available: ₹${Number(
                            latestWallet.balance
                        ).toFixed(2)}. Required: ₹${totalAmount.toFixed(2)}.`
                        : "Wallet not found. Please contact support.",
                });
            }

            walletDebited = true;
            walletBalanceAfterDebit = Number(updatedWallet.balance);
        }


        // ================= RESERVE PRODUCT STOCK =================

        // Deduct stock atomically to prevent overselling.
        for (const item of orderItems) {
            const quantity = Number(item.quantity);

            const updatedVariant = await Variant.findOneAndUpdate(
                {
                    _id: item.variantId,
                    isActive: true,
                    stock: { $gte: quantity },
                },
                {
                    $inc: { stock: -quantity },
                },
                {
                    new: true,
                }
            );




            if (!updatedVariant) {
                const stockError = new Error(
                    `Insufficient stock for ${item.productName}. Please refresh and try again.`
                );
                stockError.statusCode = 400;
                throw stockError;
            }

            // Record each deduction for rollback if checkout fails.
            reservedStock.push({
                variantId: item.variantId,
                quantity,
            });
        }


        // ================= CREATE ORDER =================

        const order = await Order.create({
            orderNumber: `SS-${Date.now()}-${Math.floor(
                1000 + Math.random() * 9000
            )}`,
            userId: req.userId,
            items: orderItems,
            shippingAddress: {
                fullName: address.fullName,
                phone: address.phone,
                addressLine: address.addressLine,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                addressType: address.addressType,
            },
            subtotal,
            discount,
            shippingFee,
            totalAmount,
            couponCode: validatedCouponCode,
            paymentMethod,
            paymentStatus:
                paymentMethod === "WALLET" ? "Paid" : "Pending",

            // UPI payment window: 15 minutes from order creation.
            razorpayPaymentExpiresAt:
                paymentMethod === "UPI"
                    ? new Date(Date.now() + 15 * 60 * 1000)
                    : null,

            orderStatus: "Placed",
        });

        orderCreated = true;

        // Link the wallet transaction to the new order.
        if (
            paymentMethod === "WALLET" &&
            walletDebitTransactionId
        ) {
            try {
                await Wallet.updateOne(
                    {
                        userId: req.userId,
                        "transactions.transactionId":
                            walletDebitTransactionId,
                    },
                    {
                        $set: {
                            "transactions.$.referenceId": order._id,
                        },
                    }
                );
            } catch (transactionError) {
                console.error(
                    "Failed to link wallet transaction to order:",
                    transactionError
                );
            }
        }

        // Clear the cart immediately only for COD and Wallet.
        // For UPI, keep it until Razorpay payment is verified.
        if (!isBuyNow && paymentMethod !== "UPI") {
            try {
                const userCart = await Cart.findOne({
                    userId: req.userId,
                });

                if (userCart) {
                    userCart.items = [];
                    await userCart.save();
                }
            } catch (cartError) {
                console.error(
                    "Order created, but cart cleanup failed:",
                    cartError
                );
            }
        }

        // Return success for both checkout methods.
        return res.status(201).json({
            success: true,
            message:
                paymentMethod === "COD"
                    ? "Order placed successfully"
                    : paymentMethod === "WALLET"
                        ? "Order placed and paid using your wallet"
                        : "Order created. UPI payment is pending.",
            order,
            ...(paymentMethod === "WALLET" && {
                wallet: {
                    balance: walletBalanceAfterDebit,
                },
            }),
        });
    } catch (error) {
        console.error("Create order error:", error);


        // Restore stock if checkout failed before the order was created.
        if (!orderCreated && reservedStock.length > 0) {
            for (const reserved of reservedStock) {
                try {
                    await Variant.updateOne(
                        { _id: reserved.variantId },
                        { $inc: { stock: reserved.quantity } }
                    );
                } catch (stockError) {
                    console.error(
                        "CRITICAL: Failed to restore reserved stock:",
                        stockError
                    );
                }
            }
        }


        // Restore wallet funds if order creation failed after debit.
        if (walletDebited && !orderCreated) {
            try {
                const rollbackTransactionId =
                    `ROLLBACK-${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2, 10)}`;

                const wallet = await Wallet.findOneAndUpdate(
                    {
                        userId: req.userId,
                        transactions: {
                            $elemMatch: {
                                transactionId: walletDebitTransactionId,
                                type: "Debit",
                            },
                        },
                    },
                    {
                        $inc: { balance: totalAmount },
                        $push: {
                            transactions: {
                                type: "Credit",
                                amount: totalAmount,
                                description:
                                    "Refund for unsuccessful order creation",
                                referenceType: "Adjustment",
                                referenceId: null,
                                balanceAfter: 0,
                                transactionId: rollbackTransactionId,
                            },
                        },
                    },
                    { new: true }
                );

                if (!wallet) {
                    console.error(
                        "CRITICAL: Wallet rollback could not find the original debit."
                    );
                } else {
                    const rollbackTransaction =
                        wallet.transactions.find(
                            (transaction) =>
                                transaction.transactionId ===
                                rollbackTransactionId
                        );

                    if (rollbackTransaction) {
                        rollbackTransaction.balanceAfter =
                            wallet.balance;

                        await wallet.save();
                    }
                }
            } catch (refundError) {
                console.error(
                    "CRITICAL: Failed to restore wallet funds:",
                    refundError
                );
            }
        }

        // Release reserved coupon usage if no order was created.
        if (reservedCouponId && !orderCreated) {
            try {
                await Coupon.updateOne(
                    {
                        _id: reservedCouponId,
                        usedCount: { $gt: 0 },
                    },
                    {
                        $inc: { usedCount: -1 },
                    }
                );
            } catch (couponError) {
                console.error(
                    "Failed to release coupon reservation:",
                    couponError
                );
            }
        }

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Failed to place order",
        });
    }
};

// ================= GET CUSTOMER ORDERS =================

const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            userId: req.userId,
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        console.error("Get orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
        });
    }
};

// ================= RETURN / EXCHANGE REQUEST =================



const requestReturnExchange = async (req, res) => {
    try {
        const {
            orderId,
            itemIndex,
            type,
            reason,
            replacementVariantId,
            quantity = 1,
        } = req.body;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        const index = Number(itemIndex);
        const requestedQuantity = Number(quantity);

        if (
            !Number.isInteger(index) ||
            index < 0 ||
            !Number.isInteger(requestedQuantity) ||
            requestedQuantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Select a valid item and quantity",
            });
        }

        if (!["Return", "Exchange"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid request type",
            });
        }

        if (typeof reason !== "string" || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a reason",
            });
        }

        const order = await Order.findOne({
            _id: orderId,
            userId: req.userId,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (index >= order.items.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid order item",
            });
        }

        if (
            order.orderStatus !== "Delivered" ||
            !order.deliveredAt
        ) {
            return res.status(400).json({
                success: false,
                message: "Returns and exchanges are available after delivery",
            });
        }

        const deadlineDays = type === "Return" ? 7 : 10;
        const deadline = new Date(order.deliveredAt);
        deadline.setDate(deadline.getDate() + deadlineDays);

        if (new Date() > deadline) {
            return res.status(400).json({
                success: false,
                message:
                    type === "Return"
                        ? "The 7-day return window has expired"
                        : "The 10-day exchange window has expired",
            });
        }

        const item = order.items[index];

        // Prevent mixing legacy requests with the new quantity workflow.
        if (
            item.returnExchange &&
            item.returnExchange.status !== "Not Requested"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This item has an older return/exchange request. Please resolve it first.",
            });
        }

        const completedQuantity =
            Number(item.cancelledQuantity || 0) +
            Number(item.returnedQuantity || 0) +
            Number(item.exchangedQuantity || 0);

        const pendingQuantity = (
            item.itemActionRequests || []
        )
            .filter(
                (request) =>
                    !["Rejected", "Completed"].includes(request.status)
            )
            .reduce(
                (total, request) =>
                    total + Number(request.quantity || 0),
                0
            );

        const availableQuantity = Math.max(
            0,
            Number(item.quantity) -
            completedQuantity -
            pendingQuantity
        );

        if (requestedQuantity > availableQuantity) {
            return res.status(400).json({
                success: false,
                message:
                    `Only ${availableQuantity} unit(s) are available for a new request`,
            });
        }

        let replacement = null;

        if (type === "Exchange") {
            if (!mongoose.isValidObjectId(replacementVariantId)) {
                return res.status(400).json({
                    success: false,
                    message: "Please select a replacement variant",
                });
            }

            // The original variant is allowed too. This supports
            // replacing a damaged shoe with the same color and size.
            replacement = await Variant.findOne({
                _id: replacementVariantId,
                productId: item.productId,
                isActive: true,
                stock: { $gte: requestedQuantity },
            });

            if (!replacement) {
                return res.status(400).json({
                    success: false,
                    message:
                        "The selected replacement is unavailable or has insufficient stock",
                });
            }

            const product = await Product.findOne({
                _id: item.productId,
                isActive: true,
            });

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "This product is no longer available",
                });
            }

            // Only a different variant needs price comparison.
            // Same-variant replacement does not require a new selection.
            if (
                String(replacement._id) !== String(item.variantId)
            ) {
                const pricing = await getVariantPricing(
                    replacement,
                    product
                );

                const replacementPrice = Number(
                    Number(pricing.price).toFixed(2)
                );

                const originalPrice = Number(
                    Number(item.price).toFixed(2)
                );

                if (replacementPrice !== originalPrice) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "This replacement has a different price. Please return the item and place a new order instead.",
                    });
                }
            }
        }

        item.itemActionRequests.push({
            type,
            quantity: requestedQuantity,
            reason: reason.trim(),
            status: "Requested",
            requestedAt: new Date(),
            replacementVariantId:
                type === "Exchange" ? replacement._id : null,
            replacementColor:
                type === "Exchange" ? replacement.color : "",
            replacementSize:
                type === "Exchange" ? replacement.size : null,
        });

        await order.save();

        const savedRequest =
            item.itemActionRequests[
            item.itemActionRequests.length - 1
            ];

        return res.status(201).json({
            success: true,
            message:
                `${type} request submitted for ${requestedQuantity} unit(s)`,
            request: savedRequest,
        });
    } catch (error) {
        console.error("Request return/exchange error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit return/exchange request",
        });
    }
};


// ================= CANCEL ORDER =================
const cancelOrder = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { orderId, itemIndex } = req.body;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        const index = Number(itemIndex);

        if (!Number.isInteger(index) || index < 0) {
            return res.status(400).json({
                success: false,
                message: "Select a valid product",
            });
        }

        let responseData;

        await session.withTransaction(async () => {
            // Always read the latest order inside the transaction.
            const order = await Order.findOne({
                _id: orderId,
                userId: req.userId,
            }).session(session);

            if (!order) {
                const error = new Error("Order not found");
                error.statusCode = 404;
                throw error;
            }

            if (!["Placed", "Confirmed"].includes(order.orderStatus)) {
                const error = new Error(
                    "Products can only be cancelled before shipping"
                );
                error.statusCode = 400;
                throw error;
            }

            if (index >= order.items.length) {
                const error = new Error("Invalid order product");
                error.statusCode = 400;
                throw error;
            }

            const item = order.items[index];



            // Do not allow cancellation when an older return/exchange
            // request for this product is still active.
            const oldRequestStatus = item.returnExchange?.status;

            if (
                oldRequestStatus &&
                oldRequestStatus !== "Not Requested" &&
                oldRequestStatus !== "Rejected"
            ) {
                const error = new Error(
                    "This product already has a return/exchange request"
                );
                error.statusCode = 400;
                throw error;
            }

            const alreadyCancelled = Number(item.cancelledQuantity || 0);
            const alreadyReturned = Number(item.returnedQuantity || 0);
            const alreadyExchanged = Number(item.exchangedQuantity || 0);

            // Count quantities reserved by requests that are still active.
            const pendingActionQuantity = (
                item.itemActionRequests || []
            )
                .filter((request) =>
                    !["Rejected", "Completed"].includes(request.status)
                )
                .reduce(
                    (total, request) =>
                        total + Number(request.quantity || 0),
                    0
                );

            // Cancel every remaining available unit on this product line.
            const cancelQuantity = Math.max(
                0,
                Number(item.quantity || 0) -
                alreadyCancelled -
                alreadyReturned -
                alreadyExchanged -
                pendingActionQuantity
            );

            if (cancelQuantity <= 0) {
                const error = new Error(
                    "This product has no remaining quantity available to cancel"
                );
                error.statusCode = 400;
                throw error;
            }

            const variant = await Variant.findById(item.variantId)
                .session(session);

            if (!variant) {
                const error = new Error("Product variant not found");
                error.statusCode = 400;
                throw error;
            }

            const unitPrice = Number(item.price || 0);
            const grossAmount = unitPrice * cancelQuantity;

            // Allocate the order-level discount proportionally.
            // This assumes order.discount contains the order-level
            // discount, while item.price already reflects product offers.
            const orderDiscount = Number(order.discount || 0);
            const orderSubtotal = Number(order.subtotal || 0);

            const discountShare =
                orderSubtotal > 0
                    ? orderDiscount * (grossAmount / orderSubtotal)
                    : 0;

            const refundAmount = Math.max(
                0,
                Math.round((grossAmount - discountShare) * 100) / 100
            );

            const isPaid = order.paymentStatus === "Paid";

            const transactionId =
                `CANCEL-${order._id}-${index}-${alreadyCancelled + cancelQuantity}`;

            // Restore stock and update cancellation quantity within
            // the same transaction.
            variant.stock =
                Number(variant.stock || 0) + cancelQuantity;

            await variant.save({ session });

            item.cancelledQuantity =
                alreadyCancelled + cancelQuantity;

            // Refund only payments that have actually been received.
            if (isPaid && refundAmount > 0) {
                let wallet = await Wallet.findOne({
                    userId: req.userId,
                }).session(session);

                if (!wallet) {
                    wallet = new Wallet({
                        userId: req.userId,
                        balance: 0,
                        transactions: [],
                    });
                }

                // Extra protection against crediting the same refund twice.
                const refundAlreadyExists = (
                    wallet.transactions || []
                ).some(
                    (transaction) =>
                        transaction.transactionId === transactionId
                );

                if (refundAlreadyExists) {
                    const error = new Error(
                        "This cancellation refund has already been processed"
                    );
                    error.statusCode = 409;
                    throw error;
                }

                const newBalance = Number(
                    (
                        Number(wallet.balance || 0) + refundAmount
                    ).toFixed(2)
                );

                wallet.balance = newBalance;

                wallet.transactions.push({
                    type: "Credit",
                    amount: refundAmount,
                    description:
                        `Refund for cancelled ${item.productName} ` +
                        `in order ${order.orderNumber}`,
                    referenceType: "Refund",
                    referenceId: order._id,
                    balanceAfter: newBalance,
                    transactionId,
                });

                await wallet.save({ session });

                order.refundAmount = Math.round(
                    (
                        Number(order.refundAmount || 0) +
                        refundAmount
                    ) * 100
                ) / 100;

                order.refundedAt = new Date();
            }

            // Cancel the entire order only when all originally ordered
            // units have been cancelled.
            const totalCancelled = order.items.reduce(
                (total, currentItem) =>
                    total +
                    Number(currentItem.cancelledQuantity || 0),
                0
            );

            const totalOrdered = order.items.reduce(
                (total, currentItem) =>
                    total + Number(currentItem.quantity || 0),
                0
            );

            if (totalCancelled >= totalOrdered) {
                order.orderStatus = "Cancelled";

                if (isPaid) {
                    order.paymentStatus = "Refunded";
                }
            }

            await order.save({ session });

            responseData = {
                success: true,
                message: isPaid
                    ? `${item.productName} cancelled. Refund of ₹${refundAmount.toFixed(2)} credited to your wallet.`
                    : `${item.productName} cancelled successfully.`,
                order,
                cancelledQuantity: cancelQuantity,
                refundAmount: isPaid ? refundAmount : 0,
            };
        });

        return res.status(200).json(responseData);
    } catch (error) {
        console.error("Cancel product error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.statusCode
                    ? error.message
                    : "Failed to cancel product",
        });
    } finally {
        await session.endSession();
    }
};


module.exports = {
    createOrder,
    getMyOrders,
    requestReturnExchange,
    cancelOrder,
};
