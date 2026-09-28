import React, { useEffect, useMemo, useState } from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';
import missionsPackage from '../data/missions.json';

interface MissionsMapViewProps {
  theme: ThemeMode;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onShowToast: (msg: string) => void;
}

type Mission = { id:string; slug:string; title:string; mission:string; role?:string|null; problemType?:string|null; subject:{key:string;displayName:string}; currentPublishedVersion?:{id:string;version:number;contentMetadata?:any;levels:{id:string;levelNumber:number;title:string;questions:{id:string}[]}[]}|null; levelsCount:number; };

export const MissionsMapView: React.FC<MissionsMapViewProps> = ({
  theme,
  onNavigate,
  onShowToast,
}) => {
  const isDark = theme === 'dark';
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  useEffect(() => {
    // Mission catalogue is intentionally sourced from the versioned embedded package.
    // Do not depend on the backend just to render the mission map.
    const projects = Array.isArray(missionsPackage.projects) ? missionsPackage.projects : [];
    const rows: Mission[] = projects.map((project) => ({
      id: project.key,
      slug: project.key,
      title: project.title,
      mission: project.mission,
      role: project.role ?? null,
      problemType: project.problemType ?? null,
      subject: {
        key: project.subject,
        displayName: project.subject.charAt(0).toUpperCase() + project.subject.slice(1),
      },
      currentPublishedVersion: {
        id: `${project.key}:v${project.version}`,
        version: project.version,
        contentMetadata: {
          difficulty: project.difficulty,
          estimatedLength: project.estimatedLength,
          learningCapsule: project.learningCapsule,
          requiredEvidence: project.requiredEvidence,
          requiredSimulation: project.requiredSimulation,
        },
        levels: (project.levels || []).map((level) => ({
          id: `${project.key}:level:${level.number}`,
          levelNumber: level.number,
          title: level.title,
          questions: level.questions || [],
        })),
      },
      levelsCount: project.levels?.length ?? 0,
    }));

    setMissions(rows);
    setSelectedKey(rows[0]?.id || '');
  }, []);
  const selectedMission = useMemo(
    () => missions.find((mission) => mission.id === selectedKey) ?? missions[0],
    [missions, selectedKey],
  );

  const openMission = (mission: Mission) => {
    // Only IDs from the embedded catalogue are accepted; this prevents arbitrary
    // localStorage values from becoming mission identifiers.
    if (!missions.some((item) => item.id === mission.id)) {
      onShowToast('Invalid mission selection.');
      return;
    }
    localStorage.setItem('nextess_selected_mission', mission.id);
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
            <span className="font-mono text-xs font-bold leading-tight">Mission Catalogue</span>
            <span className="text-[10px] text-slate-400">{missions.length} published mission files</span>
          </div>
        </div>
      </div>

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
                  onClick={() => setSelectedKey(mission.id)}
                  onDoubleClick={() => openMission(mission)}
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
                    <span className="absolute -bottom-1 -right-1 bg-violet-600 text-white font-mono text-[9px] px-2 py-0.5 rounded-full font-bold shadow-md border border-violet-400/40">
                      READY
                    </span>
                  </div>

                  <div className={`flex flex-col px-4 py-3 rounded-2xl shadow-xl max-w-xs border transition-all ${selected ? (isDark ? 'bg-[#181926] border-violet-400' : 'bg-white border-violet-400 ring-2 ring-violet-200') : (isDark ? 'bg-[#12131b]/95 border-violet-500/20' : 'bg-white/95 border-slate-200')}`}>
                    <div className={`flex items-center gap-1.5 mb-1 ${!left ? 'justify-end' : ''}`}>
                      <span className="font-mono text-[10px] text-violet-400 font-bold uppercase tracking-wider">
                        Mission {number} // Not Started
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
                <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[9px] font-bold">NOT STARTED</span>
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

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-violet-500/15">
                <span className="font-mono text-[10px] text-slate-500">Double-click a mission node or use the button.</span>
                <button
                  onClick={() => openMission(selectedMission)}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-[0_4px_0_#5b21b6] active:translate-y-0.5 transition-all"
                >
                  View Mission File
                </button>
              </div>

              <button
                onClick={() => onShowToast('Mission execution is not connected yet. This view is using the published mission file only.')}
                className={`text-[10px] font-mono text-left ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Execution chamber: placeholder until the mission backend is connected.
              </button>
            </div>
          ) : (
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'}`}>
              <p className="text-sm text-slate-400">No mission files are available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
