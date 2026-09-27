import React, { useEffect, useMemo } from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';
import { API_BASE } from '../api';

interface MissionChamberViewProps {
  theme: ThemeMode;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onAwardKP: (amount: number) => void;
  onShowToast: (msg: string) => void;
}

export const MissionChamberView: React.FC<MissionChamberViewProps> = ({ theme, onNavigate, onShowToast }) => {
  const isDark = theme === 'dark';
  const missionId = localStorage.getItem('nextess_selected_mission') || '';
  const stage = Number(localStorage.getItem('nextess_mission_stage') || '1');
  useEffect(() => { const handler = (event: MessageEvent) => { if (event.data?.type === 'NEXTESS_MISSION_UPDATED') window.dispatchEvent(new Event('nextess-mission-updated')); if (event.data?.type === 'NEXTESS_MISSION_EXIT') onNavigate('mission-detail'); }; window.addEventListener('message', handler); return () => window.removeEventListener('message', handler); }, [onNavigate]);

  const src = useMemo(() => {
    const params = new URLSearchParams({ missionId, stage: String(Number.isFinite(stage) ? stage : 1), apiBase: API_BASE });
    return '/mission-stages-ui.html?' + params.toString();
  }, [missionId, stage]);

  if (!missionId) {
    return (
      <div className="flex flex-col w-full pb-20">
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'}`}>
          <p className="text-sm text-slate-400">No mission stage is selected.</p>
          <button onClick={() => onNavigate('missions-map')} className="mt-4 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold">Back to Missions</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-20">
      <div className={`rounded-2xl overflow-hidden border shadow-2xl ${isDark ? 'bg-[#0d0e14] border-violet-500/20' : 'bg-white border-violet-200'}`}>
        <iframe
          key={src}
          title="Nextess Mission Stage"
          src={src}
          className="w-full min-h-[calc(100vh-120px)] border-0 block"
          allow="fullscreen"
          onLoad={() => {}}
        />
      </div>
      <button
        onClick={() => { onShowToast('Mission chamber closed.'); onNavigate('mission-detail'); }}
        className="mt-3 self-start px-4 py-2 rounded-xl border border-violet-500/20 bg-[#181926] text-slate-300 text-xs font-semibold"
      >
        Back to Mission File
      </button>
    </div>
  );
};
