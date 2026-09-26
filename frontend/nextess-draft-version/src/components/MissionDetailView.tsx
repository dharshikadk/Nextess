import React, { useState } from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';

interface MissionDetailViewProps {
  theme: ThemeMode;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onShowToast: (msg: string) => void;
}

interface LadderStageInfo {
  id: number;
  stage: string;
  name: string;
  description: string;
  kp: number;
  coins: number;
  status: string;
  structure: string;
  levelNumber?: number;
}

const LADDER_STAGES_INFO: Record<number, LadderStageInfo> = {
  1: {
    id: 1,
    stage: 'Stage 01',
    name: 'Mission Briefing Dossier',
    description: 'Role: Chief Structural Analyst • Situation telemetry dossier, crisis background, and technical specifications.',
    kp: 15,
    coins: 5,
    status: 'COMPLETED / REVIEWABLE',
    structure: 'Technical Specifications & Telemetry Logs',
  },
  2: {
    id: 2,
    stage: 'Stage 02',
    name: 'The Learning Capsule: Harmonic Resonance Fundamentals',
    description: '6-card interactive micro-capsule explaining natural frequency, damping coefficient, and aeroelastic resonance.',
    kp: 20,
    coins: 10,
    status: 'COMPLETED',
    structure: 'Micro-Capsule & Concept Verification',
  },
  3: {
    id: 3,
    stage: 'Stage 03',
    name: 'Level 1: Vortex Shedding & Wind Vectors',
    description: '5 Challenges (MCQ & Numerical) • Embedded Fluid Dynamics Airfoil Simulation. Mastered with zero anomalies.',
    kp: 35,
    coins: 15,
    status: '100% MASTERY (Score: 500/500)',
    structure: '5 Progressive Numerical Challenges & Airfoil Sandbox',
    levelNumber: 1,
  },
  4: {
    id: 4,
    stage: 'Stage 04',
    name: 'Level 2: Dynamic Harmonic Damping & Mass Dampers',
    description: '5 Challenges (Live Staking) • Embedded Euler-Bernoulli Beam & Tuned Mass Damper Live Simulation.',
    kp: 40,
    coins: 20,
    status: 'ACTIVE CHAMBER (Challenge 3 of 5 In-Progress)',
    structure: '5 Core Challenges & Euler-Bernoulli Sandbox',
    levelNumber: 2,
  },
  5: {
    id: 5,
    stage: 'Stage 05',
    name: 'Level 3: Crosswind Velocity & Torsional Flutter',
    description: '5 Challenges • Multi-axis Bridge Torsion Simulation. Unlocks upon completing Level 2 with acceptable divergence factor.',
    kp: 45,
    coins: 25,
    status: 'LOCKED (Prerequisite: Level 2 Cleared)',
    structure: '5 Advanced Challenges & Multi-axis Torsion Lab',
    levelNumber: 3,
  },
  6: {
    id: 6,
    stage: 'Stage 06',
    name: 'Level 4: Critical Resonance Thresholds & Stress Limits',
    description: '5 Challenges (High Entropy Numericals) • Real-time Stress & Strain Finite Element Simulation.',
    kp: 50,
    coins: 30,
    status: 'LOCKED (Prerequisite: Level 3 Cleared)',
    structure: '5 High-Entropy Challenges & Finite Element Stress Lab',
    levelNumber: 4,
  },
  7: {
    id: 7,
    stage: 'Stage 07',
    name: 'Level 5: Mission Synthesis & Final Certification Exam',
    description: '5 Comprehensive System Challenges • Full-scale Bridge Collapse Stress Test Simulation. Unlocks Harmonic Guardian Badge.',
    kp: 70,
    coins: 50,
    status: 'APEX CERTIFICATION (Locked)',
    structure: '5 Apex Certification Challenges & Defense Exam',
    levelNumber: 5,
  },
};

