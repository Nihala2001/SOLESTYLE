
import React from "react";
import { AlertTriangle } from "lucide-react";
import "./ConfirmationModal.css";

function ConfirmationModal({
  isOpen,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal">

        <div className="confirmation-modal-icon">
          <AlertTriangle size={50} />
        </div>

        <h2>{title}</h2>

        <p>{message}</p>

        <div className="confirmation-modal-actions">

          <button
            className="confirmation-cancel-button"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            className="confirmation-confirm-button"
            onClick={onConfirm}
          >
            {confirmText}
          </button>

        </div>

      </div>
    </div>
  );
}

export default ConfirmationModal;
