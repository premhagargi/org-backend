const Department = require("../models/Department");
const User = require("../models/User");

// GET /api/departments
exports.getAllDepartments = async (req, res) => {
  try {
    // Aggregate departments with employee count
    const departments = await Department.aggregate([
      {
        $lookup: {
          from: "users",           // MongoDB collection name
          localField: "_id",
          foreignField: "department",
          as: "employees"
        }
      },
      {
        $addFields: { employeeCount: { $size: "$employees" } }
      },
      {
        $project: { _id: 1, name: 1, description: 1, employeeCount: 1 }
      },
      { $sort: { name: 1 } }
    ]);

    res.json({ departments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// Create a new department (admin-only)
exports.createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) return res.status(400).json({ message: "Department name is required" });

    // Check if department already exists
    const existing = await Department.findOne({ name });
    if (existing) return res.status(400).json({ message: "Department already exists" });

    const department = new Department({ name, description });
    await department.save();

    res.status(201).json({ message: "Department created successfully", department });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update department (admin-only)
exports.updateDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: "Department not found" });

    if (name) department.name = name;
    if (description) department.description = description;

    await department.save();
    res.json({ message: "Department updated successfully", department });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete department (admin-only)
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: "Department not found" });

    await department.deleteOne();
    res.json({ message: "Department deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
