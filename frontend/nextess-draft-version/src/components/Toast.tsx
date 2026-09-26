import React from 'react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-bounce-subtle">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#181926] text-white border border-violet-500/40 shadow-[0_4px_24px_rgba(139,92,246,0.35)] backdrop-blur-md">
        <span className="material-symbols-outlined text-violet-400 text-[20px] shrink-0">
          info
        </span>
        <span className="text-xs leading-snug flex-1 font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
