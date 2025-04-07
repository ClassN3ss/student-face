const mongoose = require("mongoose");

const checkinSessionSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  openAt: { type: Date, required: true },
  closeAt: { type: Date, required: true },
  withTeacherFace: { type: Boolean, default: false }, // ✅ ตัวเลือกว่าต้องสแกนหน้าครูหรือไม่
  status: { type: String, enum: ["active", "cancelled", "expired"], default: "active" },
}
);

module.exports = mongoose.model("CheckinSession", checkinSessionSchema);
