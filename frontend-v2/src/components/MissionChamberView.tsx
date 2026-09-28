import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';
import { API_BASE, api } from '../api';

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
  const parsedStage = Number(localStorage.getItem('nextess_mission_stage') || '1');
  const stage = Number.isInteger(parsedStage) && parsedStage > 0 ? parsedStage : 1;
  const [mission, setMission] = useState<any|null>(null);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const stageIsValid = Boolean(mission && (stage === 1 || stage === 2 || mission.currentPublishedVersion?.levels?.some((level:any) => level.levelNumber + 2 === stage)));
  const effectiveStage = stageIsValid ? stage : 1;

  useEffect(() => {
    let cancelled=false;
    if(!missionId){setLoading(false);return;}
    api.project(missionId).then((result:any)=>{
      if(!cancelled)setMission(result.project||null);
    }).catch(()=>{if(!cancelled)setMission(null)}).finally(()=>{if(!cancelled)setLoading(false)});
    return ()=>{cancelled=true};
  },[missionId]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Accept control messages only from our own mission iframe and origin.
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'NEXTESS_MISSION_UPDATED') {
        window.dispatchEvent(new Event('nextess-mission-updated'));
      } else if (event.data.type === 'NEXTESS_MISSION_EXIT') {
        onNavigate('mission-detail');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onNavigate]);

  useEffect(() => {
    if (missionId && !mission) {
      localStorage.removeItem('nextess_selected_mission');
      localStorage.removeItem('nextess_mission_stage');
    } else if (mission && !stageIsValid) {
      localStorage.setItem('nextess_mission_stage', '1');
    }
  }, [missionId, mission, stageIsValid]);

  const src = useMemo(() => {
    const params = new URLSearchParams({ missionId, stage: String(effectiveStage), apiBase: API_BASE });
    return '/mission-stages-ui.html?' + params.toString();
  }, [missionId, effectiveStage]);

  if (loading) {
    return <div className="flex flex-col w-full pb-20"><div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'}`}><p className="text-sm text-slate-400">Loading mission stage...</p></div></div>;
  }

  if (!missionId || !mission) {
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
          ref={iframeRef}
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
        Back to Mission
      </button>
    </div>
  );
};
