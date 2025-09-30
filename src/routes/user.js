const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  registerAdmin,
  login,
  createEmployee,
  getProfile,
} = require("../controllers/userController");

// Public: only first admin can register
router.post("/register-admin", registerAdmin);

// Public login for all users
router.post("/login", login);

// Admin creates employee
router.post("/create-employee", auth("admin"), createEmployee);

// Any logged-in user can view profile
router.get("/profile", auth(), getProfile);

module.exports = router;
