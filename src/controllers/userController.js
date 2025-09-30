const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ---------------------
// ADMIN SELF-REGISTRATION (only if no admins exist)
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if any admin exists
    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      return res
        .status(403)
        .json({ message: "Admin already exists. Cannot self-register." });
    }

    const admin = new User({ name, email, password, role: "admin" });
    await admin.save();

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Admin registered successfully",
      token,
      user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------
// LOGIN (for both admin and employee)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------
// ADMIN CREATES EMPLOYEE
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, department, salary } = req.body;

    // Ensure employee role
    const employee = new User({
      name,
      email,
      password,
      role: "employee",
      department,
      salary,
    });

    await employee.save();

    res.status(201).json({ message: "Employee created successfully", employee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------
// GET PROFILE (any logged-in user)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("department");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
