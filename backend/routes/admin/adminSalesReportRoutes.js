
const express = require("express");
const router = express.Router();

const adminAuthMiddleware = require("../../middleware/admin/adminAuthMiddleware");

const {
    getSalesReport,
} = require("../../controllers/admin/adminSalesReportController");

// Get sales report with date filters
router.get("/", adminAuthMiddleware, getSalesReport);

module.exports = router;
