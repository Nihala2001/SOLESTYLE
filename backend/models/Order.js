
const mongoose = require("mongoose");

/* ================= ITEM ACTION REQUEST ================= */

const itemActionRequestSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["Cancel", "Return", "Exchange"],
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        reason: {
            type: String,
            default: "",
        },

        replacementVariantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Variant",
            default: null,
        },

        replacementColor: {
            type: String,
            default: "",
        },

        replacementSize: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        status: {
            type: String,
            enum: [
                "Requested",
                "Approved",
                "Rejected",
                "Pickup Scheduled",
                "Product Received",
                "Replacement Shipped",
                "Out for Delivery",
                "Completed",
            ],
            default: "Requested",
        },

        requestedAt: {
            type: Date,
            default: Date.now,
        },

        refundAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        refundedAt: {
            type: Date,
            default: null,
        },

        refundTransactionId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

/* ================= ORDER ITEM ================= */

const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Variant",
            required: true,
        },

        productName: {
            type: String,
            required: true,
        },

        color: {
            type: String,
            default: "",
        },

        size: {
            type: String,
            default: "",
        },

        image: {
            type: String,
            default: "",
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        originalPrice: {
            type: Number,
            default: 0,
            min: 0,
        },

        offerDiscount: {
            type: Number,
            default: 0,
            min: 0,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        // Quantity tracking for partial cancellation and returns.
        cancelledQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },

        returnedQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },

        exchangedQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Supports multiple requests against the same order item.
        itemActionRequests: {
            type: [itemActionRequestSchema],
            default: [],
        },

        // Kept for compatibility with the existing application.
        returnExchange: {
            type: {
                type: String,
                enum: ["Return", "Exchange"],
                default: null,
            },

            reason: {
                type: String,
                default: "",
            },

            replacementVariantId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Variant",
                default: null,
            },

            replacementColor: {
                type: String,
                default: "",
            },

            replacementSize: {
                type: Number,
                default: null,
            },

            status: {
                type: String,
                enum: [
                    "Not Requested",
                    "Requested",
                    "Approved",
                    "Rejected",
                    "Pickup Scheduled",
                    "Product Received",
                    "Replacement Shipped",
                    "Out for Delivery",
                    "Completed",
                ],
                default: "Not Requested",
            },

            requestedAt: {
                type: Date,
                default: null,
            },

            refundAmount: {
                type: Number,
                default: 0,
                min: 0,
            },

            refundedAt: {
                type: Date,
                default: null,
            },

            refundTransactionId: {
                type: String,
                default: null,
            },
        },
    },
    { _id: false }
);

/* ================= ORDER ================= */

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: "An order must contain at least one item",
            },
        },

        shippingAddress: {
            fullName: { type: String, required: true },
            phone: { type: String, required: true },
            addressLine: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true },
            addressType: { type: String, default: "Home" },
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        discount: {
            type: Number,
            default: 0,
            min: 0,
        },

        shippingFee: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        couponCode: {
            type: String,
            default: null,
        },

        paymentMethod: {
            type: String,
            enum: ["COD", "UPI", "WALLET"],
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed", "Refunded"],
            default: "Pending",
        },

        orderStatus: {
            type: String,
            enum: [
                "Placed",
                "Confirmed",
                "Shipped",
                "Out for Delivery",
                "Delivered",
                "Cancelled",
                "Return Requested",
                "Returned",
            ],
            default: "Placed",
        },

        deliveredAt: {
            type: Date,
            default: null,
        },

        paymentReference: {
            type: String,
            default: null,
        },

        // Razorpay payment details
        razorpayOrderId: {
            type: String,
            default: null,
            index: true,
        },

        razorpayPaymentId: {
            type: String,
            default: null,
        },

        razorpayPaymentExpiresAt: {
            type: Date,
            default: null,
            index: true,
        },

        razorpayReservationsReleased: {
            type: Boolean,
            default: false,
        },
        returnReason: {
            type: String,
            default: "",
        },

        refundAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        refundedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
