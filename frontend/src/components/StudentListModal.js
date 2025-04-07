import React from 'react';
import Modal from 'react-bootstrap/Modal';

export default function StudentListModal({ show, onClose, students = [] }) {
  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>📋 รายชื่อนักศึกษา ({students.length} คน)</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ul className="list-group">
          {students.map((s, idx) => (
            <li key={idx} className="list-group-item">
              <strong>{s.username}</strong> - {s.fullName}
            </li>
          ))}
        </ul>
      </Modal.Body>
    </Modal>
  );
}
