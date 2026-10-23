require("dotenv").config();
const express = require("express");
const cors = require("cors")

const connectDB = require("./config/db");
const authRoutes = require("./routes/user/authRoutes");
const userRoutes = require("./routes/user/userRoutes");
const categoryRoutes = require("./routes/user/categoryRoutes");
const productRoutes = require("./routes/user/productRoutes");
const variantRoutes = require("./routes/user/variantRoutes")
const cartRoutes = require("./routes/user/cartRoutes");
const wishlistRoutes = require("./routes/user/wishlistRoutes");
const orderRoutes = require("./routes/user/orderRoutes");
const couponRoutes = require("./routes/user/couponRoutes");
const walletRoutes = require("./routes/user/walletRoutes");
const reviewRoutes = require("./routes/user/reviewRoutes");



const adminAuthRoutes = require("./routes/admin/adminAuthRoutes");
const adminUserRoutes = require("./routes/admin/adminUserRoutes");
const adminProfileRoutes = require("./routes/admin/adminProfileRoutes");
const adminCategoryRoutes = require("./routes/admin/adminCategoryRoutes");
const adminProductRoutes = require("./routes/admin/adminProductRoutes");
const adminVariantRoutes = require("./routes/admin/adminVariantRoutes");
const adminOrderRoutes = require("./routes/admin/adminOrderRoutes");
const adminCouponRoutes = require("./routes/admin/adminCouponRoutes");
const adminOfferRoutes = require("./routes/admin/adminOfferRoutes");
const adminReviewRoutes = require("./routes/admin/adminReviewRoutes");
const adminSalesReportRoutes = require("./routes/admin/adminSalesReportRoutes");
const adminDashboardRoutes = require("./routes/admin/adminDashboardRoutes");



const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/user/coupons", couponRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/reviews", reviewRoutes);



app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/admin", adminProfileRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/variants", adminVariantRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/admin/offers", adminOfferRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);
app.use("/api/admin/sales-report", adminSalesReportRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);


connectDB();

app.listen(5001, () => {
  console.log("Server running on port 5001");
});