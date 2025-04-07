const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  studentId: { type: String, unique: true, sparse: true },
  fullName: { type: String },
  username: { type: String },
  password: { type: String },
  password_hash: { type: String },
  role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
  email: { type: String, default: "" },
  faceScanned: { type: Boolean, default: false },
  faceDescriptor: { type: [Number] }, // 128 ค่า descriptor
});

module.exports = mongoose.model("User", userSchema);
