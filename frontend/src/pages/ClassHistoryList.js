// src/pages/ClassHistoryList.js
import React, { useEffect, useState } from "react";
import API from "../services/api";
import "bootstrap/dist/css/bootstrap.min.css";

const ClassHistoryList = () => {
  const [classes, setClasses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);

  const courseOptions = Array.from(
    new Map(classes.map((c) => [c.courseCode, `${c.courseCode} - ${c.courseName}`])).entries()
  );

  const sectionOptions = classes
    .filter((c) => c.courseCode === selectedCourse)
    .map((c) => ({ id: c._id, label: `ตอน ${c.section}` }));

  useEffect(() => {
    const fetchMyClasses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/classes/teacher", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses(res.data);
      } catch (err) {
        console.error("❌ ดึงคลาสของฉันล้มเหลว:", err);
      }
    };
    fetchMyClasses();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedSection) return setFiltered([]);
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/attendance/class/${selectedSection}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let data = res.data || [];

        if (selectedDate) {
          const filterDate = new Date(selectedDate).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });

          data = data.filter((rec) => {
            const local = new Date(rec.scan_time).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            });
            return local === filterDate;
          });
        }

        setFiltered(data);
      } catch (err) {
        console.error("❌ โหลดข้อมูลเช็คชื่อไม่สำเร็จ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedSection, selectedDate]);

  return (
    <div className="container mt-4">
      <h3>📘 รายชื่อการเช็คชื่อ</h3>

      <div className="row mb-3">
        <div className="col-md-4">
          <label>📚 เลือกรหัสวิชา</label>
          <select
            className="form-select"
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedSection("");
              setFiltered([]);
            }}
          >
            <option value="">-- เลือกวิชา --</option>
            {courseOptions.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label>🧾 เลือกตอนเรียน</label>
          <select
            className="form-select"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            disabled={!selectedCourse}
          >
            <option value="">-- เลือกตอน --</option>
            {sectionOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label>📅 เลือกวันที่</label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p>⏳ กำลังโหลด...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted">❗ ไม่พบข้อมูล</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>รหัส</th>
              <th>วันที่</th>
              <th>เวลา</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rec, i) => (
              <tr
                key={i}
                className={`table-${
                  rec.status === "Present"
                    ? "success"
                    : rec.status === "Late"
                    ? "warning"
                    : "danger"
                }`}
              >
                <td>{rec.fullName}</td>
                <td>{rec.studentId}</td>
                <td>{new Date(rec.scan_time).toLocaleDateString("th-TH")}</td>
                <td>{new Date(rec.scan_time).toLocaleTimeString()}</td>
                <td>
                  <span
                    className={`badge bg-${
                      rec.status === "Present"
                        ? "success"
                        : rec.status === "Late"
                        ? "warning"
                        : "danger"
                    }`}
                  >
                    {rec.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ClassHistoryList;
