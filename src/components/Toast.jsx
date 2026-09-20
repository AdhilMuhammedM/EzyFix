import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4 animate-slideUp">
      <div
        className={`flex items-center justify-between p-3 rounded-xl shadow-lg border text-xs font-medium ${
          isSuccess
            ? 'bg-[#072339] text-white border-[#0D3352]'
            : 'bg-red-800 text-white border-red-900'
        }`}
      >
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle className="w-4 h-4 text-[#FDB60C] flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-200 flex-shrink-0" />
          )}
          <span>{message}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-300 hover:text-white ml-2 p-0.5"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