export const MissionDetailView: React.FC<MissionDetailViewProps> = ({
  theme,
  stats,
  onNavigate,
  onShowToast,
}) => {
  const isDark = theme === 'dark';
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [ladderCircleModal, setLadderCircleModal] = useState<LadderStageInfo | null>(null);

  const handleStageCircleClick = (stageId: number) => {
    setLadderCircleModal(LADDER_STAGES_INFO[stageId]);
  };

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Top Navigation & Path Tracker */}
      <div className="flex flex-col gap-3 mb-6 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <button
              onClick={() => onNavigate('disciplines')}
              className="hover:text-violet-400 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">folder_open</span>
              <span>Missions</span>
            </button>
            <span className="text-slate-600 font-mono text-[11px]">/</span>
            <button
              onClick={() => onNavigate('missions-map')}
              className="hover:text-violet-400 transition-colors"
            >
              Classical &amp; Quantum Physics
            </button>
            <span className="text-slate-600 font-mono text-[11px]">/</span>
            <span className="text-violet-400 font-semibold font-mono">Mission 01</span>
          </div>

          <button
            onClick={() => onNavigate('missions-map')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all ${
              isDark
                ? 'bg-[#181926] border-violet-500/20 hover:bg-[#1f2030] text-slate-300'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] text-violet-400">alt_route</span>
            <span>Back to Subject Missions Map</span>
          </button>
        </div>

        {/* Mission Header Card */}
        <div
          className={`relative overflow-hidden rounded-2xl p-6 border shadow-2xl transition-all ${
            isDark
              ? 'bg-[#12131b] border-violet-500/20 text-slate-200'
              : 'bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/70 border-purple-200 text-slate-800'
          }`}
        >
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex flex-col gap-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 font-mono text-[10px] uppercase font-semibold">
                  Discipline: Physics
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono text-[10px] uppercase font-semibold">
                  Difficulty: Intermediate Tier 2
                </span>
              </div>
              <h1 className={`font-headline-lg text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Mission 01: Bridge Stability &amp; Resonance
              </h1>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Reconcile mechanical oscillator frequencies to prevent catastrophic Tacoma Narrows aeroelastic flutter.
              </p>
            </div>

            <div
              className={`flex items-center gap-4 px-5 py-3 rounded-2xl border shrink-0 ${
                isDark ? 'bg-[#181926]/90 border-violet-500/20 backdrop-blur-md' : 'bg-white border-slate-200 shadow-md'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                  Overall Progress
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-headline-md text-xl text-violet-400 font-bold">60%</span>
                  <span className="text-xs text-slate-400 font-mono">Level 2 of 5</span>
                </div>
                <div className="w-32 h-2 rounded-full bg-slate-700/30 overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.5)]"
                    style={{ width: '60%' }}
                  />
                </div>
              </div>

              <div className="h-8 w-px bg-slate-700/30" />

              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                  Total Bounty
                </span>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                  <span className="text-violet-400 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[16px]">bolt</span> 180 KP
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-500 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[16px]">monetization_on</span> 50
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Briefing Modal / Alert Overlay */}
      {briefingOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`max-w-xl w-full rounded-2xl p-6 border shadow-2xl ${
              isDark ? 'bg-[#181926] border-violet-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-400 text-[24px]">task_alt</span>
                <h3 className="font-bold text-lg">Stage 01: Mission Briefing Dossier</h3>
              </div>
              <button
                onClick={() => setBriefingOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            <div className="text-xs space-y-3 leading-relaxed text-slate-300">
              <p>
                <strong>Role:</strong> Chief Structural Analyst.
              </p>
              <p>
                <strong>Situation Telemetry:</strong> An 850m suspension bridge deck is exhibiting torsional divergent flutter in moderate crosswinds (V = 45 m/s). Baseline modal frequency is calibrated at 2.12 Hz with Strouhal vortex shedding matching deck width harmonics.
              </p>
              <p>
                <strong>Mission Mandate:</strong> Install tuned mass dampers and verify critical damping ratio (ζ &gt; 0.05) to eliminate Tacoma-style torsional mode bifurcation before catastrophic structural fatigue occurs.
              </p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setBriefingOpen(false)}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white font-semibold text-xs"
              >
                Close Briefing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Architecture Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ladder Progression Architecture (7 Stages) */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-400 text-[20px]">stairs</span>
              <span className={`font-headline-sm text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Ladder Progression Architecture
              </span>
            </div>
            <span className="font-mono text-xs text-slate-400">NODE CHAIN: 07 UNITS</span>
          </div>

          {/* Linear Ladder Steps Container */}
          <div className="relative flex flex-col gap-4">
            {/* Continuous Vertical Connector Line */}
            <div className="absolute left-7 top-8 bottom-8 w-0.5 bg-slate-700/30 z-0">
              <div className="w-full h-1/2 bg-gradient-to-b from-violet-500 to-transparent" />
            </div>

            {/* Step 01: Mission Briefing Dossier */}
            <div
              className={`relative z-10 flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                isDark
                  ? 'bg-[#12131b]/95 border-violet-500/20 hover:bg-[#181926]'
                  : 'bg-white border-slate-200 hover:border-violet-300 shadow-sm'
              }`}
            >
              <div
                onClick={() => handleStageCircleClick(1)}
                title="Click circle to view rewards"
                className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 ring-4 ring-[#0d0e14]/50 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[24px]">task_alt</span>
              </div>
              <div className="flex flex-col flex-1 gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-violet-400 uppercase">Stage 01</span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Mission Briefing Dossier
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-semibold border border-emerald-500/20">
                    COMPLETED / REVIEWABLE
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Role: Chief Structural Analyst • Situation telemetry dossier, crisis background, and attached technical specifications (Bridge_Stability.pdf, Vibration_Data.csv). Review anytime without penalty.
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => setBriefingOpen(true)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      isDark ? 'bg-[#181926] border-violet-500/20 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">visibility</span>
                    <span>Re-read Briefing</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 02: The Learning Capsule */}
            <div
              className={`relative z-10 flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                isDark
                  ? 'bg-[#12131b]/95 border-violet-500/20 hover:bg-[#181926]'
                  : 'bg-white border-slate-200 hover:border-violet-300 shadow-sm'
              }`}
            >
              <div
                onClick={() => handleStageCircleClick(2)}
                title="Click circle to view rewards"
                className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 ring-4 ring-[#0d0e14]/50 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[24px]">menu_book</span>
              </div>
              <div className="flex flex-col flex-1 gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-violet-400 uppercase">Stage 02</span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      The Learning Capsule: Harmonic Resonance Fundamentals
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono text-[10px] font-semibold border border-amber-500/20">
                      +20 KP Claimed
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-700/30 text-slate-400 font-mono text-[10px]">
                      COMPLETED
                    </span>
                  </div>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Concise 6-card interactive micro-capsule explaining natural frequency, damping coefficient, and aeroelastic resonance with tap-and-continue clarity. Skip option available for advanced cadets.
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => onShowToast('Capsule review unlocked (-10 Coins). Tap continue in Chamber.')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      isDark ? 'bg-[#181926] border-violet-500/20 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">replay</span>
                    <span>Review Capsule (-10 Coins)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 03: Level 1 (Completed 100%) */}
            <div
              className={`relative z-10 flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                isDark
                  ? 'bg-[#12131b]/95 border-violet-500/20 hover:bg-[#181926]'
                  : 'bg-white border-slate-200 hover:border-violet-300 shadow-sm'
              }`}
            >
              <div
                onClick={() => handleStageCircleClick(3)}
                title="Click circle to view rewards"
                className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 ring-4 ring-[#0d0e14]/50 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div className="flex flex-col flex-1 gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-violet-400 uppercase">Stage 03</span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Level 1: Vortex Shedding &amp; Wind Vectors
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-mono text-[10px] font-semibold">
                      +35 KP Earned
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-semibold">
                      100% MASTERY
                    </span>
                  </div>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  5 Challenges (MCQ &amp; Numerical) • Embedded Fluid Dynamics Airfoil Simulation. Mastered with zero anomalies.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-xs">
                    <span className="material-symbols-outlined text-[16px]">check</span> Score: 500 / 500
                  </span>
                  <button
                    onClick={() => onShowToast('Sandbox Mode launched for Level 1!')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                      isDark ? 'bg-[#181926] border-violet-500/20 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    Sandbox Mode
                  </button>
                </div>
              </div>
            </div>

            {/* Step 04: Level 2 (ACTIVE & IN-PROGRESS) */}
            <div
              className={`relative z-10 flex items-start gap-4 p-5 rounded-2xl shadow-2xl border-2 transition-all ${
                isDark
                  ? 'bg-[#181926] border-violet-500 shadow-[0_0_28px_rgba(167,139,250,0.25)]'
                  : 'bg-violet-50/90 border-violet-500 shadow-md'
              }`}
            >
              <div
                onClick={() => handleStageCircleClick(4)}
                title="Click circle to view rewards"
                className="w-11 h-11 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 ring-4 ring-[#0d0e14]/50 shadow-lg animate-pulse cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[24px]">play_arrow</span>
              </div>
              <div className="flex flex-col flex-1 gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-violet-400 uppercase tracking-wider">
                      Stage 04
                    </span>
                    <span className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Level 2: Dynamic Harmonic Damping &amp; Mass Dampers
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-600/25 border border-violet-500/40 text-violet-300 font-mono text-[10px] uppercase font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                    ACTIVE CHAMBER
                  </span>
                </div>

                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Currently on Challenge 3 of 5 • Embedded Euler-Bernoulli Beam &amp; Tuned Mass Damper Live Simulation. Live KP Stakes: +15 KP.
                </p>

                <div className="flex flex-col gap-1 py-1">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-400">Challenge Sequence</span>
                    <span className="text-violet-400 font-bold">3 of 5 (60%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-700/30 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 to-indigo-400 rounded-full shadow-[0_0_10px_rgba(167,139,250,0.5)]"
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onNavigate('mission-chamber')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-[0_4px_0_#5b21b6] active:translate-y-0.5 transition-all"
                  >
                    <span>Resume Level 2 (Challenge 3)</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                  <span className="font-mono text-xs text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-violet-400">schedule</span>
                    Est: ~8 mins left
                  </span>
                </div>
              </div>
            </div>

            {/* Step 05: Level 3 (Locked) */}
            <div
              className={`relative z-10 flex items-start gap-4 p-4 rounded-2xl border opacity-75 ${
                isDark ? 'bg-[#12131b]/60 border-violet-500/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                onClick={() => handleStageCircleClick(5)}
                title="Click circle to view rewards"
                className="w-11 h-11 rounded-full bg-slate-700/30 text-slate-400 flex items-center justify-center shrink-0 ring-4 ring-[#0d0e14]/50 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[22px]">lock</span>
              </div>
              <div className="flex flex-col flex-1 gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400 uppercase">Stage 05</span>
                    <span className="text-sm font-medium text-slate-400">
                      Level 3: Crosswind Velocity &amp; Torsional Flutter
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-700/20 text-slate-400 font-mono text-[10px]">
                    +40 KP BOUNTY
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  5 Challenges • Multi-axis Bridge Torsion Simulation. Unlocks upon completing Level 2 with acceptable divergence factor.
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 text-slate-500 font-mono text-[11px] uppercase">
                    <span className="material-symbols-outlined text-[14px]">lock_clock</span> Prerequisite: Level 2 Cleared
                  </span>
                </div>
              </div>
            </div>

            {/* Step 06: Level 4 (Locked) */}
            <div
              className={`relative z-10 flex items-start gap-4 p-4 rounded-2xl border opacity-75 ${
                isDark ? 'bg-[#12131b]/60 border-violet-500/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                onClick={() => handleStageCircleClick(6)}
                title="Click circle to view rewards"
                className="w-11 h-11 rounded-full bg-slate-700/30 text-slate-400 flex items-center justify-center shrink-0 ring-4 ring-[#0d0e14]/50 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[22px]">lock</span>
              </div>
              <div className="flex flex-col flex-1 gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400 uppercase">Stage 06</span>
                    <span className="text-sm font-medium text-slate-400">
                      Level 4: Critical Resonance Thresholds &amp; Stress Limits
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-700/20 text-slate-400 font-mono text-[10px]">
                    +45 KP BOUNTY
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  5 Challenges (High Entropy Numericals) • Real-time Stress &amp; Strain Finite Element Simulation. Unlocks upon completing Level 3.
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 text-slate-500 font-mono text-[11px] uppercase">
                    <span className="material-symbols-outlined text-[14px]">lock_clock</span> Prerequisite: Level 3 Cleared
                  </span>
                </div>
              </div>
            </div>

            {/* Step 07: Level 5 (Final Apex) */}
            <div
              className={`relative z-10 flex items-start gap-4 p-4 rounded-2xl border ${
                isDark ? 'bg-[#12131b]/80 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'
              }`}
            >
              <div
                onClick={() => handleStageCircleClick(7)}
                title="Click circle to view rewards"
                className="w-11 h-11 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 ring-4 ring-[#0d0e14]/50 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[24px]">military_tech</span>
              </div>
              <div className="flex flex-col flex-1 gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-amber-500 font-bold uppercase">
                      Stage 07 • Final Apex
                    </span>
                    <span className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-900'}`}>
                      Level 5: Mission Synthesis &amp; Final Certification Exam
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-mono text-[10px] font-bold">
                      50 COINS + BADGE
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-700/30 text-slate-400 font-mono text-[10px]">
                      LOCKED
                    </span>
                  </div>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  5 Comprehensive System Challenges • Full-scale Bridge Collapse Stress Test Simulation. Completing unlocks: 50 Gold Coins, 'Harmonic Guardian' Attested Badge, and Puppy Celebration.
                </p>
                <div className="pt-1 flex items-center gap-4 text-xs font-mono text-amber-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span> Harmonic Guardian Badge
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">celebration</span> Puppy Celebration
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Mission Inspection & Live Lab Drawer */}
        <div className="xl:col-span-4 flex flex-col gap-4 xl:sticky xl:top-20">
          {/* Sparky Cyber-Pup Assistant Card */}
          <div
            className={`p-4 rounded-2xl border shadow-lg flex items-start gap-4 relative overflow-hidden ${
              isDark
                ? 'bg-[#12131b] border-violet-500/20'
                : 'bg-white border-violet-200'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-[#1e1f30] shrink-0 overflow-hidden flex items-center justify-center ring-2 ring-violet-400/40">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsYCcWh7-oQNT0IgXsIHzAbsUP7rJCZlaIBQvvPn7urN5hBVhwvKpzQiPRBrXzQ6ixLXP3TkCLwyMAva251Zc4YMzqqxIUqmyJStv78sh6yhcP1_Hp44Rr6xqnZRGtSdqRFtcCDuSzVi8Pp4nltLzLvZ94BzK-W3FX7HSxRnyAwijIb2t5ZZE2huuHryxOUDjawNOqmevDRv5TYbNzCEqqLpIh1tDaG7TFKn910_xsee15MuclhBc"
                alt="Sparky Assistant"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Sparky the Pup
                </span>
                <span className="font-mono text-[10px] text-violet-400 uppercase font-semibold">
                  Lab Assistant
                </span>
              </div>
              <p className={`text-xs italic leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                "Level 2 is tricky! Check the damping ratio <strong className="text-violet-400 font-mono">ζ &gt; 0.05</strong> before running the wind vector simulation. You got this, cadet!"
              </p>
            </div>
          </div>

          {/* Reward Physics Breakdown */}
          <div
            className={`p-4 rounded-2xl border shadow-md flex flex-col gap-2 ${
              isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Reward Physics
              </span>
              <span className="material-symbols-outlined text-amber-500 text-[20px]">savings</span>
            </div>
            <div className="flex flex-col gap-2 text-xs pt-1">
              <div className="flex items-center justify-between py-1 border-b border-slate-700/20">
                <span className="text-slate-400">Total KP Potential</span>
                <span className="font-mono text-violet-400 font-bold">180 KP</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-700/20">
                <span className="text-slate-400">Mission Completion Bonus</span>
                <span className="font-mono text-amber-400 font-bold">50 Coins</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Streak Multiplier</span>
                <span className="font-mono text-violet-400 font-bold">1.25x Active 🔥</span>
              </div>
            </div>
          </div>

          {/* Mission Attachments & Resources */}
          <div
            className={`p-4 rounded-2xl border shadow-md flex flex-col gap-2 ${
              isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Resource Files
              </span>
              <span className="font-mono text-[10px] text-slate-400 uppercase">3 ATTACHMENTS</span>
            </div>
            <div className="flex flex-col gap-2 text-xs pt-1">
              <button
                onClick={() => onShowToast('Downloaded Bridge_Specs_v2.pdf (2.4 MB)')}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all text-left ${
                  isDark ? 'bg-[#181926] border-violet-500/20 hover:bg-[#1e1f30]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-400 text-[18px]">picture_as_pdf</span>
                  <span className="font-mono text-xs">Bridge_Specs_v2.pdf</span>
                </div>
                <span className="text-slate-400 text-[11px]">2.4 MB</span>
              </button>

              <button
                onClick={() => onShowToast('Downloaded Vibration_Telemetry.csv (840 KB)')}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all text-left ${
                  isDark ? 'bg-[#181926] border-violet-500/20 hover:bg-[#1e1f30]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-violet-400 text-[18px]">table_chart</span>
                  <span className="font-mono text-xs">Vibration_Telemetry.csv</span>
                </div>
                <span className="text-slate-400 text-[11px]">840 KB</span>
              </button>

              <button
                onClick={() => onShowToast('Downloaded Damper_Coefficients.json (112 KB)')}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all text-left ${
                  isDark ? 'bg-[#181926] border-violet-500/20 hover:bg-[#1e1f30]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">data_object</span>
                  <span className="font-mono text-xs">Damper_Coefficients.json</span>
                </div>
                <span className="text-slate-400 text-[11px]">112 KB</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ladder Stage Circle Popup Window */}
      {ladderCircleModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl transition-all relative ${
              isDark
                ? 'bg-[#12131b] border-violet-500/30 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            }`}
          >
            <button
              onClick={() => setLadderCircleModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              <span className="font-mono text-[10px] text-violet-400 uppercase tracking-widest font-bold">
                {ladderCircleModal.stage} // Ladder Node
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/10 border border-violet-500/20 text-violet-300">
                {ladderCircleModal.status}
              </span>
            </div>

            <h3 className="font-headline-sm text-xl font-bold tracking-tight mb-2">
              {ladderCircleModal.name}
            </h3>

            <p className={`text-xs mb-4 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {ladderCircleModal.description}
            </p>

            {/* Bounties / Earned Rewards Box */}
            <div
              className={`p-4 rounded-xl border mb-4 flex items-center justify-around ${
                isDark ? 'bg-[#181926] border-violet-500/20' : 'bg-violet-50/90 border-violet-200'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                  KP Bounty Earned
                </span>
                <div className="flex items-center gap-1 text-lg font-bold text-violet-400 font-mono">
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                  <span>+{ladderCircleModal.kp} KP</span>
                </div>
              </div>

              <div className={`h-8 w-px ${isDark ? 'bg-slate-700/40' : 'bg-violet-200'}`} />

              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                  Coins Bounty Earned
                </span>
                <div className="flex items-center gap-1 text-lg font-bold text-amber-500 font-mono">
                  <span className="material-symbols-outlined text-[20px]">monetization_on</span>
                  <span>+{ladderCircleModal.coins} Coins</span>
                </div>
              </div>
            </div>

            {/* Mission Structure & Learning Path Details */}
            <div className="flex flex-col gap-1.5 mb-5 text-xs">
              <span className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
                Node Curriculum Architecture:
              </span>
              <div
                className={`p-3 rounded-lg border text-xs leading-relaxed font-mono ${
                  isDark ? 'bg-[#0a0b12] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-bold text-violet-400 mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">account_tree</span>
                  <span>{ladderCircleModal.structure}</span>
                </div>
                <div className="text-[11px] leading-normal text-slate-400">
                  Includes live parameters, interactive SVG telemetry visualizers, real-time formula evaluation, and instant grading.
                </div>
              </div>
            </div>

            {/* Action Navigation Button */}
            <button
              onClick={() => {
                setLadderCircleModal(null);
                onNavigate('mission-chamber');
              }}
              className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(139,92,246,0.35)] active:translate-y-0.5 transition-all"
            >
              <span>Navigate into Mission Structure &amp; Chamber</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
