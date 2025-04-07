import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allClasses, setAllClasses] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [enrolledClassIds, setEnrolledClassIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!user) return;
    if (!user.faceScanned) navigate("/save-face");
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [allClsRes, reqRes, approvedEnrollRes] = await Promise.all([
          API.get(`/classes`),
          API.get(`/enrollments/requests/${user._id}`),
          API.get(`/enrolls/enrolled/${user._id}`)
        ]);
        setAllClasses(allClsRes.data);
        setPendingRequests(reqRes.data);
        setEnrolledClassIds(approvedEnrollRes.data.map(e => e.classId.toString()));
      } catch (err) {
        console.error("❌ โหลดข้อมูลไม่สำเร็จ", err);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        API.get(`/search/classes?q=${searchTerm.trim()}`)
          .then(res => setSearchResults(res.data))
          .catch(() => setSearchResults([]));
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const handleRequestJoin = async (classId) => {
    try {
      await API.post("/enrollments", { student: user._id, classId });
      alert("✅ ส่งคำร้องแล้ว");
      setPendingRequests((prev) => [...prev, { classId }]);
    } catch (err) {
      alert("❌ ส่งคำร้องไม่สำเร็จ");
      console.error(err);
    }
  };

  const hasRequested = (clsId) =>
    pendingRequests.some((r) => {
      const id = typeof r.classId === "object" ? r.classId._id : r.classId;
      return id === clsId;
    });

  const joinedClasses = allClasses.filter(cls =>
    enrolledClassIds.includes(cls._id.toString())
  );

  const notJoinedClasses = allClasses.filter(cls =>
    !enrolledClassIds.includes(cls._id.toString())
  );

  const renderClassItem = (cls, showJoinButton = true, showEnterButton = true) => (
    <li key={cls._id} className="list-group-item d-flex justify-content-between align-items-center">
      <span>
        {cls.courseCode} - {cls.courseName} (Sec {cls.section}) | 👨‍🏫 {cls.teacherId?.fullName}
      </span>
      {showJoinButton && (
        <div className="d-flex align-items-center gap-2">
          {enrolledClassIds.includes(cls._id) ? (
            <>
              {showEnterButton && (
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => navigate(`/class/${cls._id}/checkin`)}
                >
                  🔓 เข้าห้องเรียน
                </button>
              )}
              <span className="text-success">✅ ได้เข้าร่วมแล้ว</span>
            </>
          ) : hasRequested(cls._id) ? (
            <span className="text-warning">⏳ รออนุมัติ</span>
          ) : (
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleRequestJoin(cls._id)}
            >
              ✉️ ขอเข้าร่วม
            </button>
          )}
        </div>
      )}
    </li>
  );

  return (
    <div className="container mt-4">
      <h2>🎓 Welcome {user.fullName}</h2>

      <div className="card p-4 shadow mt-3">
        <h4>{user.studentId} {user.fullName}</h4>
        <p>Email: {user.email}</p>
      </div>

      <input
        type="text"
        className="form-control my-4"
        placeholder="🔍 ค้นหาวิชา / รหัสวิชา / อาจารย์..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {searchResults.length > 0 && (
        <>
          <h4>🌍 ผลลัพธ์การค้นหา ({searchResults.length})</h4>
          <ul className="list-group mb-4">
            {searchResults.map(cls =>
              renderClassItem(cls, true, false) // ❌ ไม่โชว์ปุ่ม "เข้าห้องเรียน" ตรงนี้
            )}
          </ul>
        </>
      )}

      <h4 className="mt-4">✅ ห้องเรียนที่คุณเข้าร่วมแล้ว ({joinedClasses.length})</h4>
      <ul className="list-group mb-4">
        {joinedClasses.length > 0
          ? joinedClasses.map(cls => renderClassItem(cls, true, true))
          : <li className="list-group-item text-muted text-center">ไม่มีห้องที่เข้าร่วม</li>
        }
      </ul>

      <h4>⏳ ห้องเรียนที่รออนุมัติ / ยังไม่ได้เข้าร่วม</h4>
      <ul className="list-group mb-4">
        {notJoinedClasses.length > 0
          ? notJoinedClasses.map(cls => renderClassItem(cls, true, true))
          : <li className="list-group-item text-muted text-center">ไม่มีห้องที่ยังไม่ได้เข้าร่วม</li>
        }
      </ul>
    </div>
  );
};

export default StudentDashboard;
