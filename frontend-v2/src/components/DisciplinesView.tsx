import React, { useState } from 'react';
import { ActivePage, ThemeMode } from '../types';

interface DisciplinesViewProps {
  theme: ThemeMode;
  onNavigate: (page: ActivePage) => void;
  onShowToast: (msg: string) => void;
}

export const DisciplinesView: React.FC<DisciplinesViewProps> = ({
  theme,
  onNavigate,
  onShowToast,
}) => {
  const isDark = theme === 'dark';
  const [filter, setFilter] = useState<'all' | 'active' | 'soon'>('all');
  const [preRegistered, setPreRegistered] = useState<Record<string, boolean>>({});

  const toggleRegister = (id: string, name: string) => {
    setPreRegistered((prev) => {
      const next = !prev[id];
      if (next) {
        onShowToast(`Pre-registered for ${name}! +50 Early Access XP reserved.`);
      } else {
        onShowToast(`Cancelled pre-registration for ${name}.`);
      }
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Ambient Glow */}
      <div className="relative w-full">
        <div className="absolute -top-10 left-1/4 w-96 h-32 bg-violet-600/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute -top-10 right-1/4 w-96 h-32 bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />
      </div>

      {/* Header Section */}
      <section className="flex flex-col gap-3 pt-2 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_10px_#cebdff]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-violet-400 font-semibold">
            DISCIPLINE DIRECTORY
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-3xl flex flex-col gap-1">
            <h1
              className={`font-headline-lg text-2xl md:text-3xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Missions &amp; Disciplines
            </h1>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border ${
                isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                  filter === 'active'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Ready
              </button>
              <button
                onClick={() => setFilter('soon')}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                  filter === 'soon'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upcoming
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Active Disciplines Section */}
      {(filter === 'all' || filter === 'active') && (
        <section className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-400 text-[22px]">rocket_launch</span>
            <h2 className={`font-headline-sm text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ACTIVE DISCIPLINES 
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Card 1: Classical & Modern Physics */}
            <div
              className={`relative flex flex-col justify-between p-6 rounded-2xl border shadow-lg transition-all group overflow-hidden ${
                isDark
                  ? 'bg-[#181926] border-violet-500/25 hover:border-violet-400/50'
                  : 'bg-gradient-to-br from-purple-50/90 via-white to-violet-50/70 border-purple-200'
              }`}
            >
              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                        isDark ? 'bg-violet-600/30 text-violet-300' : 'bg-violet-100 text-violet-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[32px]">all_inclusive</span>
                    </div>
                    <div className="flex flex-col">
                      <h3 className={`font-headline-sm text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Classical &amp; Modern Physics
                      </h3>
                    </div>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Master mechanics, aerodynamic fluid damping, harmonic resonance, and relativistic wave equations through kinetic finite-element simulations.
                </p>

                {/* Stats Pill Row */}
                <div
                  className={`grid grid-cols-3 gap-2 p-2 rounded-xl text-center border ${
                    isDark ? 'bg-[#1e1f30] border-violet-500/15' : 'bg-white/80 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col py-1">
                    <span className={`font-mono text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      28
                    </span>
                    <span className="text-[10px] text-slate-400">Missions</span>
                  </div>
                  <div className="flex flex-col py-1 border-x border-slate-700/20">
                    <span className="font-mono text-sm text-violet-400 font-bold">Lvl 5</span>
                    <span className="text-[10px] text-slate-400">Mastery</span>
                  </div>
                  <div className="flex flex-col py-1">
                    <span className="font-mono text-sm text-amber-400 font-bold">1,420</span>
                    <span className="text-[10px] text-slate-400">KP of 2,100</span>
                  </div>
                </div>

                {/* Next Up Objective */}
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                    isDark ? 'bg-[#1e1f30] border-violet-500/20' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-violet-400 text-[18px]">play_circle</span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 leading-none">Current Objective</span>
                    <span className={`text-xs font-semibold truncate mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Next: Mission 02 — Gravitational Slingshot (Unlocked)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-violet-600/20 text-violet-300 font-mono text-[10px] font-bold">
                    +140 KP
                  </span>
                </div>
              </div>

              {/* Action Button: Seamless navigation to Physics Missions Map */}
              <div className="pt-4 mt-3 border-t border-slate-700/20">
                <button
                  onClick={() => onNavigate('missions-map')}
                  className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(139,92,246,0.35)] active:translate-y-0.5 transition-all"
                >
                  <span>Open Physics Missions</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Card 2: Quantitative Economics & Systems */}
            <div
              className={`relative flex flex-col justify-between p-6 rounded-2xl border shadow-lg transition-all group overflow-hidden ${
                isDark
                  ? 'bg-[#181926] border-emerald-500/20 hover:border-emerald-400/40'
                  : 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/70 border-emerald-200'
              }`}
            >
              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                        isDark ? 'bg-emerald-600/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[32px]">stacked_line_chart</span>
                    </div>
                    <div className="flex flex-col">
                      <h3 className={`font-headline-sm text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Quantitative Economics &amp; Systems
                      </h3>
                    </div>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Diagnose macro financial systemic shocks, balance automated market maker liquidity curves, and prevent algorithmic liquidation contagion.
                </p>

                {/* Stats Pill Row */}
                <div
                  className={`grid grid-cols-3 gap-2 p-2 rounded-xl text-center border ${
                    isDark ? 'bg-[#1e1f30] border-emerald-500/15' : 'bg-white/80 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col py-1">
                    <span className={`font-mono text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      19
                    </span>
                    <span className="text-[10px] text-slate-400">Missions</span>
                  </div>
                  <div className="flex flex-col py-1 border-x border-slate-700/20">
                    <span className="font-mono text-sm text-emerald-400 font-bold">Lvl 4</span>
                    <span className="text-[10px] text-slate-400">Mastery</span>
                  </div>
                  <div className="flex flex-col py-1">
                    <span className="font-mono text-sm text-emerald-300 font-bold">380</span>
                    <span className="text-[10px] text-slate-400">KP of 1,600</span>
                  </div>
                </div>

                {/* Next Up Objective */}
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                    isDark ? 'bg-[#1e1f30] border-emerald-500/20' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-emerald-400 text-[18px]">finance_chip</span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 leading-none">Current Objective</span>
                    <span className={`text-xs font-semibold truncate mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Next: Mission 01 — Stochastic Arbitrage &amp; Spread Dampers
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    +120 KP
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-3 border-t border-slate-700/20">
                <button
                  onClick={() => onShowToast('Economics Track Mission 01 will unlock in the next research cycle!')}
                  className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                    isDark
                      ? 'bg-[#1e1f30] text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                  }`}
                >
                  <span>Open Economics Missions</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Disciplines Section */}
      {(filter === 'all' || filter === 'soon') && (
        <section className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-[22px]">hourglass_top</span>
              <h2 className={`font-headline-sm text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                UPCOMING RESEARCH DISCIPLINES
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">4 In Pipeline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Chemistry */}
            <div
              className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-[#12131b] border-violet-500/20 hover:border-violet-400/40' : 'bg-emerald-50/70 border-emerald-200'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-[#181926] text-violet-400' : 'bg-white text-emerald-600 shadow-sm'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">science</span>
                  </div>
                </div>
                <div>
                  <h4 className={`font-headline-sm text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Molecular Chemistry &amp; Reaction Kinetics
                  </h4>
                  <span className="font-mono text-[11px] text-slate-400">Prerequisite: Classical Physics</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Calibrate dynamic electron densities in 3D chambers, balance stoichiometric catalysts, and prevent runaway exothermic reactor breaches.
                </p>
                <div
                  className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                    isDark ? 'bg-[#181926] text-slate-300' : 'bg-white text-slate-700 shadow-xs'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px] text-amber-500">inventory_2</span>
                  <span>14 Lab Crises • 3D Orbital Sandbox</span>
                </div>
              </div>
            </div>

            {/* Card 2: CRISPR Genetics */}
            <div
              className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-[#12131b] border-violet-500/20 hover:border-violet-400/40' : 'bg-blue-50/70 border-blue-200'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-[#181926] text-teal-400' : 'bg-white text-blue-600 shadow-sm'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">biotech</span>
                  </div>
                </div>
                <div>
                  <h4 className={`font-headline-sm text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Evolutionary Biology &amp; CRISPR Genetics
                  </h4>
                  <span className="font-mono text-[11px] text-slate-400">Prerequisite: Foundation Biology</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Direct CRISPR sequence splicing simulations, model stochastic allele frequency drift, and engineer resistant pathogen cascades.
                </p>
                <div
                  className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                    isDark ? 'bg-[#181926] text-slate-300' : 'bg-white text-slate-700 shadow-xs'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px] text-amber-500">inventory_2</span>
                  <span>19 Genetic Playgrounds • Synthetic Bio</span>
                </div>
              </div>
            </div>

            {/* Card 3: Macro Geopolitics */}
            <div
              className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-[#12131b] border-violet-500/20 hover:border-violet-400/40' : 'bg-amber-50/70 border-amber-200'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-[#181926] text-amber-400' : 'bg-white text-amber-600 shadow-sm'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">public</span>
                  </div>
                </div>
                <div>
                  <h4 className={`font-headline-sm text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Macro History &amp; Geopolitics
                  </h4>
                  <span className="font-mono text-[11px] text-slate-400">Prerequisite: Quantitative Economics</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Resolve dynamic civilization collapse nodes, trade embargo chokepoints, and resource distribution crises across centuries of conflict.
                </p>
                <div
                  className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                    isDark ? 'bg-[#181926] text-slate-300' : 'bg-white text-slate-700 shadow-xs'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px] text-amber-500">inventory_2</span>
                  <span>12 Historical Nodes • War Game</span>
                </div>
              </div>
            </div>

            {/* Card 4: Climatology */}
            <div
              className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-[#12131b] border-violet-500/20 hover:border-violet-400/40' : 'bg-rose-50/70 border-rose-200'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-[#181926] text-rose-400' : 'bg-white text-rose-600 shadow-sm'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">tsunami</span>
                  </div>
                </div>
                <div>
                  <h4 className={`font-headline-sm text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Geophysical Geography &amp; Climatology
                  </h4>
                  <span className="font-mono text-[11px] text-slate-400">Prerequisite: Fluid Mechanics</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Simulate tectonic plate stress faults, real-time oceanic conveyor currents, and prevent runaway seismic subduction failures.
                </p>
                <div
                  className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                    isDark ? 'bg-[#181926] text-slate-300' : 'bg-white text-slate-700 shadow-xs'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px] text-amber-500">inventory_2</span>
                  <span>8 Simulations • Atmospheric GIS</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
