import React from 'react';
import { ThemeMode } from '../types';

interface WindowPanelProps {
  open: boolean;
  onClose: () => void;
  theme: ThemeMode;
  title: string;
  ariaLabel?: string;
  children: React.ReactNode;
  maxWidth?: string;
  zIndex?: string;
}

export const WindowPanel: React.FC<WindowPanelProps> = ({
  open,
  onClose,
  theme,
  title,
  ariaLabel,
  children,
  maxWidth = 'max-w-md',
  zIndex = 'z-[100]',
}) => {
  if (!open) return null;
  const dark = theme === 'dark';

  return (
    <div
      className={`fixed inset-0 ${zIndex} bg-black/70 backdrop-blur-sm flex items-center justify-center p-4`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
    >
      <button
        type="button"
        aria-label={`Close ${title}`}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <section
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-3xl border p-7 shadow-2xl ${dark ? 'bg-[#12131b] border-violet-500/30 text-white' : 'bg-white border-violet-200 text-slate-900'}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title}`}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
        </button>
        <div className="pr-10">
          <div className="font-mono text-[10px] uppercase tracking-wider text-violet-400">{title}</div>
        </div>
        {children}
      </section>
    </div>
  );
};
