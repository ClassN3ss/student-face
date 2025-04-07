import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";

const Register = () => {
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/auth/register", {
        studentId,
        fullName,
      });
      setGeneratedCredentials(res.data);
    } catch (error) {
      setError("❌ ไม่พบรหัสนักศึกษา หรือชื่อไม่ตรงกับระบบ");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedCredentials) return;
    const text = `Username: ${generatedCredentials.username}\nPassword: ${generatedCredentials.password}`;
    navigator.clipboard.writeText(text);
    alert("📋 คัดลอกสำเร็จ!");
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: "400px" }}>
        <h3 className="text-center mb-4">ลงทะเบียนนักศึกษา</h3>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="form-control mb-3"
            required
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="form-control mb-3"
            required
            disabled={loading}
          />
          {error && <div className="text-danger mb-2">{error}</div>}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "⏳ กำลังสมัคร..." : "✅ สมัคร"}
          </button>
        </form>

        {generatedCredentials && (
          <div className="mt-4 bg-white p-3 border rounded">
            <p><strong>Username</strong></p>
            <input
              type="text"
              className="form-control mb-2"
              readOnly
              value={generatedCredentials.username}
            />
            <p><strong>Password</strong></p>
            <input
              type="text"
              className="form-control mb-2"
              readOnly
              value={generatedCredentials.password}
            />
            <button
              className="btn btn-outline-secondary w-100"
              onClick={handleCopy}
            >
              📋 คัดลอก
            </button>
            <button
              className="btn btn-success w-100 mt-2"
              onClick={() => navigate("/login")}
            >
              🔑 ไปหน้า Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
