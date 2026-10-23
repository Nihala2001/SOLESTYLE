
const User = require("../../models/User");
const Product = require("../../models/Product");
const Category = require("../../models/Category");
const Order = require("../../models/Order");

// Get dashboard statistics, recent orders and top-selling data
const getDashboardData = async (req, res) => {
    try {
        const [
            totalUsers,
            totalProducts,
            totalOrders,
            recentOrders,
            salesOrders,
        ] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments(),

            Order.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select(
                    "orderNumber userId totalAmount paymentMethod paymentStatus orderStatus createdAt"
                )
                .populate("userId", "name email")
                .lean(),

            Order.find()
                .select(
                    "totalAmount items productId paymentMethod paymentStatus orderStatus"
                )
                .lean(),
        ]);

        // Keep the existing total sales calculation unchanged.
        let totalSales = 0;

        for (const order of salesOrders) {
            const isPaid =
                order.paymentStatus === "Paid" ||
                (
                    order.paymentMethod === "COD" &&
                    order.orderStatus === "Delivered"
                );

            if (isPaid && order.orderStatus !== "Cancelled") {
                totalSales += Number(order.totalAmount || 0);
            }
        }

        totalSales = Number(totalSales.toFixed(2));

        // Only use successfully paid sales for product/category rankings.
        const eligibleOrders = salesOrders.filter((order) => {
            const isPaid =
                order.paymentStatus === "Paid" ||
                (
                    order.paymentMethod === "COD" &&
                    order.orderStatus === "Delivered"
                );

            return (
                isPaid &&
                !["Cancelled", "Returned"].includes(order.orderStatus) &&
                !["Failed", "Refunded"].includes(order.paymentStatus)
            );
        });

        const productSales = new Map();

        for (const order of eligibleOrders) {
            for (const item of order.items || []) {
                const productId = item.productId?.toString();

                if (!productId) continue;

                const quantity = Math.max(
                    0,
                    Number(item.quantity || 0) -
                    Number(item.cancelledQuantity || 0) -
                    Number(item.returnedQuantity || 0)
                );

                if (quantity <= 0) continue;

                const price = Number(item.price || 0);

                if (!productSales.has(productId)) {
                    productSales.set(productId, {
                        productId,
                        productName: item.productName || "Product",
                        image: item.image || "",
                        unitsSold: 0,
                        revenue: 0,
                    });
                }

                const product = productSales.get(productId);

                product.unitsSold += quantity;
                product.revenue += price * quantity;

                // Use an order-item image if the product has no image.
                if (!product.image && item.image) {
                    product.image = item.image;
                }
            }
        }

        const soldProductIds = [...productSales.keys()];

        const products = soldProductIds.length
            ? await Product.find({
                _id: { $in: soldProductIds },
            })
                .select("name images categoryId")
                .populate("categoryId", "name")
                .lean()
            : [];

        const productDetails = new Map(
            products.map((product) => [
                product._id.toString(),
                product,
            ])
        );

        // Add current product details and sort by units sold.
        const topSellingProducts = [...productSales.values()]
            .map((sale) => {
                const product = productDetails.get(sale.productId);

                return {
                    ...sale,
                    productName: product?.name || sale.productName,
                    image:
                        product?.images?.[0] ||
                        sale.image ||
                        "",
                    categoryName:
                        product?.categoryId?.name || "Uncategorized",
                    revenue: Number(sale.revenue.toFixed(2)),
                };
            })
            .sort(
                (a, b) =>
                    b.unitsSold - a.unitsSold ||
                    b.revenue - a.revenue
            )
            .slice(0, 5);

        // Aggregate product sales into their categories.
        const categorySales = new Map();

        for (const sale of productSales.values()) {
            const product = productDetails.get(sale.productId);
            const categoryId = product?.categoryId?._id?.toString();

            if (!categoryId) continue;

            if (!categorySales.has(categoryId)) {
                categorySales.set(categoryId, {
                    categoryId,
                    categoryName: product.categoryId.name,
                    unitsSold: 0,
                    revenue: 0,
                });
            }

            const category = categorySales.get(categoryId);

            category.unitsSold += sale.unitsSold;
            category.revenue += sale.revenue;
        }

        const topSellingCategories = [...categorySales.values()]
            .map((category) => ({
                ...category,
                revenue: Number(category.revenue.toFixed(2)),
            }))
            .sort(
                (a, b) =>
                    b.unitsSold - a.unitsSold ||
                    b.revenue - a.revenue
            )
            .slice(0, 5);

        return res.status(200).json({
            success: true,
            statistics: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalSales,
            },
            recentOrders,
            topSellingProducts,
            topSellingCategories,
        });
    } catch (error) {
        console.error("Get admin dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard data",
        });
    }
};

module.exports = { getDashboardData };
