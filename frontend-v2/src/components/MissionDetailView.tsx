import React, { useEffect, useState } from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';
import { api } from '../api';

interface MissionDetailViewProps {
  theme: ThemeMode;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onShowToast: (msg: string) => void;
}

type Mission = any;

export const MissionDetailView: React.FC<MissionDetailViewProps> = ({ theme, onNavigate, onShowToast }) => {
  const isDark = theme === 'dark';
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<'capsule'|'metadata'|'files'|null>(null);

  useEffect(() => {
    let cancelled=false;
    const load=async()=>{
      const storedId=localStorage.getItem('nextess_selected_mission');
      if(!storedId){setMission(null);setLoading(false);return;}
      try{
        const result=await api.project(storedId);
        const selected=result.project;
        if(cancelled)return;
        if(!selected){setMission(null);setLoading(false);return;}
        const metadata=selected.currentPublishedVersion?.contentMetadata||{};
        setMission({
          ...selected,
          id:selected.id,
          version:selected.currentPublishedVersion?.version||metadata.version||1,
          subject:selected.subject,
          difficulty:metadata.difficulty||'Published',
          estimatedLength:metadata.estimatedLength||'',
          learningCapsule:metadata.learningCapsule||{title:'Learning Capsule',sections:[]},
          requiredEvidence:metadata.requiredEvidence||null,
          requiredSimulation:metadata.requiredSimulation||null,
          progress:result.progress||null,
          levels:(selected.currentPublishedVersion?.levels||[]).map((level:any)=>({
            ...level,
            number:level.levelNumber,
            evidenceUse:level.debrief?.evidenceUse||'Use the mission data provided for this level.',
            simulationUse:level.debrief?.simulationUse||'',
            questions:level.questions||[],
          })),
        });
      }catch{
        if(!cancelled)onShowToast('The selected mission could not be loaded from the database.');
      }finally{if(!cancelled)setLoading(false);}
    };
    load();
    return ()=>{cancelled=true};
  }, [onShowToast]);

  if (loading) return <div className="flex flex-col w-full pb-20"><div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'}`}><p className="text-sm text-slate-400">Loading published mission...</p></div></div>;

  if (!mission) {
    return (
      <div className="flex flex-col w-full pb-20">
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'}`}>
          <p className="text-sm text-slate-400">No mission file selected.</p>
          <button onClick={() => onNavigate('missions-map')} className="mt-4 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold">Back to Missions</button>
        </div>
      </div>
    );
  }

  const openStage = (stage:number) => {
    const validStage = stage === 1 || stage === 2 || mission.levels?.some((level: any) => level.number + 2 === stage);
    if (!validStage) {
      onShowToast('Invalid mission stage.');
      return;
    }
    localStorage.setItem('nextess_selected_mission', mission.id);
    localStorage.setItem('nextess_mission_stage', String(stage));
    onNavigate('mission-chamber');
  };

  const progressStatus=mission.progress?.status||'NOT_STARTED';
  const progressLabel=progressStatus==='COMPLETED'?'COMPLETED':progressStatus==='IN_PROGRESS'?'IN PROGRESS':'NOT STARTED';

  return (
    <div className="flex flex-col w-full pb-20">
      <div className="flex flex-col gap-3 mb-6 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <button onClick={() => onNavigate('disciplines')} className="hover:text-violet-400 transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">folder_open</span><span>Missions</span>
            </button>
            <span className="text-slate-600 font-mono text-[11px]">/</span>
            <button onClick={() => onNavigate('missions-map')} className="hover:text-violet-400 transition-colors">{mission.subject?.displayName || mission.subject}</button>
            <span className="text-slate-600 font-mono text-[11px]">/</span>
            <span className="text-violet-400 font-semibold font-mono">Mission File</span>
          </div>
          <button onClick={() => onNavigate('missions-map')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all ${isDark ? 'bg-[#181926] border-violet-500/20 hover:bg-[#1f2030] text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'}`}>
            <span className="material-symbols-outlined text-[18px] text-violet-400">alt_route</span><span>Back to Subject Missions Map</span>
          </button>
        </div>

        <div className={`relative overflow-hidden rounded-2xl p-6 border shadow-2xl transition-all ${isDark ? 'bg-[#12131b] border-violet-500/20 text-slate-200' : 'bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/70 border-purple-200 text-slate-800'}`}>
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex flex-col gap-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 font-mono text-[10px] uppercase font-semibold">Discipline: {mission.subject?.displayName || mission.subject}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono text-[10px] uppercase font-semibold">Difficulty: {mission.difficulty}</span>
              </div>
              <h1 className={`font-headline-lg text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{mission.title}</h1>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{mission.mission}</p>
            </div>
            <div className={`flex items-center gap-4 px-5 py-3 rounded-2xl border shrink-0 ${isDark ? 'bg-[#181926]/90 border-violet-500/20 backdrop-blur-md' : 'bg-white border-slate-200 shadow-md'}`}>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Mission Status</span>
                <span className={`font-headline-md text-xl font-bold ${progressStatus==='COMPLETED'?'text-emerald-400':progressStatus==='IN_PROGRESS'?'text-violet-400':'text-amber-400'}`}>{progressLabel}</span>
                <span className="text-xs text-slate-400 font-mono">{mission.levels.length} levels in published version</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-400 text-[20px]">stairs</span>
              <span className={`font-headline-sm text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Mission Stage Ladder</span>
            </div>
            <span className="font-mono text-xs text-slate-400">NODE CHAIN: {String(mission.levels.length + 2).padStart(2, '0')} UNITS</span>
          </div>

          <div className="relative flex flex-col gap-4">
            <div className="absolute left-7 top-8 bottom-8 w-0.5 bg-slate-700/30 z-0" />
            {[
              { stage:1, label:'Stage 01', title:'Mission Brief', meta:'Understand the mission objective before starting.' },
              { stage:2, label:'Stage 02', title:'Learning Capsule', meta:'Review the concepts needed for the investigation.' },
            ].map((stage) => (
              <button key={stage.stage} onClick={() => openStage(stage.stage)} className={`relative z-10 flex items-start gap-4 p-4 rounded-2xl border text-left transition-all w-full ${isDark ? 'bg-[#12131b]/95 border-violet-500/20 hover:bg-[#181926]' : 'bg-white border-slate-200 hover:border-violet-300 shadow-sm'}`}>
                <div className="w-11 h-11 rounded-full bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0 ring-4 ring-[#0d0e14]/50"><span className="font-mono text-xs font-bold">{String(stage.stage).padStart(2,'0')}</span></div>
                <div className="flex flex-col flex-1 gap-1 min-w-0">
                  <div className="flex items-center justify-between gap-2"><div><span className="font-mono text-[11px] font-bold text-violet-400 uppercase">{stage.label}</span><span className={`ml-2 font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{stage.title}</span></div><span className="px-2 py-0.5 rounded bg-slate-700/30 text-slate-400 font-mono text-[10px] font-semibold border border-slate-500/10">OPEN</span></div>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{stage.meta}</p>
                </div>
              </button>
            ))}
            {mission.levels.map((level: any) => (
              <button key={level.number} onClick={() => openStage(level.number + 2)} className={`relative z-10 flex items-start gap-4 p-4 rounded-2xl border text-left transition-all w-full ${isDark ? 'bg-[#12131b]/95 border-violet-500/20 hover:bg-[#181926]' : 'bg-white border-slate-200 hover:border-violet-300 shadow-sm'}`}>
                <div className="w-11 h-11 rounded-full bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0 ring-4 ring-[#0d0e14]/50"><span className="font-mono text-xs font-bold">{String(level.number + 2).padStart(2, '0')}</span></div>
                <div className="flex flex-col flex-1 gap-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0"><span className="font-mono text-[11px] font-bold text-violet-400 uppercase">Level {level.number}</span><span className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{level.title}</span></div>
                    <span className="px-2 py-0.5 rounded bg-slate-700/30 text-slate-400 font-mono text-[10px] font-semibold border border-slate-500/10">OPEN</span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{level.questions.length} questions • {level.evidenceUse || 'Use the mission data provided for this level.'}</p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-400"><span>{level.simulationUse ? 'Simulation required' : 'No simulation requirement specified'}</span><span>•</span><span>Click to open the mission stage.</span></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-4 sticky top-20">
          <div className="flex flex-col gap-2">
            {([
              ['metadata','Mission Metadata','badge'],
              ['capsule','Learning Capsule','menu_book'],
              ['files','Files','folder_copy'],
            ] as const).map(([key,label,icon]) => (
              <button key={key} type="button" onClick={() => setExpandedSection(expandedSection===key ? null : key)} className={`w-full flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all ${expandedSection===key ? (isDark ? 'bg-violet-500/10 border-violet-400/40' : 'bg-violet-50 border-violet-300') : (isDark ? 'bg-[#12131b] border-violet-500/20 hover:bg-[#181926]' : 'bg-white border-slate-200 hover:bg-slate-50')}`}>
                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-violet-400">{icon}</span><span className="text-sm font-bold">{label}</span></span>
                <span className="material-symbols-outlined text-[18px] text-slate-400">{expandedSection===key ? 'expand_less' : 'expand_more'}</span>
              </button>
            ))}
          </div>

          {expandedSection && (
            <div className={`rounded-2xl p-5 border shadow-xl ${isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'}`}>
              {expandedSection === 'metadata' && <div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15"><span className="font-mono text-[9px] text-slate-400">ROLE</span><span className="block text-xs font-semibold mt-1">{mission.role}</span></div>
                  <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15"><span className="font-mono text-[9px] text-slate-400">TYPE</span><span className="block text-xs font-semibold mt-1">{mission.problemType}</span></div>
                  <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15"><span className="font-mono text-[9px] text-slate-400">LENGTH</span><span className="block text-xs font-semibold mt-1">{mission.estimatedLength}</span></div>
                  <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15"><span className="font-mono text-[9px] text-slate-400">VERSION</span><span className="block text-xs font-semibold mt-1">{mission.version}</span></div>
                </div>
              </div>}
              {expandedSection === 'capsule' && <div>
                <h3 className="text-sm font-bold text-violet-400">{mission.learningCapsule.title}</h3>
                <div className="mt-3 flex flex-col gap-2">{mission.learningCapsule.sections.map((section: any) => <div key={section.title} className={`p-3 rounded-xl border ${isDark ? 'bg-[#181926] border-violet-500/15' : 'bg-slate-50 border-slate-200'}`}><span className="text-xs font-semibold">{section.title}</span><p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{section.content}</p></div>)}</div>
              </div>}
              {expandedSection === 'files' && <div>
                <p className="text-xs text-slate-400 mb-2">{mission.requiredEvidence?.instruction}</p>
                <div className="flex flex-col gap-2">{(mission.requiredEvidence?.files || []).map((file: any) => <div key={file.fileName} className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#181926] border-emerald-500/15' : 'bg-emerald-50 border-emerald-200'}`}><div className="text-xs font-semibold">{file.fileName}</div><div className="text-[10px] text-slate-400 mt-0.5">{file.purpose}</div></div>)}</div>
                {mission.requiredSimulation && <div className="mt-3 p-3 rounded-xl border border-violet-500/20 bg-violet-500/5"><span className="font-mono text-[9px] text-violet-400 uppercase">Required Simulation</span><div className="text-xs font-semibold mt-1">{mission.requiredSimulation.fileName}</div><p className="text-[10px] text-slate-400 mt-1">{mission.requiredSimulation.description}</p></div>}
              </div>}
            </div>
          )}

          <button
            onClick={() => openStage(progressStatus==='IN_PROGRESS' && mission.progress?.currentLevelId ? (mission.levels.find((l:any)=>l.id===mission.progress.currentLevelId)?.number||1)+2 : 1)}
            className="w-full py-3 rounded-xl bg-violet-600/80 text-white font-bold text-xs shadow-[0_4px_0_#5b21b6]"
          >
            {progressStatus==='IN_PROGRESS'?'Continue Mission':'Start Solving Mission'}
          </button>
        </div>
      </div>
    </div>
  );
};
