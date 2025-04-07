const User = require("../models/User");

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('fullName _id');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: "❌ โหลดรายชื่ออาจารย์ล้มเหลว", error: err.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q = '', role } = req.query;
    if (!q.trim()) return res.json([]);

    const keyword = new RegExp(q.trim(), 'i');
    const filter = {
      $or: [
        { fullName: keyword },
        { username: keyword },
        { email: keyword }
      ]
    };

    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).limit(10).select('username fullName role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "❌ ค้นหาผู้ใช้ล้มเหลว", error: err.message });
  }
};
