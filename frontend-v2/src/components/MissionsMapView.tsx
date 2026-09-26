import React, { useState } from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';

interface MissionsMapViewProps {
  theme: ThemeMode;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onShowToast: (msg: string) => void;
}

interface MissionPathNode {
  id: number;
  title: string;
  stageName: string;
  status: 'active' | 'ready' | 'locked';
  kp: number;
  coins: number;
  levelsCount: number;
  learningPathInfo: string;
  difficulty: string;
  description: string;
}

const MISSIONS_PATH_DATA: Record<number, MissionPathNode> = {
  1: {
    id: 1,
    title: 'Bridge Stability & Resonance',
    stageName: 'Stage 04: Level 2 In-Progress',
    status: 'active',
    kp: 180,
    coins: 50,
    levelsCount: 5,
    learningPathInfo: 'Harmonic wave induction, Tacoma flutter damping, Euler-Bernoulli beam resonance, Tuned mass damper physics.',
    difficulty: 'Intermediate Tier 2',
    description: 'Reconcile mechanical oscillator frequencies to prevent Tacoma Narrows aeroelastic flutter. Real-time vortex shedding calibrations.'
  },
  2: {
    id: 2,
    title: 'Gravitational Slingshot & Orbital Dynamics',
    stageName: 'Stage 01: Hyperbolic Trajectory',
    status: 'ready',
    kp: 200,
    coins: 50,
    levelsCount: 4,
    learningPathInfo: 'Keplerian orbital elements, 3-body perturbation, Hohmann transfer vectors, Oberth kinetic velocity boosts.',
    difficulty: 'Advanced Tier 3',
    description: 'Calculate hyperbolic planetary flybys to maximize spacecraft delta-V without atmospheric burnup.'
  },
  3: {
    id: 3,
    title: 'Aerodynamic Airfoil Lift & Boundary Layer',
    stageName: 'Stage 01: Navier-Stokes Airfoil',
    status: 'locked',
    kp: 240,
    coins: 60,
    levelsCount: 5,
    learningPathInfo: 'Navier-Stokes compressible flow, Mach detachment angles, Prandtl-Meyer expansion, dynamic wing camber.',
    difficulty: 'Master Tier 4',
    description: 'Diagnose supersonic shockwave detachment and calculate supercritical camber stall angles.'
  },
  4: {
    id: 4,
    title: 'Quantum Potential Well & Barrier Tunneling',
    stageName: 'Stage 01: Schrödinger Eigenstates',
    status: 'locked',
    kp: 310,
    coins: 75,
    levelsCount: 5,
    learningPathInfo: 'Wave-packet probability density, transmission coefficients, finite rectangular barrier potentials.',
    difficulty: 'Master Tier 5',
    description: 'Compute wave-packet transmission probabilities through finite electrostatic barriers.'
  },
  5: {
    id: 5,
    title: 'Relativistic Mechanics & Spacetime Curvature',
    stageName: 'Stage 01: Geodesic Coordinates',
    status: 'locked',
    kp: 420,
    coins: 100,
    levelsCount: 6,
    learningPathInfo: 'General relativity tensors, Schwarzschild metric geodesics, Kerr frame-dragging singularity physics.',
    difficulty: 'Apex Tier 6',
    description: 'Model gravitational redshift and geodesic trajectories near rotating Kerr metric singularities.'
  }
};

