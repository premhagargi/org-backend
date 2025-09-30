const mongoose = require("mongoose");
const Department = require("../models/Department");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("MongoDB connected for seeding departments");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const seedDepartments = async () => {
  await connectDB();

  const departments = [
    { name: "Engineering", description: "Engineering Department" },
    { name: "HR", description: "Human Resources Department" },
    { name: "Sales", description: "Sales Department" },
    { name: "Marketing", description: "Marketing Department" },
    { name: "Finance", description: "Finance & Accounting" },
    { name: "Support", description: "Customer Support Department" }
  ];

  try {
    // Optional: clear existing departments first
    await Department.deleteMany({});
    const created = await Department.insertMany(departments);
    console.log(`✅ Seeded ${created.length} departments`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDepartments();
