import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    success: <CheckCircle2 size={18} className="toast-icon success" />,
    error: <AlertCircle size={18} className="toast-icon error" />,
    info: <Info size={18} className="toast-icon info" />,
  };

  return (
    <aside className="toast-container" aria-live="assertive" role="alert">
      <div className={`toast toast-${type}`}>
        <div className="toast-content">
          {icons[type] || icons.info}
          <span className="toast-message">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="toast-close"
          aria-label="Dismiss notification"
          type="button"
        >
          <X size={15} />
        </button>
      </div>
    </aside>
  );
};

export default Toast;
