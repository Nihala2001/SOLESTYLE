
import React, { useEffect } from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";
import "./NotificationModal.css";

function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type = "success",
  duration = 2000,
}) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isOpen, onClose, duration]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="notification-modal-overlay">
      <div className="notification-modal">

        <div className={`notification-modal-icon ${type}`}>
          {type === "success" && <CheckCircle size={50} />}
          {type === "error" && <XCircle size={50} />}
          {type === "info" && <Info size={50} />}
        </div>

        <h2>{title}</h2>

        <p>{message}</p>

      </div>
    </div>
  );
}

export default NotificationModal;
