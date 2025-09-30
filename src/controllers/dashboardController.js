const User = require("../models/User");
const Department = require("../models/Department");

exports.getDashboardStats = async (req, res) => {
  try {
    // ---------------------------
    // Global active vs inactive
    // ---------------------------
    const totalEmployees = await User.countDocuments({ role: "employee" });
    const activeEmployees = await User.countDocuments({ role: "employee", status: "active" });
    const inactiveEmployees = await User.countDocuments({ role: "employee", status: "inactive" });

    // ---------------------------
    // Employees per department (including departments with 0 employees)
    // ---------------------------
    const departments = await Department.aggregate([
      {
        $lookup: {
          from: "users",             // collection name in MongoDB (check your DB)
          localField: "_id",
          foreignField: "department",
          as: "employees"
        }
      },
      {
        $addFields: { employeeCount: { $size: "$employees" } }
      },
      {
        $project: { _id: 1, name: 1, employeeCount: 1 }
      },
      { $sort: { name: 1 } }
    ]);

    // ---------------------------
    // Salary distribution
    // ---------------------------
    const salaryBuckets = [
      { range: "0-30000", min: 0, max: 30000 },
      { range: "30001-50000", min: 30001, max: 50000 },
      { range: "50001+", min: 50001, max: 1000000 },
    ];

    const salaryDistribution = {};
    for (let bucket of salaryBuckets) {
      const count = await User.countDocuments({
        role: "employee",
        salary: { $gte: bucket.min, $lte: bucket.max }
      });
      salaryDistribution[bucket.range] = count;
    }

    // ---------------------------
    // Send response
    // ---------------------------
    res.json({
      status: "success",
      data: {
        activeEmployees,
        inactiveEmployees,
        totalEmployees,
        totalDepartments: departments.length,
        salaryDistribution,
        departments
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

