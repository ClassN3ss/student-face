const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const faceRoutes = require("./routes/faceRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

const userRoutes = require("./routes/userRoutes");
const classRoutes = require("./routes/classRoutes");
const enrollRoutes = require("./routes/enrollRoutes");
const enrollRequestRoutes = require("./routes/enrollRequestRoutes");
const searchRoutes = require("./routes/searchRoutes");
const uploadRoutes = require("./routes/uploadStudents");
const checkinSessionRoutes = require("./routes/checkinSessionRoutes");

const { startSessionExpiryCron } = require("./scheduler/expireCheckinSessions");
startSessionExpiryCron();


// Load environment variables
dotenv.config();

// Create express app
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Connect to MongoDB
const connectDB = require("./configuration/database/db");
connectDB();

app.use("/auth", authRoutes);

app.use("/api/students", faceRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use("/api/users", userRoutes); // 👨‍🎓 user CRUD
app.use("/api/classes", classRoutes); // 📚 class CRUD
app.use("/api/enrollments", enrollRequestRoutes);
app.use("/api/enrolls", enrollRoutes); // ✅ enroll students
app.use("/api/search", searchRoutes); // 🔍 face search
app.use("/api/upload", uploadRoutes); // 📂 CSV upload
app.use("/api/checkin-sessions", checkinSessionRoutes);


// Routes (ยังไม่เพิ่ม)
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
