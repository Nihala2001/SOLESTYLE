
const cron = require("node-cron");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");

const Order = require("../models/Order");
const Variant = require("../models/Variant");

const startUpiExpiryJob = () => {
  console.log("UPI expiry job started.");

  cron.schedule("*/30 * * * * *", async () => {
    try {
      const expiredOrders = await Order.find({
        paymentMethod: "UPI",
        paymentStatus: "Pending",
        razorpayReservationsReleased: { $ne: true },
        razorpayPaymentExpiresAt: { $lte: new Date() },
      }).select("_id");

      for (const order of expiredOrders) {
        const session = await mongoose.startSession();

        try {
          const current = await Order.findById(order._id);

          if (
            !current ||
            current.paymentMethod !== "UPI" ||
            current.paymentStatus !== "Pending" ||
            current.razorpayReservationsReleased ||
            !current.razorpayPaymentExpiresAt ||
            current.razorpayPaymentExpiresAt > new Date()
          ) {
            continue;
          }

          // Never restore stock if Razorpay has an authorized
          // or captured payment. Check with Razorpay first.
          if (current.razorpayOrderId) {
            const razorpay = new Razorpay({
              key_id: process.env.RAZORPAY_KEY_ID,
              key_secret: process.env.RAZORPAY_KEY_SECRET,
            });

            const result = await razorpay.orders.fetchPayments(
              current.razorpayOrderId
            );

            const unsafePayment = (result.items || []).some(
              (payment) =>
                payment.status === "authorized" ||
                payment.status === "captured"
            );

            if (unsafePayment) continue;
          }

          await session.withTransaction(async () => {
            const freshOrder = await Order.findOne({
              _id: order._id,
              paymentMethod: "UPI",
              paymentStatus: "Pending",
              razorpayReservationsReleased: { $ne: true },
              razorpayPaymentExpiresAt: { $lte: new Date() },
            }).session(session);

            if (!freshOrder) return;

            for (const item of freshOrder.items) {
              const restoreQuantity = Math.max(
                0,
                Number(item.quantity) -
                  Number(item.cancelledQuantity || 0)
              );

              if (restoreQuantity > 0) {
                const result = await Variant.updateOne(
                  { _id: item.variantId },
                  { $inc: { stock: restoreQuantity } },
                  { session }
                );

                if (result.matchedCount === 0) {
                  throw new Error(
                    `Variant not found: ${item.variantId}`
                  );
                }
              }
            }

            freshOrder.paymentStatus = "Failed";
            freshOrder.orderStatus = "Cancelled";
            freshOrder.razorpayReservationsReleased = true;

            await freshOrder.save({ session });
          });

          console.log("Processed expired UPI order:", order._id);
        } catch (error) {
          console.error(
            "Could not process expired order:",
            order._id,
            error.message
          );
        } finally {
          await session.endSession();
        }
      }
    } catch (error) {
      console.error("UPI expiry job error:", error.message);
    }
  });
};

module.exports = startUpiExpiryJob;
