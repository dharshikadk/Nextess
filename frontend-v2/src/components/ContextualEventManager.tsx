import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { CONTEXTUAL_EVENT_PRIORITY, getContextualSessionKey, type ContextualEvent, type ContextualEventType } from '../contextualEvents.js';

export { CONTEXTUAL_EVENT_PRIORITY } from '../contextualEvents.js';

export function enqueueContextualEvent(event: Omit<ContextualEvent, 'priority'> & { priority?: number }) {
  window.dispatchEvent(new CustomEvent<ContextualEvent>('nextess-contextual-event', {
    detail: { ...event, priority: event.priority ?? CONTEXTUAL_EVENT_PRIORITY[event.type] },
  }));
}

function wasShown(type: ContextualEventType, userId: string) {
  try { return sessionStorage.getItem(getContextualSessionKey(type, userId)) === '1'; } catch { return false; }
}

function markShown(type: ContextualEventType, userId: string) {
  try { sessionStorage.setItem(getContextualSessionKey(type, userId), '1'); } catch { /* sessionStorage can be unavailable */ }
}

interface Props {
  theme: 'light' | 'dark';
  userId: string | null;
  canDisplay: boolean;
  onViewLeaderboard: () => void;
}

export const ContextualEventManager: React.FC<Props> = ({ theme, userId, canDisplay, onViewLeaderboard }) => {
  const [queue, setQueue] = useState<ContextualEvent[]>([]);
  const [current, setCurrent] = useState<ContextualEvent | null>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ContextualEvent>).detail;
      if (!detail?.type || !detail.dedupeKey) return;
      setQueue((existing) => {
        if (existing.some((item) => item.dedupeKey === detail.dedupeKey) || current?.dedupeKey === detail.dedupeKey) {
          return existing;
        }
        return [...existing, detail].sort((a, b) => b.priority - a.priority);
      });
    };
    window.addEventListener('nextess-contextual-event', handler);
    return () => window.removeEventListener('nextess-contextual-event', handler);
  }, [current?.dedupeKey]);

  useEffect(() => {
    if (!canDisplay || current || queue.length === 0) return;
    const next = queue[0];
    if (next.type === 'LEADERBOARD_NUDGE' && (!userId || wasShown(next.type, userId))) {
      setQueue((items) => items.slice(1));
      return;
    }
    setQueue((items) => items.slice(1));
    setCurrent(next);
    if (next.type === 'LEADERBOARD_NUDGE' && userId) markShown(next.type, userId);
  }, [canDisplay, current, queue, userId]);

  const close = useCallback(() => setCurrent(null), []);

  useEffect(() => {
    if (!current) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, close]);

  const leaderboardPayload = useMemo(() => current?.type === 'LEADERBOARD_NUDGE' ? current.payload : null, [current]);
  if (!current || current.type !== 'LEADERBOARD_NUDGE') return null;

  const difference = leaderboardPayload?.difference as { xp?: number; coins?: number } | undefined;
  const xp = Number(difference?.xp ?? 0);
  const coins = Number(difference?.coins ?? 0);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Close contextual notification"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-nudge-title"
        aria-describedby="leaderboard-nudge-body"
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border p-6 sm:p-7 shadow-2xl ${isDark ? 'bg-[#12131b] border-cyan-400/25 text-white' : 'bg-white border-cyan-200 text-slate-900'}`}
      >
        <button
          type="button"
          onClick={close}
          className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${isDark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
          aria-label="Close leaderboard notification"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="pr-10">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-500" aria-hidden="true">
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-500">Leaderboard proximity</div>
          <h2 id="leaderboard-nudge-title" className="mt-1 text-2xl font-bold tracking-tight">You're close to the top!</h2>
          <p id="leaderboard-nudge-body" className={`mt-3 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            You need only {xp} XP and {coins} coins to reach the current #1 leaderboard position.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className={`rounded-2xl border p-4 ${isDark ? 'border-cyan-400/15 bg-white/[0.04]' : 'border-slate-200 bg-slate-50'}`}>
            <div className="text-2xl font-bold tabular-nums">{xp}</div>
            <div className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>XP to top</div>
          </div>
          <div className={`rounded-2xl border p-4 ${isDark ? 'border-amber-400/15 bg-white/[0.04]' : 'border-slate-200 bg-slate-50'}`}>
            <div className="text-2xl font-bold tabular-nums">{coins}</div>
            <div className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Coins to top</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => { close(); onViewLeaderboard(); }}
            className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
          >
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};
