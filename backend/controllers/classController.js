const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Class = require("../models/Class");

function cleanName(raw) {
  return raw
    .replace(/ผู้สอน/g, '')
    .replace(/อาจารย์/g, '')
    .replace(/ดร\./g, '')
    .replace(/ดร/g, '')
    .replace(/ศ\./g, '')
    .trim();
}

exports.createClassFromXlsx = async (buffer, section) => {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const courseRow = rows.find(r => r?.[0]?.toString().includes("วิชา"));
  const teacherRow = rows.find(r => r?.[5]?.toString().includes("ผู้สอน"));
  if (!courseRow || !teacherRow) throw new Error("❌ ไม่พบข้อมูลวิชา หรือ ผู้สอนในไฟล์");

  const courseParts = courseRow[0].split(/\s+/);
  const courseCode = courseParts[1];
  const courseName = courseParts.slice(2).join(" ");
  const sectionStr = String(section || "1");

  const teacherName = cleanName(teacherRow[5]);
  let teacher = await User.findOne({ fullName: teacherName, role: "teacher" });
  if (!teacher) {
    const hashed = await bcrypt.hash("teacher123", 10);
    teacher = await User.create({
      username: teacherName.replace(/\s/g, "").toLowerCase(),
      fullName: teacherName,
      email: `${teacherName.replace(/\s/g, "").toLowerCase()}@kmutnb.ac.th`,
      password_hash: hashed,
      role: "teacher"
    });
  }

  const students = [];
  const seen = new Set();
  for (let i = 9; i < rows.length; i++) {
    const row = rows[i];
    const studentId = String(row[1] || "").trim();
    const fullName = String(row[2] || "").trim();
    if (!studentId || !fullName || seen.has(studentId)) continue;
    seen.add(studentId);

    const email = `s${studentId}@kmutnb.ac.th`;
    let user = await User.findOne({ studentId: studentId });

    if (!user) {
      const hashed = await bcrypt.hash(studentId, 10);
      user = await User.create({
        studentId: studentId,
        username: studentId,
        fullName: fullName,
        email,
        password_hash: hashed,
        role: "student"
      });
    } else {
      if (user.fullName !== fullName) {
        user.fullName = fullName;
        await user.save();
      }
    }

    students.push(user._id);
  }

  if (students.length === 0) throw new Error("❌ ไม่พบนักศึกษาในไฟล์");

  let classDoc = await Class.findOne({ courseCode, section: sectionStr });
  if (classDoc) {
    classDoc.courseName = courseName;
    classDoc.teacherId = teacher._id;
    classDoc.students = students;
    await classDoc.save();
  } else {
    classDoc = await Class.create({
      courseCode,
      courseName,
      section: sectionStr,
      teacherId: teacher._id,
      students
    });
  }

  return classDoc;
};

exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("teacherId", "fullName")
      .populate("students", "fullName email username");
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: "❌ ดึงข้อมูลคลาสล้มเหลว", error: err.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const deleted = await Class.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "❌ ไม่พบคลาส" });
    res.json({ message: "✅ ลบคลาสแล้ว" });
  } catch (err) {
    res.status(500).json({ message: "❌ ลบคลาสล้มเหลว", error: err.message });
  }
};

exports.getClassesByStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const classes = await Class.find({ students: studentId })
      .populate("teacherId", "fullName")
      .populate("students", "fullName email username")
      .select("courseCode courseName section");
    res.json(classes);
  } catch (err) {
    console.error("❌ ดึงข้อมูลคลาสของนักศึกษาล้มเหลว:", err);
    res.status(500).json({ message: "❌ ล้มเหลว", error: err.message });
  }
};

exports.getClassesByTeacher = async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.user._id });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: "❌ ไม่สามารถโหลดคลาสของอาจารย์", error: err.message });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id).populate("teacherId").populate("students");
    if (!cls) return res.status(404).json({ message: "Class not found" });
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: "Error fetching class", error: error.message });
  }
};