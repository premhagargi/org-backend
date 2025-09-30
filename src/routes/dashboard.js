const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getDashboardStats } = require("../controllers/dashboardController");

// Admin-only dashboard stats
router.get("/", auth("admin"), getDashboardStats);

module.exports = router;
