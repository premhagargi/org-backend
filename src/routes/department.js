const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require("../controllers/departmentController");

// Admin-only CRUD routes
router.get("/", auth("admin"), getAllDepartments);
router.post("/", auth("admin"), createDepartment);
router.put("/:id", auth("admin"), updateDepartment);
router.delete("/:id", auth("admin"), deleteDepartment);

module.exports = router;
