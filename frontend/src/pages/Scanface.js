// src/pages/Scanface.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as faceapi from "face-api.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";
import API from "../services/api";

const Scanface = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { classId } = useParams();

  const [session, setSession] = useState(null);
  const [message, setMessage] = useState("🔍 โปรดหันหน้าตรง แล้วกด 'เริ่มสแกนใบหน้า'");
  const [loading, setLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const stopCamera = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setMessage("❌ โปรดอนุญาตให้เว็บไซต์ใช้กล้องของคุณ");
    }
  };

  const loadModels = useCallback(async () => {
    try {
      setMessage("🔄 กำลังโหลดโมเดล...");
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);
      setMessage("📷 กล้องพร้อมแล้ว! กดปุ่มเพื่อเริ่มสแกน");
      startCamera();
    } catch {
      setMessage("❌ โหลดโมเดลไม่สำเร็จ");
    }
  }, []);

  useEffect(() => {
    loadModels();
    return () => stopCamera();
  }, [loadModels]);

  const fetchSession = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/checkin-sessions/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSession(res.data);
    } catch {
      setMessage("❌ ขณะนี้ยังไม่มี session เปิดอยู่ กรุณารออาจารย์");
    }
  }, [classId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const getGPSLocation = () =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => reject("❌ เข้าถึง GPS ไม่สำเร็จ")
      );
    });

  const handleNormalCheckin = async (payload, token) => {
    const res = await fetch("http://localhost:5000/api/attendance/checkin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "❌ เช็คชื่อไม่สำเร็จ");

    alert(`✅ เช็คชื่อสำเร็จ! ขอบคุณ ${payload.fullName}`);
    stopCamera();
    navigate("/student-dashboard");
  };

  const redirectToTeacherScan = (payload) => {
    alert("📣 สแกนใบหน้าอาจารย์เพื่อยืนยันตัวตนก่อนเช็คชื่อ");
    localStorage.setItem("studentDescriptor", JSON.stringify(payload));
    stopCamera();

    setTimeout(() => {
      navigate(`/verifyface-teacher/${classId}`, { replace: true });
    }, 200); // เพิ่ม delay เพื่อรอ stopCamera() เสร็จก่อน
  };

  const scanFace = async () => {
    if (!videoRef.current || !videoReady) {
      return setMessage("📷 รอกล้องโหลดให้เสร็จก่อน...");
    }
    if (!session) {
      return setMessage("❌ ไม่พบ session ที่เชื่อมกับห้องนี้");
    }

    setLoading(true);
    setMessage("🔎 กำลังตรวจจับใบหน้า...");

    const detections = await faceapi
      .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections.length) {
      setMessage("❌ ไม่พบใบหน้า กรุณาลองใหม่");
      setLoading(false);
      return;
    }

    const descriptorArray = Array.from(detections[0].descriptor);
    const token = localStorage.getItem("token");

    try {
      const { latitude, longitude } = await getGPSLocation();

      const findRes = await fetch("http://localhost:5000/auth/upload-face", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ faceDescriptor: descriptorArray }),
      });

      const findData = await findRes.json();
      if (!findRes.ok) throw new Error(findData.message || "❌ ไม่พบใบหน้าในระบบ");

      const payload = {
        studentId: findData.studentId,
        fullName: findData.fullName,
        latitude,
        longitude,
        sessionId: session._id,
        faceDescriptor: descriptorArray,
      };

      if (session.withTeacherFace) return redirectToTeacherScan(payload);

      await handleNormalCheckin(payload, token);
    } catch (error) {
      setMessage(error.message || "❌ เกิดข้อผิดพลาดในการเช็คชื่อ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container text-center mt-5">
      <h2>📸 สแกนใบหน้า</h2>
      <p>{message}</p>

      <div className="d-flex justify-content-center my-3">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          width="400"
          height="300"
          onLoadedData={() => setVideoReady(true)}
          className="rounded shadow"
          style={{ transform: "scaleX(-1)" }}
        />
      </div>

      <div className="d-flex justify-content-center gap-2">
        <button className="btn btn-success" onClick={scanFace} disabled={loading}>
          {loading ? "กำลังตรวจสอบ..." : "✅ เริ่มสแกนใบหน้า"}
        </button>
        <button className="btn btn-secondary" onClick={() => {
          stopCamera();
          navigate(-1);
        }}>
          🔙 กลับ
        </button>
      </div>
    </div>
  );
};

export default Scanface;
