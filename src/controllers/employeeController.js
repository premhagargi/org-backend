const User = require("../models/User");
const Department = require("../models/Department");
const mongoose = require("mongoose"); // Import mongoose for ObjectId validation

// List all employees (admin-only)
exports.getAllEmployees = async (req, res) => {
  try {
    const { department, status, position, q } = req.query;

    // Employee filter
    const filter = { role: "employee" };
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (position) filter.position = { $regex: position, $options: "i" };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { employeeId: { $regex: q, $options: "i" } }
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

exports.createEmployee = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      department, 
      salary, 
      position,
      personalDetails,
      contacts
    } = req.body;

    // Ensure employee role
    const employee = new User({
      name,
      email,
      password,
      role: "employee",
      department,
      salary,
      position,
      personalDetails: {
        dateOfBirth: personalDetails?.dateOfBirth,
        address: {
          street: personalDetails?.address?.street,
          city: personalDetails?.address?.city,
          state: personalDetails?.address?.state,
          postalCode: personalDetails?.address?.postalCode,
          country: personalDetails?.address?.country
        },
        gender: personalDetails?.gender,
        maritalStatus: personalDetails?.maritalStatus,
        nationality: personalDetails?.nationality,
        languagesSpoken: personalDetails?.languagesSpoken,
        educationHistory: personalDetails?.educationHistory,
        previousWorkExperience: personalDetails?.previousWorkExperience
      },
      contacts: {
        phone: contacts?.phone,
        emergencyContact: {
          name: contacts?.emergencyContact?.name,
          relationship: contacts?.emergencyContact?.relationship,
          phone: contacts?.emergencyContact?.phone
        }
      }
    });

    await employee.save();

    res.status(201).json({ message: "Employee created successfully", employee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET EMPLOYEE BY ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .populate("department")
      .select("name email role department salary status position personalDetails contacts workingHours leaveRequests createdAt updatedAt");
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ employee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// UPDATE EMPLOYEE
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

    // Update top-level fields
    if (name) employee.name = name;
    if (email) employee.email = email;
    if (department) employee.department = department;
    if (salary !== undefined) employee.salary = salary;
    if (status) employee.status = status;
    if (position) employee.position = position;

    // Update personalDetails nested fields
    if (personalDetails) {
      if (!employee.personalDetails) employee.personalDetails = {};
      
      if (personalDetails.dateOfBirth) employee.personalDetails.dateOfBirth = personalDetails.dateOfBirth;
      if (personalDetails.address) {
        if (!employee.personalDetails.address) employee.personalDetails.address = {};
        if (personalDetails.address.street) employee.personalDetails.address.street = personalDetails.address.street;
        if (personalDetails.address.city) employee.personalDetails.address.city = personalDetails.address.city;
        if (personalDetails.address.state) employee.personalDetails.address.state = personalDetails.address.state;
        if (personalDetails.address.postalCode) employee.personalDetails.address.postalCode = personalDetails.address.postalCode;
        if (personalDetails.address.country) employee.personalDetails.address.country = personalDetails.address.country;
      }
      if (personalDetails.gender) employee.personalDetails.gender = personalDetails.gender;
      if (personalDetails.maritalStatus) employee.personalDetails.maritalStatus = personalDetails.maritalStatus;
      if (personalDetails.nationality) employee.personalDetails.nationality = personalDetails.nationality;
      if (personalDetails.languagesSpoken) employee.personalDetails.languagesSpoken = personalDetails.languagesSpoken;
      if (personalDetails.educationHistory) employee.personalDetails.educationHistory = personalDetails.educationHistory;
      if (personalDetails.previousWorkExperience) employee.personalDetails.previousWorkExperience = personalDetails.previousWorkExperience;
    }

    // Update contacts nested fields
    if (contacts) {
      if (!employee.contacts) employee.contacts = {};
      
      if (contacts.phone) employee.contacts.phone = contacts.phone;
      if (contacts.emergencyContact) {
        if (!employee.contacts.emergencyContact) employee.contacts.emergencyContact = {};
        if (contacts.emergencyContact.name) employee.contacts.emergencyContact.name = contacts.emergencyContact.name;
        if (contacts.emergencyContact.relationship) employee.contacts.emergencyContact.relationship = contacts.emergencyContact.relationship;
        if (contacts.emergencyContact.phone) employee.contacts.emergencyContact.phone = contacts.emergencyContact.phone;
      }
    }

    // Update workingHours
    if (workingHours) {
      if (!employee.workingHours) employee.workingHours = {};
      if (workingHours.startTime) employee.workingHours.startTime = workingHours.startTime;
      if (workingHours.endTime) employee.workingHours.endTime = workingHours.endTime;
      if (workingHours.days) employee.workingHours.days = workingHours.days;
    }

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
