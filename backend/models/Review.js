
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },

        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            validate: {
                validator: Number.isInteger,
                message: "Rating must be a whole number from 1 to 5",
            },
        },

        title: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "",
        },

        comment: {
            type: String,
            trim: true,
            required: true,
            minlength: 3,
            maxlength: 1000,
        },
                isHidden: {
            type: Boolean,
            default: false,
            index: true,
        },

        adminReply: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        adminRepliedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// One review per customer per product.
// A unique database index also prevents duplicate submissions.
reviewSchema.index(
    { userId: 1, productId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Review", reviewSchema);
