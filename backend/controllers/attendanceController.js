const Attendance = require("../models/Attendance");
const FaceScanLog = require("../models/FaceScanLog");
const CheckinSession = require("../models/CheckinSession");
const User = require("../models/User");

exports.checkIn = async (req, res) => {
  try {
    const { studentId, fullName, latitude, longitude, sessionId } = req.body;

    const missingFields = [];
    if (!studentId) missingFields.push("studentId");
    if (!fullName) missingFields.push("fullName");
    if (!latitude) missingFields.push("latitude");
    if (!longitude) missingFields.push("longitude");
    if (!sessionId) missingFields.push("sessionId");

    if (missingFields.length) {
      return res.status(400).json({
        message: "❌ ข้อมูลไม่ครบ",
        missing: missingFields,
      });
    }

    const now = new Date();

    const session = await CheckinSession.findById(sessionId)
      .populate({
        path: "classId",
        populate: { path: "teacherId", select: "fullName" }
      });

    if (!session) {
      return res.status(404).json({ message: "❌ ไม่พบ session นี้" });
    }

    if (session.status !== "active" || now < session.openAt || now > session.closeAt) {
      return res.status(403).json({ message: "⛔ หมดเวลาเช็คชื่อแล้ว" });
    }

    const duplicate = await Attendance.findOne({ studentId, sessionId });
    if (duplicate) {
      return res.status(409).json({ message: "⚠️ คุณเช็คชื่อในรอบนี้ไปแล้ว" });
    }

    const status = now <= session.closeAt ? "Present" : "Late";

    await Attendance.create({
      studentId,
      fullName,
      classId: session.classId._id,
      courseCode: session.classId.courseCode,
      courseName: session.classId.courseName,
      section: session.classId.section,
      sessionId: session._id,
      status,
      location_data: { latitude, longitude },
      scan_time: now,
      withTeacherFace: session.withTeacherFace || false,
      teacherName: session.classId.teacherId?.fullName || "ไม่ทราบชื่ออาจารย์"
    });

    const user = await User.findOne({ studentId });
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });

    await FaceScanLog.create({
      userId: user._id,
      classId: session.classId._id,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 8),
      location: { lat: latitude, lng: longitude },
      status: "success",
    });

    res.json({ message: "✅ เช็คชื่อสำเร็จ", status });
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    res.status(500).json({ message: "❌ เกิดข้อผิดพลาด", error: err.message });
  }
};

exports.getHistoryByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const history = await Attendance.find({ studentId })
      .sort({ scan_time: -1 })
      .populate("classId", "courseCode courseName section")
      .lean();

    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลประวัติได้", error: err.message });
  }
};

exports.getAllFaceScanLogs = async (req, res) => {
  try {
    const logs = await FaceScanLog.find()
      .populate("userId", "fullName username")
      .populate("classId", "courseName courseCode")
      .lean();
    res.json(logs);
  } catch (err) {
    console.error("❌ ดึงประวัติการสแกนล้มเหลว:", err);
    res.status(500).json({ message: "❌ ไม่สามารถโหลดข้อมูลได้" });
  }
};

exports.getAttendanceByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const records = await Attendance.find({ classId })
      .sort({ scan_time: 1 });

    res.json(records);
  } catch (err) {
    console.error("❌ ERROR in getAttendanceByClassId:", err);
    res.status(500).json({ message: "❌ โหลดข้อมูลการเช็คชื่อไม่สำเร็จ", error: err.message });
  }
};
