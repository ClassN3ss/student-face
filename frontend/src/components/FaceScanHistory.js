import React, { useEffect, useState } from 'react';
import API from '../services/api';

export default function FaceScanHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    API.get('/attendance/history-student')
      .then(res => setHistory(res.data))
      .catch(err => console.error("❌ โหลด log ไม่สำเร็จ:", err));
  }, []);

  return (
    <div>
      <h5>📊 ประวัติการสแกนใบหน้า</h5>
      <table className="table table-striped table-sm">
        <thead>
          <tr>
            <th>นักศึกษา</th>
            <th>วันเวลา</th>
            <th>GPS</th>
            <th>วิชา</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h, idx) => (
            <tr key={idx}>
              <td>{h.userId?.fullName || '-'}</td>
              <td>{h.date} {h.time}</td>
              <td>{h.location?.lat}, {h.location?.lng}</td>
              <td>{h.classId?.courseName || '-'}</td>
            </tr>
          ))}
          {history.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center text-muted">ไม่มีประวัติ</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
