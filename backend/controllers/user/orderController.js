
const mongoose = require("mongoose");
const Order = require("../../models/Order");
const Address = require("../../models/Address");
const Cart = require("../../models/Cart");
const Variant = require("../../models/Variant");
const Coupon = require("../../models/Coupon");
const { getCart } = require("../../services/user/cartService");
const {
    getVariantPricing,
} = require("../../services/user/offerPricingService");

const Wallet = require("../../models/Wallet");
const Product = require("../../models/Product");

const createOrder = async (req, res) => {
    let reservedCouponId = null;
    let orderCreated = false;
    let walletDebited = false;
    let walletDebitTransactionId = null;
    let walletBalanceAfterDebit = null;
    let totalAmount = 0;

    try {
        const { addressId, paymentMethod, couponCode } = req.body;

        if (!mongoose.isValidObjectId(addressId)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid delivery address",
            });
        }

        if (!["COD", "UPI", "WALLET"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method",
            });
        }

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

        const cart = await getCart(req.userId);

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty",
            });
        }

        const orderItems = [];
        let subtotal = 0;

        // Validate cart items and calculate current offer prices.
        for (const item of cart.items) {
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

            const variant = await Variant.findOne({
                _id: item.variantId,
                isActive: true,
            });

            if (
                !variant ||
                variant.stock < Number(item.quantity)
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${item.product.name
                        }`,
                });
            }

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

        // Validate and reserve coupon usage.
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

        totalAmount = Math.max(
            0,
            Math.round(
                (subtotal - discount + shippingFee) * 100
            ) / 100
        );

        // Wallet payment: deduct funds atomically so concurrent
        // requests cannot spend more than the available balance.
        // Wallet payment: deduct the balance and record the debit
        // in one atomic MongoDB update.

        if (paymentMethod === "WALLET") {
            walletDebitTransactionId =
                `WALLET-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 10)}`;

            // Atomically deduct the balance only when sufficient funds exist.
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
                        { $inc: { usedCount: -1 } }
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

            // Conditional update prevents spending funds that have already
            // been used by another concurrent checkout.
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
                        { $inc: { usedCount: -1 } }
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
            orderStatus: "Placed",
        });

        orderCreated = true;

        // Link the wallet transaction to its created order.
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
                // Do not undo an already-created, paid order.
                console.error(
                    "Failed to link wallet transaction to order:",
                    transactionError
                );
            }
        }

        // Clear the cart after the order is created.
        try {
            const userCart = await Cart.findOne({
                userId: req.userId,
            });

            if (userCart) {
                userCart.items = [];
                await userCart.save();
            }
        } catch (cartError) {
            // The order already exists. Avoid reporting that the
            // payment failed merely because cart cleanup failed.
            console.error(
                "Order created, but cart cleanup failed:",
                cartError
            );
        }

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

        // Restore wallet funds only if the order was not created.
        if (walletDebited && !orderCreated) {
            try {
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
                                // Corrected below using the resulting balance.
                                balanceAfter: 0,
                                transactionId:
                                    `ROLLBACK-${Date.now()}-${Math.random()
                                        .toString(36)
                                        .slice(2, 10)}`,
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
                    // Update the rollback transaction with the resulting balance.
                    const rollbackTransaction =
                        wallet.transactions[wallet.transactions.length - 1];

                    if (rollbackTransaction) {
                        rollbackTransaction.balanceAfter = wallet.balance;
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

        // Release coupon reservation if order creation failed.
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

        return res.status(500).json({
            success: false,
            message: "Failed to place order",
        });
    }
};

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

const requestReturnExchange = async (req, res) => {
    try {
        const {
            orderId,
            itemIndex,
            type,
            reason,
            replacementVariantId,
        } = req.body;

        // Validate order ID.
        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        // Validate order item index.
        if (
            !Number.isInteger(itemIndex) ||
            itemIndex < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order item",
            });
        }

        // Validate request type.
        if (!["Return", "Exchange"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Select Return or Exchange",
            });
        }

        // Validate reason.
        if (
            typeof reason !== "string" ||
            !reason.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a reason",
            });
        }

        // Find the order belonging to the logged-in customer.
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

        // Only delivered orders can be returned or exchanged.
        if (order.orderStatus !== "Delivered") {
            return res.status(400).json({
                success: false,
                message:
                    "Return or exchange is available only for delivered orders",
            });
        }

        if (!order.deliveredAt) {
            return res.status(400).json({
                success: false,
                message:
                    "Delivery date is unavailable for this order. Please contact support.",
            });
        }

        // Return window: 7 days.
        // Exchange window: 10 days.
        const allowedDays = type === "Return" ? 7 : 10;

        const deliveryDate = new Date(order.deliveredAt);
        deliveryDate.setHours(0, 0, 0, 0);

        const deadline = new Date(deliveryDate);
        deadline.setDate(
            deadline.getDate() + allowedDays
        );
        deadline.setHours(23, 59, 59, 999);

        if (new Date() > deadline) {
            return res.status(400).json({
                success: false,
                message: `${type} window has expired. ${type} requests must be made within ${allowedDays} days of delivery.`,
            });
        }

        // Get the selected item from the order.
        const item = order.items[itemIndex];

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Order item not found",
            });
        }

        // Prevent another request for the same item.
        if (
            item.returnExchange &&
            item.returnExchange.status !== "Not Requested"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "A return or exchange request already exists for this item",
            });
        }

        let replacementVariant = null;
        let replacementPrice = null;

        // ================= EXCHANGE VALIDATION =================

        if (type === "Exchange") {
            // A replacement variant is required.
            if (
                !replacementVariantId ||
                !mongoose.isValidObjectId(
                    replacementVariantId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please select a valid replacement size and color.",
                });
            }

            // Replacement must belong to the original product,
            // be active, and have stock available.
            replacementVariant = await Variant.findOne({
                _id: replacementVariantId,
                productId: item.productId,
                isActive: true,
                stock: { $gt: 0 },
            });

            if (!replacementVariant) {
                return res.status(400).json({
                    success: false,
                    message:
                        "The selected replacement is unavailable. Please choose another size or color.",
                });
            }

            // Do not allow the customer to exchange for the
            // exact same variant.
            if (
                String(replacementVariant._id) ===
                String(item.variantId)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please select a different size or color for your exchange.",
                });
            }

            // Fetch the original product to calculate the
            // replacement's effective price using the same
            // offer-pricing logic used during checkout.
            const product = await Product.findById(
                item.productId
            );

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message:
                        "The original product could not be found. Please contact support.",
                });
            }

            const replacementPricing =
                await getVariantPricing(
                    replacementVariant,
                    product
                );

            replacementPrice = Number(
                replacementPricing.price
            );

            // item.price is the effective per-item price
            // saved when the original order was placed.
            const originalItemPrice = Number(item.price);

            if (
                !Number.isFinite(originalItemPrice) ||
                !Number.isFinite(replacementPrice) ||
                originalItemPrice < 0 ||
                replacementPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Unable to verify the replacement price. Please try again or contact support.",
                });
            }

            // Compare prices to the nearest paise.
            const originalPriceInPaise = Math.round(
                originalItemPrice * 100
            );

            const replacementPriceInPaise = Math.round(
                replacementPrice * 100
            );

            if (
                originalPriceInPaise !==
                replacementPriceInPaise
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "The selected replacement has a different price from your original purchase. Please return this item and place a new order for your preferred size or color.",
                });
            }
        }

        // ================= SAVE REQUEST =================

        item.returnExchange = {
            type,
            reason: reason.trim(),
            status: "Requested",
            requestedAt: new Date(),

            replacementVariantId:
                type === "Exchange"
                    ? replacementVariant._id
                    : null,

            replacementColor:
                type === "Exchange"
                    ? replacementVariant.color
                    : "",

            replacementSize:
                type === "Exchange"
                    ? replacementVariant.size
                    : null,
        };

        await order.save();

        return res.status(200).json({
            success: true,
            message:
                type === "Exchange"
                    ? "Exchange request submitted successfully"
                    : "Return request submitted successfully",
            order,
        });
    } catch (error) {
        console.error(
            "Return/exchange request error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to submit return/exchange request",
        });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
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

        if (!["Placed", "Confirmed"].includes(order.orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "Orders can only be cancelled before shipping",
            });
        }

        order.orderStatus = "Cancelled";
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order,
        });
    } catch (error) {
        console.error("Cancel order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel order",
        });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    requestReturnExchange,
    cancelOrder,
};