export const MissionsMapView: React.FC<MissionsMapViewProps> = ({
  theme,
  stats,
  onNavigate,
  onShowToast,
}) => {
  const isDark = theme === 'dark';
  const [selectedMission, setSelectedMission] = useState<number>(1);
  const [circleModalData, setCircleModalData] = useState<MissionPathNode | null>(null);

  const handleCircleClick = (nodeId: number) => {
    setSelectedMission(nodeId);
    setCircleModalData(MISSIONS_PATH_DATA[nodeId]);
  };

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Top Breadcrumb & Path Selector */}
      <div className="py-2 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.9)] animate-pulse" />
            <button
              onClick={() => onNavigate('disciplines')}
              className="font-mono text-xs uppercase tracking-wider text-violet-400 hover:underline flex items-center gap-1"
            >
              <span>← All Disciplines</span>
              <span>/</span>
              <span>Curriculum Path</span>
            </button>
          </div>
          <h1
            className={`font-headline-lg text-2xl md:text-3xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Physics Missions Path
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              isDark
                ? 'bg-[#12131b] border-violet-500/30 text-white shadow-md'
                : 'bg-white border-violet-200 text-slate-800 shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] text-violet-400">science</span>
            <div className="flex flex-col text-left">
              <span className="font-mono text-xs font-bold leading-tight">
                Physics: Structural &amp; Kinetic
              </span>
              <span className="text-[10px] text-slate-400">Active Track (Tier 2)</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Node Circuit (7 cols) + Right Sticky Briefing Drawer (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start relative">
        {/* Left Column: Winding SVG Circuit Path with Interactive Mission Nodes */}
        <div className="xl:col-span-7 flex flex-col items-center relative py-4 min-h-[900px]">
          {/* Circuit Connector Line SVG */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="obsidianVioletGlow" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#8b5cf6" stopOpacity="0.85" />
                <stop offset="65%" stopColor="#6366f1" stopOpacity="0.5" />
                <stop offset="85%" stopColor="#4338ca" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.1" />
              </linearGradient>
              <filter id="circuitBloom">
                <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 180 90 C 180 160, 420 180, 420 300 S 170 440, 170 560 S 390 680, 390 800 S 180 900, 180 980"
              fill="none"
              stroke="url(#obsidianVioletGlow)"
              strokeWidth="4"
              strokeDasharray="8 6"
              filter="url(#circuitBloom)"
            />
          </svg>

          {/* Node 1: Bridge Stability & Resonance (In-Progress) */}
          <div className="relative z-10 w-full flex justify-start pl-4 md:pl-16 mb-24">
            <div
              onClick={() => handleCircleClick(1)}
              className="group relative flex items-center gap-4 cursor-pointer"
            >
              <div className="relative">
                <div className="absolute -inset-2.5 rounded-full bg-violet-500/25 blur-lg animate-pulse" />
                <div
                  className={`relative w-22 h-22 rounded-full border flex items-center justify-center p-1.5 transition-transform group-hover:scale-105 ${
                    selectedMission === 1
                      ? 'ring-4 ring-violet-500/50 scale-105'
                      : ''
                  } ${
                    isDark ? 'bg-[#181926] border-violet-400/40 shadow-xl' : 'bg-white border-violet-300 shadow-md'
                  }`}
                  style={{ width: '88px', height: '88px' }}
                >
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="38" cy="38" r="32" stroke={isDark ? '#1f2030' : '#e2e8f0'} strokeWidth="5" fill="transparent" />
                    <circle
                      cx="38"
                      cy="38"
                      r="32"
                      stroke="#8b5cf6"
                      strokeWidth="5"
                      strokeDasharray="201"
                      strokeDashoffset="70"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div
                    className={`absolute inset-2 rounded-full flex flex-col items-center justify-center ${
                      isDark ? 'bg-[#12131b] text-violet-300' : 'bg-violet-50 text-violet-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[26px] text-violet-400">architecture</span>
                    <span className="font-mono text-[11px] font-bold">65%</span>
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 bg-violet-600 text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md border border-violet-400/40">
                  LVL 2
                </span>
              </div>

              <div
                className={`flex flex-col px-4 py-3 rounded-2xl shadow-xl max-w-xs border transition-all ${
                  selectedMission === 1
                    ? isDark ? 'bg-[#181926] border-violet-400' : 'bg-white border-violet-400 ring-2 ring-violet-200'
                    : isDark ? 'bg-[#12131b]/95 border-violet-500/20' : 'bg-white/95 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                  <span className="font-mono text-[10px] text-violet-400 font-bold uppercase tracking-wider">
                    Mission 01 // Click Circle for Rewards
                  </span>
                </div>
                <span className={`font-bold text-sm leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Bridge Stability &amp; Resonance
                </span>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
                  <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                    <span className="material-symbols-outlined text-[15px]">bolt</span> 180 KP
                  </span>
                  <span>•</span>
                  <span className="text-violet-400 font-semibold">Stage 4 Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Node 2: Gravitational Slingshot (Unlocked) */}
          <div className="relative z-10 w-full flex justify-end pr-4 md:pr-16 mb-24">
            <div
              onClick={() => handleCircleClick(2)}
              className="group relative flex flex-row-reverse items-center gap-4 cursor-pointer"
            >
              <div className="relative">
                <div
                  className={`w-20 h-20 rounded-full border flex items-center justify-center transition-transform group-hover:scale-105 shadow-xl ${
                    selectedMission === 2 ? 'ring-4 ring-amber-400/50 scale-105' : ''
                  } ${isDark ? 'bg-[#181926] border-amber-500/30' : 'bg-white border-amber-300'}`}
                >
                  <div
                    className={`w-15 h-15 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-[#12131b] text-amber-400' : 'bg-amber-50 text-amber-600'
                    }`}
                    style={{ width: '60px', height: '60px' }}
                  >
                    <span className="material-symbols-outlined text-[28px]">rocket_launch</span>
                  </div>
                </div>
                <span className="absolute -top-1 -left-1 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-mono text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase shadow-sm">
                  Ready
                </span>
              </div>

              <div
                className={`flex flex-col items-end text-right px-4 py-3 rounded-2xl shadow-lg max-w-xs border transition-all ${
                  isDark ? 'bg-[#12131b]/95 border-violet-500/20' : 'bg-white/95 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-mono text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                    Mission 02 // Click Circle
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>
                <span className={`font-bold text-sm leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Gravitational Slingshot
                </span>
                <div className="flex items-center gap-2 mt-1.5 font-mono text-xs text-slate-400">
                  <span className="text-amber-400 font-bold">+200 KP</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">+50 Coins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Node 3: Aerodynamic Airfoil Lift (Sealed) */}
          <div
            onClick={() => handleCircleClick(3)}
            className="relative z-10 w-full flex justify-start pl-6 md:pl-20 mb-24 opacity-85 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full border flex items-center justify-center shadow-md hover:scale-105 transition-transform ${
                  isDark ? 'bg-[#181926] border-violet-500/20 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">lock</span>
              </div>

              <div
                className={`flex flex-col px-4 py-2.5 rounded-2xl max-w-xs border ${
                  isDark ? 'bg-[#12131b]/80 border-violet-500/15' : 'bg-white/80 border-slate-200'
                }`}
              >
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Mission 03 // Click Circle
                </span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Aerodynamic Airfoil Lift
                </span>
                <div className="flex items-center gap-1 mt-1 text-slate-400 font-mono text-[11px]">
                  <span className="material-symbols-outlined text-[14px] text-violet-400">lock_clock</span>
                  <span>Requires <strong className="text-violet-400">2,200 KP</strong> (Current: {stats.kp})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Node 4: Quantum Potential Well (Deep Classified) */}
          <div
            onClick={() => handleCircleClick(4)}
            className="relative z-10 w-full flex justify-end pr-6 md:pr-20 mb-24 opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <div className="flex flex-row-reverse items-center gap-4">
              <div
                className={`w-14 h-14 rounded-full border flex items-center justify-center hover:scale-105 transition-transform ${
                  isDark ? 'bg-[#181926] border-violet-500/15 text-slate-500' : 'bg-slate-100 border-slate-300 text-slate-400'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <div
                className={`flex flex-col items-end text-right px-4 py-2.5 rounded-2xl max-w-xs border ${
                  isDark ? 'bg-[#12131b]/60 border-violet-500/10' : 'bg-white/60 border-slate-200'
                }`}
              >
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Mission 04 // Click Circle
                </span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Quantum Potential Well
                </span>
                <span className="text-slate-500 font-mono text-[10px] mt-0.5">
                  Clear Sector 03 to decrypt
                </span>
              </div>
            </div>
          </div>

          {/* Node 5: Relativistic Mechanics & Warp */}
          <div
            onClick={() => handleCircleClick(5)}
            className="relative z-10 w-full flex justify-start pl-6 md:pl-20 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-full border flex items-center justify-center hover:scale-105 transition-transform ${
                  isDark ? 'bg-[#181926] border-violet-500/10 text-slate-600' : 'bg-slate-100 border-slate-300 text-slate-400'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <div
                className={`flex flex-col px-4 py-2.5 rounded-2xl max-w-xs border ${
                  isDark ? 'bg-[#12131b]/50 border-violet-500/10' : 'bg-white/50 border-slate-200'
                }`}
              >
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Mission 05 // Apex Sector (Click Circle)
                </span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Relativistic Mechanics &amp; Warp
                </span>
                <span className="text-slate-500 font-mono text-[10px] mt-0.5">
                  Requires Mastery Tier 3
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mission 01 Simulation Brief Drawer */}
        <div className="xl:col-span-5 flex flex-col gap-4 sticky top-20">
          <div
            className={`rounded-2xl p-5 border shadow-2xl flex flex-col gap-4 relative overflow-hidden transition-all ${
              isDark
                ? 'bg-[#12131b] border-violet-500/25'
                : 'bg-white border-violet-200 shadow-xl'
            }`}
          >
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 border border-violet-400/30 font-mono text-[10px] font-bold uppercase tracking-wider">
                    Simulation Brief
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">ID: PHY-RES-104</span>
                </div>
                <h2 className={`font-headline-md text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Bridge Stability &amp; Resonance
                </h2>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-mono text-[10px] text-slate-400 uppercase font-semibold">Prizes</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs font-bold text-violet-400 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[15px]">bolt</span> 180
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[15px]">monetization_on</span> 40
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Image Thumbnail */}
            <div className="h-32 w-full rounded-xl overflow-hidden relative shadow-inner border border-violet-500/20">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcgYITb3zpOSt9gcRtiC03Mkp0URneQITN7UlJZUOPFNDj8_QtXkPEqtexTUAX5GJfNPPzeKPUQTydLc0fOhwUtDpXiDzS5MrxRUtU_cgSoHOHP5T8wlCUUoziXXYIMKaQ2SwWKRHLivwhZNHgbt05D0FtflB_3dvI8iVis1mfHFEbNBSYRxQMT2ObIBZGGa-92Z7W8hOfI3x-Upl7W5mEN8AyRGi-BghOxKne6009fHHVBSDdPu0"
                alt="Bridge Simulation"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                <span className="font-mono text-[10px] text-violet-200 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-violet-500/20">
                  Sim Stage: Harmonic Wave Induction
                </span>
                <span className="font-mono text-[11px] text-slate-200">Step 6 of 8</span>
              </div>
            </div>

            {/* Situation & Assigned Role */}
            <div className={`flex flex-col gap-1.5 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <p>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>Situation:</strong> A suspension overpass is exhibiting catastrophic aeroelastic flutter under crosswind vortices. Your telemetry must balance shear damping.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-400 font-mono text-[11px] uppercase">Assigned Role:</span>
                <span className="text-violet-400 font-semibold">Chief Structural Analyst</span>
              </div>
            </div>

            {/* Parameter Badges */}
            <div className="flex flex-wrap gap-1.5">
              <span
                className={`px-2.5 py-1 rounded-md font-mono text-[10px] flex items-center gap-1.5 border ${
                  isDark ? 'bg-[#181926] text-white border-violet-500/20' : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                Oscillation Frequency
              </span>
              <span
                className={`px-2.5 py-1 rounded-md font-mono text-[10px] flex items-center gap-1.5 border ${
                  isDark ? 'bg-[#181926] text-white border-violet-500/20' : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                Harmonics
              </span>
              <span
                className={`px-2.5 py-1 rounded-md font-mono text-[10px] flex items-center gap-1.5 border ${
                  isDark ? 'bg-[#181926] text-white border-violet-500/20' : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Critical Damping Ratio
              </span>
            </div>

            {/* Mini Ladder Progression Bar */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
                  Ladder Progression
                </span>
                <button
                  onClick={() => onNavigate('mission-detail')}
                  className="font-mono text-[10px] text-violet-400 hover:underline"
                >
                  View 7-Stage Ladder →
                </button>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                <div
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-center ${
                    isDark ? 'bg-[#181926] border-violet-500/20' : 'bg-violet-50 border-violet-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                  <span className="font-mono text-[9px] font-bold">Capsule</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-center ${
                    isDark ? 'bg-[#181926] border-violet-500/20' : 'bg-violet-50 border-violet-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                  <span className="font-mono text-[9px] font-bold">Lvl 1</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-center ${
                    isDark ? 'bg-[#1f2030] border-violet-400 text-violet-300' : 'bg-violet-100 border-violet-400 text-violet-900 font-bold'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-violet-400 animate-bounce">play_arrow</span>
                  <span className="font-mono text-[9px] font-bold">Lvl 2 Active</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg border border-transparent text-center opacity-50">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">lock</span>
                  <span className="font-mono text-[9px]">Lvl 3</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg border border-transparent text-center opacity-50">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">lock</span>
                  <span className="font-mono text-[9px]">Exam</span>
                </div>
              </div>
            </div>

            {/* Telemetry Assets */}
            <div className="flex flex-col gap-1 pt-1">
              <span className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
                Mission Telemetry Assets
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onShowToast('Downloaded Resonance_Report.pdf (2.4 MB)')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-[11px] transition-colors ${
                    isDark ? 'bg-[#181926] border-violet-500/20 hover:bg-[#1f2030] text-white' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px] text-rose-400">description</span>
                  <span>Resonance_Report.pdf</span>
                </button>
                <button
                  onClick={() => onShowToast('Downloaded Vibration_Data.csv (840 KB)')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-[11px] transition-colors ${
                    isDark ? 'bg-[#181926] border-violet-500/20 hover:bg-[#1f2030] text-white' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px] text-violet-400">table_chart</span>
                  <span>Vibration_Data.csv</span>
                </button>
              </div>
            </div>

            {/* Action Buttons: Seamless Entry to Live Challenge Chamber */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => onNavigate('mission-chamber')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-[0_4px_12px_rgba(139,92,246,0.35)] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Continue from Level 2 Capsule</span>
              </button>
              <button
                onClick={() => onShowToast('Capsule review unlocked (-10 Coins). Telemetry notes refreshed.')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  isDark ? 'bg-[#181926] border-violet-500/20 text-white hover:bg-[#1f2030]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-amber-400">refresh</span>
                <span>Review (-10 Coins)</span>
              </button>
            </div>
          </div>

          {/* Sparky Motivator Card */}
          <div
            className={`p-4 rounded-2xl border shadow-lg flex items-center gap-4 relative overflow-hidden ${
              isDark
                ? 'bg-[#12131b] border-violet-500/20'
                : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
            }`}
          >
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border border-violet-400/30 shadow-inner">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnKlf2hNLl0iZiK0EP0nxD8UdDFN3W7CXzPcIKJj6C36xCvlVSemtIuEwdXHnfdhKTNtOJ-V31wVhwvTGAvVOWkslQa0aiGC3RxzUabm_L49IWycKDHODyG5FMnP1BmfXP7Gs9Zcp80PfdYF-8DNKyBpWT19SoHbQe17dimE74-XORf5QFvs2mU4pZdzNnKVO7QAF0FsEn5FJziCU47WzkTq40GX4s1T0D0d5UINQSXc7WK3V9mbo"
                alt="Sparky the Pup"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-amber-500 uppercase">
                  Sparky the Nextess Pup
                </span>
                <span className="material-symbols-outlined text-[14px] text-orange-500">
                  local_fire_department
                </span>
              </div>
              <p className={`text-xs italic mt-0.5 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                "Solve and gain your rewards! You're on fire today, cadet!"
              </p>
              <span className="font-mono text-[10px] text-violet-400 mt-0.5">
                Streak multiplier: 1.25x Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Circle Click Modal: Rewards & Navigation to Mission Structure */}
      {circleModalData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl transition-all relative ${
              isDark
                ? 'bg-[#12131b] border-violet-500/30 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            }`}
          >
            <button
              onClick={() => setCircleModalData(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              <span className="font-mono text-[10px] text-violet-400 uppercase tracking-widest font-bold">
                {circleModalData.stageName}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/10 border border-violet-500/20 text-violet-300">
                {circleModalData.difficulty}
              </span>
            </div>

            <h3 className="font-headline-sm text-xl font-bold tracking-tight mb-2">
              {circleModalData.title}
            </h3>

            <p className={`text-xs mb-4 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {circleModalData.description}
            </p>

            {/* Bounties / Earned Rewards Box */}
            <div
              className={`p-4 rounded-xl border mb-4 flex items-center justify-around ${
                isDark ? 'bg-[#181926] border-violet-500/20' : 'bg-violet-50/90 border-violet-200'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                  KP Bounty
                </span>
                <div className="flex items-center gap-1 text-lg font-bold text-violet-400 font-mono">
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                  <span>+{circleModalData.kp} KP</span>
                </div>
              </div>

              <div className={`h-8 w-px ${isDark ? 'bg-slate-700/40' : 'bg-violet-200'}`} />

              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                  Coins Bounty
                </span>
                <div className="flex items-center gap-1 text-lg font-bold text-amber-500 font-mono">
                  <span className="material-symbols-outlined text-[20px]">monetization_on</span>
                  <span>+{circleModalData.coins} Coins</span>
                </div>
              </div>
            </div>

            {/* Mission Structure & Learning Path Highlights */}
            <div className="flex flex-col gap-1.5 mb-5 text-xs">
              <span className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
                Mission Structure &amp; Learning Path:
              </span>
              <div
                className={`p-3 rounded-lg border text-xs leading-relaxed font-mono ${
                  isDark ? 'bg-[#0a0b12] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-bold text-violet-400 mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">layers</span>
                  <span>Architecture: {circleModalData.levelsCount} Challenge Levels &amp; Discovery Nodes</span>
                </div>
                <div className="text-[11px] leading-normal">{circleModalData.learningPathInfo}</div>
              </div>
            </div>

            {/* Action Navigation Button */}
            <button
              onClick={() => {
                setCircleModalData(null);
                onNavigate('mission-detail');
              }}
              className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(139,92,246,0.35)] active:translate-y-0.5 transition-all"
            >
              <span>Navigate into Mission Structure</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
