import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

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
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');

    const focusInitial = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first || panel).focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (!focusables.length) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const frame = window.requestAnimationFrame(focusInitial);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      root?.removeAttribute('inert');
      if (previousActive?.isConnected) previousActive.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  const dark = theme === 'dark';

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndex} bg-black/70 backdrop-blur-sm flex items-center justify-center p-4`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panelRef}
        tabIndex={-1}
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
    </div>,
    document.body,
  );
};
