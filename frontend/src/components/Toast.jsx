import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-notification toast-${type}`}>
      {type === 'success' ? (
        <CheckCircle2 size={18} className="text-emerald-400" />
      ) : (
        <AlertCircle size={18} className="text-red-400" />
      )}
      <span className="toast-message">{message}</span>
      <button type="button" className="toast-close" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
};
