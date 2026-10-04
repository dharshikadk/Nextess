import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { ThemeMode } from '../types';

export type ContextualEventType = 'LEADERBOARD_NUDGE';
type ContextualEvent = { type: ContextualEventType; priority: number; payload: any };

const SESSION_KEY = 'nextess:contextual-nudge:leaderboard:shown';

const priority: Record<ContextualEventType, number> = {
  LEADERBOARD_NUDGE: 50,
};

interface Props {
  theme: ThemeMode;
  enabled: boolean;
  onNavigate: (page: 'leaderboard') => void;
}

export const ContextualEventManager: React.FC<Props> = ({ theme, enabled, onNavigate }) => {
  const [queue, setQueue] = useState<ContextualEvent[]>([]);
  const [active, setActive] = useState<ContextualEvent | null>(null);

  const enqueue = useCallback((event: ContextualEvent) => {
    setQueue((current) => {
      if (current.some((item) => item.type === event.type) || active?.type === event.type) return current;
      return [...current, event].sort((a, b) => b.priority - a.priority);
    });
  }, [active?.type]);

  useEffect(() => {
    if (!enabled || sessionStorage.getItem(SESSION_KEY) === '1') return;
    let cancelled = false;
    api.leaderboardNudge()
      .then((result) => {
        if (!cancelled && result?.data?.shouldShow) {
          enqueue({ type: 'LEADERBOARD_NUDGE', priority: priority.LEADERBOARD_NUDGE, payload: result.data });
        }
      })
      .catch(() => {
        // Contextual nudges are non-critical; dashboard rendering must continue.
      });
    return () => { cancelled = true; };
  }, [enabled, enqueue]);

  useEffect(() => {
    if (!active && queue.length) {
      const [next, ...rest] = queue;
      setQueue(rest);
      setActive(next);
      sessionStorage.setItem(SESSION_KEY, '1');
    }
  }, [active, queue]);

  if (!active || active.type !== 'LEADERBOARD_NUDGE') return null;
  const data = active.payload;
  const dark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog" aria-modal="true" aria-labelledby="leaderboard-nudge-title">
      <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${dark ? 'bg-[#12131b] border-cyan-500/30 text-white' : 'bg-white border-cyan-200 text-slate-900'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-cyan-500">Leaderboard proximity</div>
            <h2 id="leaderboard-nudge-title" className="text-2xl font-bold mt-1">{data.message?.title || "You're close to the top!"}</h2>
          </div>
          <button type="button" onClick={() => setActive(null)} aria-label="Close leaderboard notification"
            className="min-w-10 min-h-10 rounded-xl text-slate-500 hover:bg-slate-100/10 focus:outline-none focus:ring-2 focus:ring-cyan-400">✕</button>
        </div>
        <p className={`text-sm leading-6 mt-4 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
          {data.message?.body || `You need only ${data.difference?.xp ?? 0} XP and ${data.difference?.coins ?? 0} coins to reach the current top leaderboard position.`}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className={`rounded-2xl border p-4 text-center ${dark ? 'bg-violet-500/10 border-violet-500/25' : 'bg-violet-50 border-violet-200'}`}>
            <div className="font-mono text-[10px] uppercase text-violet-500">XP needed</div>
            <div className="text-xl font-bold mt-1">{data.difference?.xp ?? 0}</div>
          </div>
          <div className={`rounded-2xl border p-4 text-center ${dark ? 'bg-amber-500/10 border-amber-500/25' : 'bg-amber-50 border-amber-200'}`}>
            <div className="font-mono text-[10px] uppercase text-amber-500">Coins needed</div>
            <div className="text-xl font-bold mt-1">{data.difference?.coins ?? 0}</div>
          </div>
        </div>
        <button type="button" onClick={() => { setActive(null); onNavigate('leaderboard'); }}
          className="w-full mt-5 min-h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-300">
          View Leaderboard
        </button>
      </div>
    </div>
  );
};
