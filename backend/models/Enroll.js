const mongoose = require("mongoose");

const enrollSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, },
  approved: { type: Boolean, default: true, },
  timestamp: { type: Date, default: Date.now, },
});

module.exports = mongoose.model("Enroll", enrollSchema);
