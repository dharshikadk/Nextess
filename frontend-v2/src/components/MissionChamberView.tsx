import React from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';

interface MissionChamberViewProps {
  theme: ThemeMode;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onAwardKP: (amount: number) => void;
  onShowToast: (msg: string) => void;
}

export const MissionChamberView: React.FC<MissionChamberViewProps> = ({ theme, onNavigate }) => {
  const isDark = theme === 'dark';
  return (
    <div className="flex flex-col w-full pb-20">
      <div className={`rounded-2xl p-6 border shadow-2xl ${isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-violet-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-violet-400">science</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-violet-400 font-bold">Mission Chamber</span>
        </div>
        <h1 className={`font-headline-lg text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Execution Chamber — Coming Soon</h1>
        <p className={`mt-3 text-sm leading-relaxed max-w-2xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          The mission execution engine is not connected yet. This placeholder intentionally contains no simulated questions, answers, progress, rewards, or fake investigation state.
        </p>
        <div className={`mt-5 p-4 rounded-xl border ${isDark ? 'bg-[#181926] border-violet-500/15' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="material-symbols-outlined text-amber-400 text-[18px]">construction</span>
            Backend/API integration pending
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Mission answers, evaluation, hints, simulations and completion rewards will be supplied by the real mission system.</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => onNavigate('missions-map')} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-[0_4px_0_#5b21b6]">Back to Missions</button>
          <button onClick={() => onNavigate('dashboard')} className={`px-4 py-2 rounded-xl border text-xs font-semibold ${isDark ? 'bg-[#181926] border-violet-500/20 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>Dashboard</button>
        </div>
      </div>
    </div>
  );
};
