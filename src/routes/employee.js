const express = require("express");
const router = express.Router();
const { getAllEmployees, getProfile, updateEmployee, getEmployeeById, createLeaveRequest, updateLeaveRequest, getEmployeeLeaves} = require("../controllers/employeeController");
const auth = require("../middleware/auth");

router.get("/", auth("admin"), getAllEmployees);
router.get("/:id", auth("admin"), getEmployeeById);
router.put("/:id", auth("admin"), updateEmployee);
router.get("/profile", auth(), getProfile); // employee self-service
router.post("/leave-requests", auth(), createLeaveRequest); // employee self-service
router.patch("/leave-requests/:employeeId/:leaveRequestId", auth("admin"), updateLeaveRequest);
router.get("/leave-requests/:employeeId", auth(), getEmployeeLeaves);
router.get("/leave-requests/:employeeId", auth("admin"), getEmployeeLeaves);






module.exports = router;
