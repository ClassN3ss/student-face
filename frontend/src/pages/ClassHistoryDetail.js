// src/pages/ClassHistoryDetail.js
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import "bootstrap/dist/css/bootstrap.min.css";

const ClassHistoryDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const classId = location.state?.classId;

  const [attendances, setAttendances] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/attendance/class/${classId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data || [];
        setAttendances(data);
        setFiltered(data);
      } catch (err) {
        console.error("❌ โหลดข้อมูลล้มเหลว:", err);
      } finally {
        setLoading(false);
      }
    };
    if (classId) fetchAttendance();
  }, [classId]);

  const handleDateChange = (e) => {
    const val = e.target.value;
    setSelectedDate(val);

    if (!val) return setFiltered(attendances);

    const matchDate = (scanTime) => {
      const d = new Date(scanTime);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}` === val;
    };

    const result = attendances.filter((rec) => matchDate(rec.scan_time));
    setFiltered(result);
  };

  return (
    <div className="container mt-4">
      <h3>📜 รายชื่อการเช็คชื่อ</h3>

      <div className="row mb-3">
        <div className="col-md-4">
          <label>📅 เลือกวันที่</label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={handleDateChange}
          />
        </div>
      </div>

      {loading ? (
        <p>⏳ กำลังโหลด...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted">❗ ยังไม่มีการเช็คชื่อ</p>
      ) : (
        <table className="table table-bordered mt-3">
          <thead className="table-light">
            <tr>
              <th>ชื่อ</th>
              <th>รหัส</th>
              <th>วันที่</th>
              <th>เวลา</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rec, idx) => {
              const statusClass =
                rec.status === "Present"
                  ? "success"
                  : rec.status === "Late"
                  ? "warning"
                  : "danger";

              return (
                <tr key={idx} className={`table-${statusClass}`}>
                  <td>{rec.fullName}</td>
                  <td>{rec.studentId}</td>
                  <td>{new Date(rec.scan_time).toLocaleDateString("th-TH")}</td>
                  <td>{new Date(rec.scan_time).toLocaleTimeString()}</td>
                  <td>
                    <span className={`badge bg-${statusClass}`}>
                      {rec.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <button className="btn btn-secondary mt-3" onClick={() => navigate(-1)}>
        🔙 กลับ
      </button>
    </div>
  );
};

export default ClassHistoryDetail;
