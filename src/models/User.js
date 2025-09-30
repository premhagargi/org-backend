const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    salary: { type: Number },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    position: { type: String },
    personalDetails: {
      dateOfBirth: { type: Date },
      address: { type: String },
      gender: { type: String, enum: ["male", "female", "other"] },
      maritalStatus: { type: String, enum: ["single", "married", "divorced", "widowed"] }
    },
    contacts: {
      phone: { type: String },
      emergencyContact: {
        name: { type: String },
        relationship: { type: String },
        phone: { type: String }
      }
    },
    workingHours: {
      startTime: { type: String },
      endTime: { type: String },
      days: [{ type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }]
    },
    leaveRequests: [{
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      reason: { type: String, required: true },
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", userSchema);