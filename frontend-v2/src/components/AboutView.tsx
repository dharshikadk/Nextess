import React from 'react';
import { ActivePage, ThemeMode } from '../types';

interface AboutViewProps {
  theme: ThemeMode;
  onNavigate: (page: ActivePage) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  theme,
  onNavigate,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col w-full pb-20 max-w-7xl mx-auto">
      {/* Hero / Purpose Section */}
      <section
        className={`relative overflow-hidden rounded-2xl p-6 md:p-8 border shadow-2xl mb-8 flex flex-col gap-4 ${
          isDark
            ? 'bg-[#12131b] border-violet-500/20'
            : 'bg-gradient-to-br from-purple-50/90 via-white to-violet-50/80 border-purple-200'
        }`}
      >
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 z-10">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm ${
              isDark ? 'bg-[#181926] border-violet-500/30' : 'bg-white border-violet-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_#a78bfa]" />
            <span className="font-mono text-[10px] text-violet-400 uppercase tracking-widest font-semibold">
              ABOUT NEXTESS // THE GAMIFIED LEARNING PLATFORM
            </span>
          </div>
        </div>

        <div className="z-10 flex flex-col gap-3 max-w-4xl">
          <h1 className={`font-headline-lg text-2xl md:text-4xl font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Reinventing STEM Education Through{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400">
              Kinetic Problem Solving
            </span>
          </h1>
          <p className={`text-sm leading-relaxed max-w-3xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Nextess was created with a single mission: to move education beyond passive videos and rote memorization. In the real world, engineers, physicists, and economists don't take multiple-choice tests—they diagnose systems, tune variables, and resolve high-stakes crises. Nextess combines gamified habit loops, live interactive physics &amp; economic sandboxes, and narrative missions to turn abstract formulas into deep intuitive mastery.
          </p>
        </div>
      </section>

      {/* Visual Flow: How a Nextess Mission Works */}
      <section className="flex flex-col gap-3 mb-8">
        <h2 className={`font-headline-lg text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          How a Nextess Mission Works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all hover:border-violet-400/50 ${
              isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-purple-50/70 border-purple-200'
            }`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-violet-400 bg-violet-600/10 border border-violet-500/20 px-2 py-0.5 rounded-lg font-bold">
                  01
                </span>
                <span className="material-symbols-outlined text-slate-400 text-[20px]">
                  assignment_turned_in
                </span>
              </div>
              <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Mission Briefing
              </h4>
              <p className={`text-xs leading-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Real-world role assignment, crisis background, and technical telemetry dossier.
              </p>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-700/20 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 w-1/4" />
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all hover:border-violet-400/50 ${
              isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-indigo-50/70 border-indigo-200'
            }`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-violet-400 bg-violet-600/10 border border-violet-500/20 px-2 py-0.5 rounded-lg font-bold">
                  02
                </span>
                <span className="material-symbols-outlined text-slate-400 text-[20px]">lightbulb</span>
              </div>
              <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Learning Capsule
              </h4>
              <p className={`text-xs leading-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Concise, bite-sized interactive concept intro with tap-and-continue clarity.
              </p>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-700/20 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 w-2/4" />
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all hover:border-violet-400/50 ${
              isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-emerald-50/70 border-emerald-200'
            }`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-violet-400 bg-violet-600/10 border border-violet-500/20 px-2 py-0.5 rounded-lg font-bold">
                  03
                </span>
                <span className="material-symbols-outlined text-slate-400 text-[20px]">tune</span>
              </div>
              <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Level Challenges
              </h4>
              <p className={`text-xs leading-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                4-5 focused numerical and conceptual challenges linked directly to live simulation.
              </p>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-700/20 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 w-3/4" />
            </div>
          </div>

          {/* Step 4 */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all hover:border-violet-400/50 ${
              isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-violet-400 bg-violet-600/10 border border-violet-500/20 px-2 py-0.5 rounded-lg font-bold">
                  04
                </span>
                <span className="material-symbols-outlined text-slate-400 text-[20px]">
                  celebration
                </span>
              </div>
              <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Mastery &amp; Rewards
              </h4>
              <p className={`text-xs leading-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Earn KP, gain coins, level up rank, and celebrate breakthrough moments with Sparky.
              </p>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-700/20 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 w-full shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
            </div>
          </div>
        </div>
      </section>

      {/* Supported & Upcoming Disciplines Roadmap */}
      <section className="flex flex-col gap-3">
        <div>
          <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Academic Matrix
          </span>
          <h2 className={`font-headline-lg text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Supported &amp; Upcoming Disciplines
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Active Now */}
          <div
            className={`p-5 rounded-2xl border shadow-lg flex flex-col gap-3 ${
              isDark ? 'bg-[#161726] border-violet-500/20' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />
                <span className={`font-semibold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Active Live Disciplines
                </span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30">
                DEPLOYED
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div
                onClick={() => onNavigate('missions-map')}
                className={`cursor-pointer p-3 rounded-xl border transition-all ${
                  isDark ? 'bg-[#1c1d2e] border-slate-700/30 hover:border-violet-400' : 'bg-purple-50/70 border-purple-200 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-violet-400">Classical &amp; Modern Physics</span>
                  <span className="font-mono text-[10px] text-slate-400">28 Modules</span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Wave dynamics, resonance harmonics, quantum barrier tunneling, and orbital mechanics.
                </p>
              </div>

              <div
                onClick={() => onNavigate('disciplines')}
                className={`cursor-pointer p-3 rounded-xl border transition-all ${
                  isDark ? 'bg-[#1c1d2e] border-slate-700/30 hover:border-emerald-400' : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-emerald-400">Quantitative Economics</span>
                  <span className="font-mono text-[10px] text-slate-400">19 Modules</span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Stochastic liquidity pools, automated market makers, Nash equilibria, and game theory spirals.
                </p>
              </div>
            </div>
          </div>

          {/* In Pipeline */}
          <div
            className={`p-5 rounded-2xl border shadow-lg flex flex-col gap-3 ${
              isDark ? 'bg-[#161726] border-violet-500/20' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className={`font-semibold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  In Active Development Pipeline
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">4 Tracks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                className={`p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#1c1d2e] border-slate-700/30' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-violet-400">
                  <span className="material-symbols-outlined text-[16px]">science</span>
                  <span className="font-medium text-xs">Molecular Chemistry</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Reaction kinetics &amp; molecular bonding lattice engines.
                </p>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#1c1d2e] border-slate-700/30' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-teal-400">
                  <span className="material-symbols-outlined text-[16px]">biotech</span>
                  <span className="font-medium text-xs">Genetics &amp; Evolution</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Natural selection models &amp; CRISPR sequence sandbox.
                </p>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#1c1d2e] border-slate-700/30' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-rose-400">
                  <span className="material-symbols-outlined text-[16px]">terrain</span>
                  <span className="font-medium text-xs">Geophysical Geography</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Plate tectonics, atmospheric fluid cycles, and climate maps.
                </p>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#1c1d2e] border-slate-700/30' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="material-symbols-outlined text-[16px]">account_balance</span>
                  <span className="font-medium text-xs">Macro Geopolitics</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Trade sanction flow-charts and resource distribution trees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
