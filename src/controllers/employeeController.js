const User = require("../models/User");
const Department = require("../models/Department");
const mongoose = require("mongoose"); // Import mongoose for ObjectId validation

// List all employees (admin-only)
exports.getAllEmployees = async (req, res) => {
  try {
    const { department, status, search, position } = req.query;

    // Employee filter
    const filter = { role: "employee" };
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (position) filter.position = { $regex: position, $options: "i" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch employees with populated leave requests
    const employees = await User.find(filter)
      .populate("department")
      .populate("leaveRequests")
      .sort({ createdAt: -1 });

    // Department stats with employee count
    const departments = await Department.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "department",
          as: "employees"
        }
      },
      {
        $addFields: {
          employeeCount: { $size: "$employees" }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          employeeCount: 1
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.json({
      status: "success",
      data: {
        employees,
        departments
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
};

// Get profile (any logged-in user)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("department")
      .populate("leaveRequests");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get employee by ID (admin-only)
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .populate("department")
      .populate("leaveRequests");
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ employee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update employee (admin-only)
exports.updateEmployee = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      department, 
      salary, 
      status, 
      position,
      personalDetails,
      contacts,
      workingHours
    } = req.body;

    const employee = await User.findById(req.params.id);
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (name) employee.name = name;
    if (email) employee.email = email;
    if (department) employee.department = department;
    if (salary !== undefined) employee.salary = salary;
    if (status) employee.status = status;
    if (position) employee.position = position;
    if (personalDetails) employee.personalDetails = personalDetails;
    if (contacts) employee.contacts = contacts;
    if (workingHours) employee.workingHours = workingHours;

    await employee.save();

    res.json({ message: "Employee updated successfully", employee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create leave request (employee-only)
exports.createLeaveRequest = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || user.role !== "employee") {
      return res.status(403).json({ message: "Unauthorized: Only employees can request leave" });
    }

    user.leaveRequests.push({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: "pending"
    });

    await user.save();
    res.json({ message: "Leave request created successfully", leaveRequest: user.leaveRequests[user.leaveRequests.length - 1] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateLeaveRequest = async (req, res) => {
  try {
    const { employeeId, leaveRequestId } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(employeeId) || !mongoose.isValidObjectId(leaveRequestId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const employee = await User.findById(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const leaveRequest = employee.leaveRequests.id(leaveRequestId);
    if (!leaveRequest) return res.status(404).json({ message: "Leave request not found" });

    leaveRequest.status = status;
    await employee.save();

    res.json({ message: "Leave request updated", leaveRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getEmployeeLeaves = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Validate employeeId
    if (!mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    const employee = await User.findById(employeeId).select("name leaveRequests");
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    res.json({ employeeId: employee._id, name: employee.name, leaveRequests: employee.leaveRequests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
