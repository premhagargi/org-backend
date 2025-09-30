const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.error("❌ MONGO_URI is not defined in environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
