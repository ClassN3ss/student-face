const express = require("express");
const router = express.Router();
const multer = require("multer");
const { createClassFromXlsx, getAllClasses, deleteClass, getClassesByStudent, getClassesByTeacher, getClassById } = require("../controllers/classController");

const { verifyToken, isTeacher } = require("../middleware/authMiddleware");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/create", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const buffer = req.file?.buffer;
    if (!buffer) return res.status(400).json({ message: "❌ ไม่พบไฟล์" });

    const classDoc = await createClassFromXlsx(buffer, req.body.section);
    res.json({ message: "✅ สร้างหรืออัปเดตคลาสแล้ว", class: classDoc });
  } catch (err) {
    console.error("❌ CREATE ERROR:", err);
    res.status(500).json({ message: err.message || "❌ สร้างคลาสไม่สำเร็จ" });
  }
});

router.get("/student/:id", verifyToken, getClassesByStudent);
router.get("/", verifyToken, getAllClasses);
router.delete("/:id", verifyToken, deleteClass);


router.get("/teacher", verifyToken, getClassesByTeacher);
router.get("/:id", verifyToken, getClassById);



module.exports = router;
