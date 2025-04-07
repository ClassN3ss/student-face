const mongoose = require("mongoose");

const enrollRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, },
  reason: { type: String, },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", },
  timestamp: { type: Date, default: Date.now, },
});

module.exports = mongoose.model("EnrollRequest", enrollRequestSchema);
