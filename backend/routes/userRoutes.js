const express = require("express");
const router = express.Router();
const { getTeachers, searchUsers } = require("../controllers/userController");
const { verifyToken,} = require("../middleware/authMiddleware");

// ✅ จำกัดเฉพาะคน login และมีสิทธิ์เท่านั้น
router.get("/teachers", verifyToken, getTeachers);
router.get("/search/users", verifyToken, searchUsers);

module.exports = router;
