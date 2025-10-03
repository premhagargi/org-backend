const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require('dotenv').config(); // must be at the very top

const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employee");
const departmentRoutes = require("./routes/department");
const userRoutes = require("./routes/user");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Add this route for the root "/"
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Server Status</title>
      </head>
      <body>
        <h1>Server is running 🚀</h1>
        <p>Welcome to the API server!</p>
      </body>
    </html>
  `);
});

module.exports = app;
