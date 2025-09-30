const User = require("../models/User");
const Department = require("../models/Department");

exports.getDashboardStats = async (req, res) => {
  try {
    // ---------------------------
    // Global active vs inactive
    // ---------------------------
    const activeEmployees = await User.countDocuments({ role: "employee", status: "active" });
    const inactiveEmployees = await User.countDocuments({ role: "employee", status: "inactive" });

    // ---------------------------
    // Employees per department
    // ---------------------------
    const departments = await User.aggregate([
      { $match: { role: "employee" } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department"
        }
      },
      { $unwind: "$department" },
      {
        $project: {
          _id: 0,
          departmentId: "$department._id",
          departmentName: "$department.name",
          employeeCount: "$count"
        }
      },
      { $sort: { departmentName: 1 } }
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
        departments,
        salaryDistribution
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};
