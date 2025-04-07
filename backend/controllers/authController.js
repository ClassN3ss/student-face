const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../configuration/config");
const faceapi = require("face-api.js");
const Class = require("../models/Class");

// นักศึกษาลงทะเบียนจากข้อมูลที่มีอยู่
exports.register = async (req, res) => {
  try {
    const { studentId, fullName } = req.body;

    const existing = await User.findOne({ studentId, fullName });
    if (!existing) {
      return res.status(400).json({ message: "Student ID หรือชื่อไม่ตรงกับระบบ" });
    }

    const username = studentId;
    const password_hash = await bcrypt.hash(studentId, 10);

    existing.username = username;
    existing.password_hash = password_hash;
    await existing.save();

    res.json({ username, password: studentId });
  } catch (err) {
    res.status(500).json({ message: "❌ เกิดข้อผิดพลาด", error: err.message });
  }
};

// Login โดยใช้ username หรือ studentId
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      $or: [{ username }, { studentId: username }]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or student ID" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

// ✨ อัปเดตใบหน้าและส่ง studentId + fullName กลับ
exports.uploadFace = async (req, res) => {
  try {
    const { faceDescriptor } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.faceScanned = true;
    user.faceDescriptor = faceDescriptor;
    await user.save();

    res.json({
      message: "Face saved successfully!",
      studentId: user.studentId,
      fullName: user.fullName
    });
  } catch (err) {
    res.status(500).json({ message: "Face upload failed", error: err.message });
  }
};

// ✨ ตรวจสอบใบหน้าอาจารย์ก่อนให้นักศึกษาเช็คชื่อ
exports.verifyTeacherFace = async (req, res) => {
  try {
    const { classId, faceDescriptor } = req.body;

    // ✅ 1. หาอาจารย์จาก classId
    const classroom = await Class.findById(classId).populate("teacherId");
    if (!classroom || !classroom.teacherId) {
      return res.status(404).json({ message: "ไม่พบอาจารย์ในคลาสนี้" });
    }

    const teacher = classroom.teacherId;

    if (!teacher.faceDescriptor) {
      return res.status(403).json({ message: "อาจารย์ยังไม่ได้สแกนใบหน้า" });
    }

    // ✅ 2. เปรียบเทียบใบหน้า
    const savedDescriptor = Float32Array.from(teacher.faceDescriptor);
    const inputDescriptor = Float32Array.from(faceDescriptor);

    const distance = faceapi.euclideanDistance(savedDescriptor, inputDescriptor);
    console.log("🔍 Face distance:", distance);

    if (distance > 0.5) {
      return res.status(403).json({ message: "❌ ใบหน้าไม่ตรงกับอาจารย์" });
    }

    res.json({ message: "✅ ยืนยันตัวตนสำเร็จ" });
  } catch (err) {
    console.error("❌ ตรวจสอบอาจารย์ล้มเหลว:", err);
    res.status(500).json({ message: "❌ ตรวจสอบอาจารย์ล้มเหลว", error: err.message });
  }
};

exports.saveTeacherFace = async (req, res) => {
  try {
    const { faceDescriptor } = req.body;

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "teacher") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    user.faceDescriptor = faceDescriptor;
    user.faceScanned = true;
    await user.save();

    res.json({ message: "👨‍🏫 Teacher face saved!" });
  } catch (err) {
    res.status(500).json({ message: "Save teacher face failed", error: err.message });
  }
};

