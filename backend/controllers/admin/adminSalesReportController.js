
const Order = require("../../models/Order");

/* ================= SALES REPORT ================= */

const getSalesReport = async (req, res) => {
    try {
        const {
            period = "month",
            startDate,
            endDate,
        } = req.query;

        const now = new Date();

        let from;
        let to = new Date(now);

        // Determine report date range
        if (period === "custom") {
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Start date and end date are required for a custom report",
                });
            }

            from = new Date(`${startDate}T00:00:00.000`);
            to = new Date(`${endDate}T23:59:59.999`);

            if (
                Number.isNaN(from.getTime()) ||
                Number.isNaN(to.getTime()) ||
                from > to
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid date range",
                });
            }
        } else {
            from = new Date(now);
            from.setHours(0, 0, 0, 0);

            if (period === "today") {
                // Today's orders
            } else if (period === "7days") {
                from.setDate(from.getDate() - 6);
            } else if (period === "30days") {
                from.setDate(from.getDate() - 29);
            } else if (period === "month") {
                from.setDate(1);
            } else if (period === "6months") {
                from.setMonth(from.getMonth() - 5, 1);
            } else if (period === "year") {
                from.setMonth(0, 1);
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid report period",
                });
            }
        }

        // Fetch orders within the selected period
        const orders = await Order.find({
            createdAt: {
                $gte: from,
                $lte: to,
            },
        })
            .select(
                "orderNumber userId items subtotal discount shippingFee totalAmount paymentMethod paymentStatus orderStatus refundAmount createdAt"
            )
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .lean();

        // Sales summary
        const summary = {
            totalOrders: orders.length,
            paidOrders: 0,
            itemsSold: 0,
            grossSales: 0,
            refunds: 0,
            netSales: 0,
            averageOrderValue: 0,
            pendingPayments: 0,
            failedPayments: 0,
            cancelledOrders: 0,
        };

        // Prepare daily sales entries, including days with zero sales
        const dailySalesMap = new Map();

        const cursor = new Date(from);
        cursor.setHours(0, 0, 0, 0);

        const lastDay = new Date(to);
        lastDay.setHours(0, 0, 0, 0);

        while (cursor <= lastDay) {
            const dateKey = [
                cursor.getFullYear(),
                String(cursor.getMonth() + 1).padStart(2, "0"),
                String(cursor.getDate()).padStart(2, "0"),
            ].join("-");

            dailySalesMap.set(dateKey, 0);

            cursor.setDate(cursor.getDate() + 1);
        }

        // Use the same paid-order rules for summary and graph
        for (const order of orders) {
            const orderTotal = Number(order.totalAmount || 0);
            const refund = Number(order.refundAmount || 0);

            summary.refunds += refund;

            if (order.orderStatus === "Cancelled") {
                summary.cancelledOrders += 1;
            }

            if (order.paymentStatus === "Pending") {
                summary.pendingPayments += 1;
            }

            if (order.paymentStatus === "Failed") {
                summary.failedPayments += 1;
            }

            const isPaid =
                order.paymentStatus === "Paid" ||
                (
                    order.paymentMethod === "COD" &&
                    order.orderStatus === "Delivered"
                );

            if (!isPaid) {
                continue;
            }

            summary.paidOrders += 1;

            // Exclude cancelled orders from sales
            if (order.orderStatus !== "Cancelled") {
                summary.grossSales += orderTotal;

                for (const item of order.items || []) {
                    const quantity = Math.max(
                        0,
                        Number(item.quantity || 0) -
                            Number(item.cancelledQuantity || 0)
                    );

                    summary.itemsSold += quantity;
                }
            }

            // Exclude cancelled, returned and refunded orders from the graph
            if (
                ["Cancelled", "Returned"].includes(order.orderStatus) ||
                ["Failed", "Refunded"].includes(order.paymentStatus)
            ) {
                continue;
            }

            const createdAt = new Date(order.createdAt);

            const dateKey = [
                createdAt.getFullYear(),
                String(createdAt.getMonth() + 1).padStart(2, "0"),
                String(createdAt.getDate()).padStart(2, "0"),
            ].join("-");

            if (dailySalesMap.has(dateKey)) {
                dailySalesMap.set(
                    dateKey,
                    dailySalesMap.get(dateKey) + orderTotal
                );
            }
        }

        // Convert daily sales map to the format expected by the frontend
        const dailySales = Array.from(
            dailySalesMap,
            ([date, revenue]) => ({
                date,
                revenue: Number(revenue.toFixed(2)),
            })
        );

        // Finalize summary amounts
        summary.grossSales = Number(
            summary.grossSales.toFixed(2)
        );

        summary.refunds = Number(
            summary.refunds.toFixed(2)
        );

        summary.netSales = Number(
            Math.max(
                0,
                summary.grossSales - summary.refunds
            ).toFixed(2)
        );

        summary.averageOrderValue = summary.paidOrders
            ? Number(
                (
                    summary.grossSales /
                    summary.paidOrders
                ).toFixed(2)
            )
            : 0;

        // Return summary, orders and daily sales for the dashboard graph
        return res.status(200).json({
            success: true,
            period,
            dateRange: {
                startDate: from,
                endDate: to,
            },
            summary,
            orders,
            dailySales,
        });
    } catch (error) {
        console.error("Get sales report error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate sales report",
        });
    }
};

module.exports = {
    getSalesReport,
};
