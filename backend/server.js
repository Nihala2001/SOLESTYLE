require("dotenv").config();
const express = require("express");
const cors = require("cors")

const connectDB = require("./config/db");
const authRoutes = require("./routes/user/authRoutes");
const userRoutes = require("./routes/user/userRoutes");


const adminAuthRoutes = require("./routes/admin/adminAuthRoutes");
const adminUserRoutes = require("./routes/admin/adminUserRoutes");
const adminProfileRoutes = require("./routes/admin/adminProfileRoutes");
const adminCategoryRoutes = require("./routes/admin/adminCategoryRoutes");
const adminProductRoutes = require("./routes/admin/adminProductRoutes");



const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/admin", adminProfileRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/products", adminProductRoutes);

connectDB();

app.listen(5001, () => {
  console.log("Server running on port 5001");
});