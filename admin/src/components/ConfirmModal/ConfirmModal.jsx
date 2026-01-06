import React from 'react';
import ReactDOM from 'react-dom';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="confirm-modal-overlay">
      <div className="confirm-modal">
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button className="confirm-btn cancel" onClick={onClose}>Hủy</button>
          <button className="confirm-btn confirm" onClick={onConfirm}>Xác Nhận</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
