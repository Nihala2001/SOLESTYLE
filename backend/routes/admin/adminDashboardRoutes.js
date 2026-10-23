
const express = require("express");
const router = express.Router();

const adminAuthMiddleware = require("../../middleware/admin/adminAuthMiddleware");

const {
    getDashboardData,
} = require("../../controllers/admin/adminDashboardController");

router.get("/", adminAuthMiddleware, getDashboardData);

module.exports = router;
