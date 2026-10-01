import React, { useEffect, useMemo, useState } from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';
import { api } from '../api';

interface MissionsMapViewProps {
  theme: ThemeMode;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onShowToast: (msg: string) => void;
}

type Subject = { id:string; key:string; displayName:string; status:'ACTIVE'|'FUTURE'; ordering:number };
type Mission = {
  id:string; slug:string; title:string; mission:string; role?:string|null; problemType?:string|null;
  subject:Subject;
  currentPublishedVersion?:{
    id:string; version:number; contentMetadata?:any;
    levels:Array<{id:string;levelNumber:number;title:string;rewardXp:number;rewardCoins:number;questions:any[]}>;
  }|null;
  levelsCount:number;
  progressStatus?:string;
  unlocked?:boolean;
};

export const MissionsMapView: React.FC<MissionsMapViewProps> = ({
  theme,
  onNavigate,
  onShowToast,
}) => {
  const isDark = theme === 'dark';
  const [subjects,setSubjects]=useState<Subject[]>([]);
  const [futureSubjects,setFutureSubjects]=useState<Subject[]>([]);
  const [missions,setMissions]=useState<Mission[]>([]);
  const [selectedSubjectKey,setSelectedSubjectKey]=useState(()=>localStorage.getItem('nextess_selected_subject')||'');
  const [selectedKey,setSelectedKey]=useState('');
  const [previewMission,setPreviewMission]=useState<Mission|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        const result=await api.subjects();
        const all=(result.subjects||[]) as Subject[];
        const active=all.filter(s=>s.status==='ACTIVE').sort((a,b)=>a.ordering-b.ordering);
        const future=all.filter(s=>s.status==='FUTURE').sort((a,b)=>a.ordering-b.ordering);
        const preferred=active.find(s=>s.key.toLowerCase()===selectedSubjectKey.toLowerCase())||active[0];
        if(!preferred){if(!cancelled){setSubjects(active);setFutureSubjects(future);setMissions([]);setLoading(false)};return}
        if(preferred.key!==selectedSubjectKey){setSelectedSubjectKey(preferred.key);localStorage.setItem('nextess_selected_subject',preferred.key)}
        const projectResult=await api.projects(preferred.id);
        if(!cancelled){setSubjects(active);setFutureSubjects(future);setMissions((projectResult.projects||[]) as Mission[]);setSelectedKey((projectResult.projects||[])[0]?.id||'');setLoading(false)}
      }catch{
        if(!cancelled){setLoading(false);setMissions([]);onShowToast('Mission catalogue could not be loaded from the database.')}
      }
    })();
    return ()=>{cancelled=true};
  },[onShowToast,selectedSubjectKey]);

  const selectedSubject=useMemo(()=>subjects.find(s=>s.key.toLowerCase()===selectedSubjectKey.toLowerCase())||subjects[0],[subjects,selectedSubjectKey]);
  const selectedMission=useMemo(()=>missions.find(m=>m.id===selectedKey)||missions[0],[missions,selectedKey]);
  const rewards=useMemo(()=>{
    const levels=selectedMission?.currentPublishedVersion?.levels||[];
    return {xp:levels.reduce((n,l)=>n+(Number(l.rewardXp)||0),0),coins:levels.reduce((n,l)=>n+(Number(l.rewardCoins)||0),0)};
  },[selectedMission]);
  const concepts=useMemo(()=>((selectedMission?.currentPublishedVersion?.contentMetadata?.learningCapsule?.sections||[]) as any[]).map(s=>s.title).filter(Boolean),[selectedMission]);
  const selectSubject=(subject:Subject)=>{setSelectedSubjectKey(subject.key);localStorage.setItem('nextess_selected_subject',subject.key);setSelectedKey('');setLoading(true)};


  const openMission = (mission: Mission) => {
    if (!missions.some((item) => item.id === mission.id)) { onShowToast('Invalid mission selection.'); return; }
    if (mission.unlocked === false) { onShowToast('Complete the previous mission before starting this one.'); return; }
    localStorage.setItem('nextess_selected_mission', mission.id);
    localStorage.removeItem('nextess_mission_stage');
    onNavigate('mission-detail');
  };

  return (
    <div className="flex flex-col w-full pb-20">
      <div className="py-2 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.9)] animate-pulse" />
            <button
              onClick={() => onNavigate('disciplines')}
              className="font-mono text-xs uppercase tracking-wider text-violet-400 hover:underline flex items-center gap-1"
            >
              <span>← All Disciplines</span><span>/</span><span>Curriculum Path</span>
            </button>
          </div>
          <h1 className={`font-headline-lg text-2xl md:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Missions Path
          </h1>
        </div>
        <div className={`flex items-center gap-2 self-start md:self-auto px-4 py-2 rounded-xl border ${isDark ? 'bg-[#12131b] border-violet-500/30 text-white shadow-md' : 'bg-white border-violet-200 text-slate-800 shadow-sm'}`}>
          <span className="material-symbols-outlined text-[20px] text-violet-400">science</span>
          <div className="flex flex-col text-left">
            <span className="font-mono text-xs font-bold leading-tight">{selectedSubject?.displayName || 'Mission Catalogue'}</span>
            <span className="text-[10px] text-slate-400">{missions.length} published mission files</span>
          </div>
        </div>
      </div>

      {subjects.length > 1 && (
        <div className={`flex flex-wrap gap-2 p-2 mb-5 rounded-2xl border ${isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'}`}>
          {subjects.map(subject => (
            <button key={subject.id} onClick={() => selectSubject(subject)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${selectedSubject?.id === subject.id ? 'bg-violet-600 text-white shadow-sm' : isDark ? 'text-slate-400 hover:text-white hover:bg-[#181926]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
              {subject.displayName}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className={`rounded-2xl border p-8 ${isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'}`}>
          <p className="text-sm text-slate-400">Loading published missions…</p>
        </div>
      )}

      {!loading && (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start relative">
        <div className="xl:col-span-7 flex flex-col items-center relative py-4 min-h-[700px]">
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="nextessMissionPath" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#8b5cf6" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#4338ca" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            <path d="M 180 90 C 180 160, 420 180, 420 300 S 170 440, 170 560 S 390 680, 390 800" fill="none" stroke="url(#nextessMissionPath)" strokeWidth="4" strokeDasharray="8 6" />
          </svg>

          {missions.map((mission, index) => {
            const left = index % 2 === 0;
            const selected = mission.id === selectedKey;
            const number = String(index + 1).padStart(2, '0');
            return (
              <div
                key={mission.id}
                className={`relative z-10 w-full flex ${left ? 'justify-start pl-4 md:pl-16' : 'justify-end pr-4 md:pr-16'} mb-20`}
              >
                <button
                  onClick={() => { setSelectedKey(mission.id); setPreviewMission(mission); }}
                  className="group relative flex items-center gap-4 text-left"
                  aria-label={`Select mission ${mission.title}`}
                >
                  <div className={`relative ${!left ? 'order-2' : ''}`}>
                    {selected && <div className="absolute -inset-2.5 rounded-full bg-violet-500/20 blur-lg animate-pulse" />}
                    <div
                      className={`relative rounded-full border flex items-center justify-center transition-transform group-hover:scale-105 ${selected ? 'ring-4 ring-violet-500/40 scale-105' : ''} ${isDark ? 'bg-[#181926] border-violet-400/40 shadow-xl' : 'bg-white border-violet-300 shadow-md'}`}
                      style={{ width: index === 0 ? 82 : 72, height: index === 0 ? 82 : 72 }}
                    >
                      <div className={`rounded-full flex flex-col items-center justify-center ${isDark ? 'bg-[#12131b] text-violet-300' : 'bg-violet-50 text-violet-800'}`} style={{ width: index === 0 ? 62 : 54, height: index === 0 ? 62 : 54 }}>
                        <span className="font-mono text-[10px] text-violet-400 font-bold">MISSION</span>
                        <span className="font-mono text-lg font-bold">{number}</span>
                      </div>
                    </div>
                    <span className={`absolute -bottom-1 -right-1 font-mono text-[9px] px-2 py-0.5 rounded-full font-bold shadow-md border ${mission.unlocked === false ? 'bg-slate-500 text-white border-slate-400/40' : mission.progressStatus === 'COMPLETED' ? 'bg-emerald-600 text-white border-emerald-400/40' : 'bg-violet-600 text-white border-violet-400/40'}`}>
                      {mission.unlocked === false ? 'LOCKED' : mission.progressStatus === 'COMPLETED' ? 'DONE' : mission.progressStatus === 'IN_PROGRESS' ? 'CONTINUE' : 'READY'}
                    </span>
                  </div>

                  <div className={`flex flex-col px-4 py-3 rounded-2xl shadow-xl max-w-xs border transition-all ${selected ? (isDark ? 'bg-[#181926] border-violet-400' : 'bg-white border-violet-400 ring-2 ring-violet-200') : (isDark ? 'bg-[#12131b]/95 border-violet-500/20' : 'bg-white/95 border-slate-200')}`}>
                    <div className={`flex items-center gap-1.5 mb-1 ${!left ? 'justify-end' : ''}`}>
                      <span className="font-mono text-[10px] text-violet-400 font-bold uppercase tracking-wider">
                        Mission {number} // {mission.progressStatus || 'NOT_STARTED'}
                      </span>
                    </div>
                    <span className={`font-bold text-sm leading-snug ${isDark ? 'text-white' : 'text-slate-900'} ${!left ? 'text-right' : ''}`}>
                      {mission.title}
                    </span>
                    <div className={`flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono ${!left ? 'justify-end' : ''}`}>
                      <span className="text-violet-400 font-semibold">{mission.currentPublishedVersion?.contentMetadata?.difficulty || 'Published'}</span>
                      <span>•</span>
                      <span>{mission.levelsCount} levels</span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <div className="xl:col-span-5 flex flex-col gap-4 sticky top-20">
          {selectedMission ? (
            <div className={`rounded-2xl p-5 border shadow-2xl flex flex-col gap-4 relative overflow-hidden ${isDark ? 'bg-[#12131b] border-violet-500/25' : 'bg-white border-violet-200 shadow-xl'}`}>
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 border border-violet-400/30 font-mono text-[10px] font-bold uppercase tracking-wider">
                      Mission File
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{selectedMission.subject.displayName.toUpperCase()}</span>
                  </div>
                  <h2 className={`font-headline-md text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedMission.title}</h2>
                </div>
                <span className={`px-2 py-1 rounded-lg border font-mono text-[9px] font-bold ${selectedMission.unlocked === false ? 'bg-slate-500/10 border-slate-400/20 text-slate-500' : selectedMission.progressStatus === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : selectedMission.progressStatus === 'IN_PROGRESS' ? 'bg-violet-500/10 border-violet-500/20 text-violet-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>{selectedMission.unlocked === false ? 'LOCKED' : selectedMission.progressStatus || 'NOT STARTED'}</span>
              </div>

              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedMission.mission}</p>

              <div className="grid grid-cols-2 gap-2">
                <div className={`rounded-xl p-3 border ${isDark ? 'bg-[#181926] border-violet-500/15' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-mono text-[9px] text-slate-400 uppercase">Role</span>
                  <span className={`block text-xs font-semibold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedMission.role}</span>
                </div>
                <div className={`rounded-xl p-3 border ${isDark ? 'bg-[#181926] border-violet-500/15' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-mono text-[9px] text-slate-400 uppercase">Mission Type</span>
                  <span className={`block text-xs font-semibold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedMission.problemType}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Levels in File</span>
                  <span className="font-mono text-[10px] text-violet-400">{selectedMission.levelsCount} levels</span>
                </div>
                <div className="flex flex-col gap-2">
                  {(selectedMission.currentPublishedVersion?.levels || []).map((level) => (
                    <div key={level.levelNumber} className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border ${isDark ? 'bg-[#181926] border-violet-500/15' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="min-w-0">
                        <span className="font-mono text-[9px] text-violet-400">LEVEL {level.levelNumber}</span>
                        <span className={`block text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{level.title}</span>
                      </div>
                      <span className="font-mono text-[9px] text-slate-500 shrink-0">{level.questions.length} questions</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className={`rounded-xl p-3 border ${isDark ? 'bg-[#181926] border-violet-500/15' : 'bg-violet-50 border-violet-200'}`}>
                  <span className="font-mono text-[9px] text-slate-400 uppercase">KP earned</span>
                  <span className="block text-lg font-bold text-violet-400 mt-1">+{rewards.xp}</span>
                </div>
                <div className={`rounded-xl p-3 border ${isDark ? 'bg-[#181926] border-amber-500/15' : 'bg-amber-50 border-amber-200'}`}>
                  <span className="font-mono text-[9px] text-slate-400 uppercase">Coins earned</span>
                  <span className="block text-lg font-bold text-amber-400 mt-1">+{rewards.coins}</span>
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider mb-2">Concepts used</div>
                {concepts.length ? (
                  <div className="flex flex-col gap-2">
                    {concepts.map((title:string) => (
                      <div key={title} className={`px-3 py-2 rounded-xl border text-xs font-semibold ${isDark ? 'bg-[#181926] border-violet-500/15 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>{title}</div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-500">No concept titles are published for this mission version.</p>}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-violet-500/15">
                <span className="font-mono text-[10px] text-slate-500">Click a mission node to inspect it.</span>
                <button
                  onClick={() => openMission(selectedMission)}
                  disabled={selectedMission.unlocked === false}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-[0_4px_0_#5b21b6] active:translate-y-0.5 transition-all"
                >
                  {selectedMission.unlocked === false ? 'Previous mission required' : selectedMission.progressStatus === 'IN_PROGRESS' ? 'Continue Mission' : 'Start Solving Mission'}
                </button>
              </div>

            </div>
          ) : (
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'}`}>
              <p className="text-sm text-slate-400">No mission files are available.</p>
            </div>
          )}
        </div>
      </div>
      )}

      {previewMission && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={previewMission.title}>
          <div className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${isDark ? 'bg-[#12131b] border-violet-500/30 text-white' : 'bg-white border-violet-200 text-slate-900'}`}>
            <div className="flex items-start justify-between gap-4">
              <div><span className="font-mono text-[10px] text-violet-400 uppercase">Mission {String(missions.findIndex(m=>m.id===previewMission.id)+1).padStart(2,'0')}</span><h2 className="text-xl font-bold mt-1">{previewMission.title}</h2></div>
              <button type="button" onClick={() => setPreviewMission(null)} className="p-1.5 text-slate-400" aria-label="Close mission details">✕</button>
            </div>
            <p className={`text-sm leading-6 mt-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{previewMission.mission}</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className={`rounded-xl border p-3 ${isDark ? 'bg-[#181926] border-violet-500/15' : 'bg-slate-50 border-slate-200'}`}><span className="font-mono text-[9px] text-slate-400 uppercase">Role</span><span className="block text-xs font-semibold mt-1">{previewMission.role || '—'}</span></div>
              <div className={`rounded-xl border p-3 ${isDark ? 'bg-[#181926] border-violet-500/15' : 'bg-slate-50 border-slate-200'}`}><span className="font-mono text-[9px] text-slate-400 uppercase">Concept used</span><span className="block text-xs font-semibold mt-1">{((previewMission.currentPublishedVersion?.contentMetadata?.learningCapsule?.sections || [])[0]?.title) || 'Mission concepts'}</span></div>
              <div className={`rounded-xl border p-3 ${isDark ? 'bg-[#181926] border-violet-500/15' : 'bg-violet-50 border-violet-200'}`}><span className="font-mono text-[9px] text-slate-400 uppercase">KP earned</span><span className="block text-lg font-bold text-violet-500 mt-1">+{(previewMission.currentPublishedVersion?.levels || []).reduce((n:any,l:any)=>n+(Number(l.rewardXp)||0),0)}</span></div>
              <div className={`rounded-xl border p-3 ${isDark ? 'bg-[#181926] border-amber-500/15' : 'bg-amber-50 border-amber-200'}`}><span className="font-mono text-[9px] text-slate-400 uppercase">Coins earned</span><span className="block text-lg font-bold text-amber-500 mt-1">+{(previewMission.currentPublishedVersion?.levels || []).reduce((n:any,l:any)=>n+(Number(l.rewardCoins)||0),0)}</span></div>
            </div>
            <div className="flex items-center justify-between gap-3 mt-5">
              <span className="text-xs text-slate-500">{previewMission.unlocked === false ? 'Locked until the previous mission is completed.' : previewMission.progressStatus === 'COMPLETED' ? 'Mission completed.' : previewMission.progressStatus === 'IN_PROGRESS' ? 'Mission in progress.' : 'Mission ready.'}</span>
              <button type="button" disabled={previewMission.unlocked === false} onClick={() => { setPreviewMission(null); openMission(previewMission); }} className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold disabled:opacity-40">{previewMission.progressStatus === 'IN_PROGRESS' ? 'Continue Mission' : 'Start Mission'}</button>
            </div>
          </div>
        </div>
      )}

      {futureSubjects.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-400">hourglass_top</span><h2 className={`font-headline-sm text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>UPCOMING DISCIPLINES</h2></div>
            <span className="font-mono text-[10px] text-slate-400">{futureSubjects.length} IN PIPELINE</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {futureSubjects.map(subject => (
              <button key={subject.id} onClick={() => onShowToast(`${subject.displayName} is in active development. Mission files are not published yet.`)}
                className={`text-left p-4 rounded-2xl border transition-all ${isDark ? 'bg-[#12131b] border-violet-500/20 hover:border-violet-400/40' : 'bg-white border-slate-200 hover:border-violet-300'}`}>
                <span className="material-symbols-outlined text-violet-400">hourglass_top</span>
                <h3 className={`font-semibold text-sm mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{subject.displayName}</h3>
                <p className="text-xs text-slate-400 mt-1">Future discipline · mission content coming later.</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
