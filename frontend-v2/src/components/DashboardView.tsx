import React from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';

interface DashboardViewProps {
  theme: ThemeMode;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onOpenAuth: () => void;
  onClaimSurge: () => void;
  dailyQuote?: {quote:string;source:string}|null;
  directives?: Array<{id:string;title:string;description:string;rewardXp:number;rewardCoins:number;claimed:boolean}>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  theme,
  stats,
  onNavigate,
  onOpenAuth,
  onClaimSurge,
  dailyQuote,
  directives = [],
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Quote Ticker & Laboratory Status Strip */}
      <section className="mb-4">
        <div
          className={`relative overflow-hidden rounded-xl px-4 py-2.5 border shadow-sm transition-colors ${
            isDark
              ? 'bg-[#12131b] border-violet-500/20 text-slate-300'
              : 'bg-violet-50/70 border-violet-200 text-slate-700'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  isDark ? 'bg-[#1e1f30] text-violet-300' : 'bg-white text-violet-600 shadow-sm'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">format_quote</span>
              </span>
              <p className="text-xs truncate">
                <span className="italic">
                  {dailyQuote?.quote || 'No daily quote available.'}
                </span>
                <span
                  className={`ml-2 font-mono font-semibold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  — {dailyQuote?.source || 'Nextess'}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="font-mono text-[11px] text-violet-400">DAILY QUOTES</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Command Deck: Greeting, Streak Engine & Velocity Banner */}
      <section className="mb-6">
        <div
          className={`relative overflow-hidden rounded-2xl p-6 border shadow-xl transition-all ${
            isDark
              ? 'bg-[#181926] border-violet-500/20 text-slate-200'
              : 'bg-gradient-to-br from-white via-purple-50/40 to-indigo-50/40 border-violet-200 text-slate-800'
          }`}
        >
          {/* Ambient Backlight */}
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5">
            {/* Top Row: Salutation + Solves Achievement Callout */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] text-violet-400 uppercase tracking-widest font-bold">
                    Explore Experiment
                  </span>
                  <span className="text-slate-500 font-mono text-xs">•</span>
                  <span className="font-mono text-[11px] text-amber-400 uppercase tracking-wider font-semibold">
                    Solve
                  </span>
                </div>
                <h1
                  className={`font-headline-lg text-3xl md:text-4xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {(() => { const h=Number(new Intl.DateTimeFormat('en-IN',{hour:'numeric',hour12:false,timeZone:'Asia/Kolkata'}).format(new Date())); return (h<12?'Good morning':h<17?'Good afternoon':'Good evening') + ', ' + (stats.name || 'Cadet') + '!'; })()}
                </h1>
              </div>

              {/* Streak & Target Lock Pill Stack */}
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm ${
                    isDark
                      ? 'bg-[#1e1f30] border-violet-500/20'
                      : 'bg-white border-orange-200'
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
                    <span className="material-symbols-outlined text-[26px]">local_fire_department</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {stats.streakDays} Days
                      </span>
                      <span className="text-[10px] font-mono bg-orange-500/20 text-orange-400 px-1.5 py-0.2 rounded font-bold uppercase border border-orange-500/30">
                        Locked
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-24 h-1.5 rounded-full bg-slate-700/30 overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full" style={{ width: '70%' }} />
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">7/10 Target</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm ${
                    isDark
                      ? 'bg-[#1e1f30] border-violet-500/20'
                      : 'bg-white border-violet-200'
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                    <span className="material-symbols-outlined text-[26px]">speed</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-violet-400 leading-none">
                      +180 KP/hr
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 mt-1">
                      Velocity: +18% peak
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3-In-A-Row Milestone Banner Ribbon */}
            <div
              className={`flex flex-col md:flex-row items-center justify-between gap-3 rounded-xl px-4 py-3 border shadow-sm ${
                isDark
                  ? 'bg-[#1e1f30] border-violet-500/20'
                  : 'bg-amber-50/80 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/20 text-amber-500">
                  <span className="material-symbols-outlined text-[20px]">stars</span>
                </span>
                <div>
                  <span className="text-sm text-amber-500 font-bold">
                    Hyperfocus Surge Activated: 3-in-a-row Perfect Solves!
                  </span>
                  <span className={`hidden sm:inline text-xs ml-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    • Double KP modifier unlocked for the next 42 minutes.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`font-mono text-xs px-2 py-1 rounded border font-semibold ${
                    isDark
                      ? 'bg-[#08090d] text-violet-300 border-violet-500/30'
                      : 'bg-white text-violet-800 border-violet-200'
                  }`}
                >
                  2.0x Boost
                </span>
                <button
                  onClick={onClaimSurge}
                  className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-sm"
                >
                  Claim 50 KP
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox & Activity Deck Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Active Mission Resume Card (7 cols) */}
        <div
          className={`lg:col-span-7 flex flex-col justify-between rounded-2xl p-5 border shadow-lg relative overflow-hidden transition-all ${
            isDark
              ? 'bg-[#12131b] border-violet-500/20'
              : 'bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/60 border-indigo-200'
          }`}
        >
          <div className="absolute right-0 top-0 w-48 h-48 bg-violet-500/10 rounded-bl-full pointer-events-none" />
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-violet-500/20 text-violet-400">
                  <span className="material-symbols-outlined text-[16px]">play_circle</span>
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-violet-400 font-bold">
                  Active Lab Chamber
                </span>
              </div>
            </div>

            <div>
              <h2 className={`font-headline-md text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Bridge Stability &amp; Resonance
              </h2>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Reconcile mechanical oscillator frequencies to prevent Tacoma Narrows aeroelastic flutter. Oscillations currently damping at 1.42 rad/sec.
              </p>
            </div>

            {/* Stage Progress HUD */}
            <div
              className={`rounded-xl p-3 flex flex-col gap-2 border ${
                isDark
                  ? 'bg-[#181926] border-violet-500/20'
                  : 'bg-white/90 border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Level 2 of 4 • Question 3 of 5
                </span>
                <span className="font-mono text-xs text-violet-400 font-bold">60% Complete</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-700/30 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.6)]"
                  style={{ width: '60%' }}
                />
              </div>
              <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] pt-0.5">
                <span>Harmonic Damping Check</span>
                <span className="text-amber-400 font-medium">+140 KP on solve</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="material-symbols-outlined text-[18px] text-violet-400">tune</span>
              <span className="font-mono">Sandbox: Euler-Bernoulli Beam Simulator</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('mission-chamber')}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-[0_4px_0_#5b21b6] active:translate-y-0.5 transition-all flex items-center gap-1.5"
              >
                <span>Resume Mission</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Daily Objectives & Micro-Tasks (5 cols) */}
        <div
          className={`lg:col-span-5 flex flex-col justify-between rounded-2xl p-5 border shadow-lg transition-all ${
            isDark
              ? 'bg-[#12131b] border-violet-500/20'
              : 'bg-gradient-to-br from-amber-50/60 via-white to-orange-50/50 border-amber-200'
          }`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-amber-400/20 text-amber-500">
                  <span className="material-symbols-outlined text-[16px]">task_alt</span>
                </span>
                <h3 className={`font-headline-sm text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Daily Directives
                </h3>
              </div>
              <span className="font-mono text-xs text-violet-400 font-semibold">2/3 Done</span>
            </div>

            <ul className="flex flex-col gap-2">
              {/* Item 1 */}
              <li
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                  isDark ? 'bg-[#181926] border-transparent' : 'bg-white/80 border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-violet-400 text-[20px] mt-0.5 shrink-0">
                  check_circle
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs text-slate-400 line-through">
                    Solve 1 Vector Equilibrium equation
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">+60 KP claimed</span>
                </div>
                <span className="font-mono text-[10px] text-violet-400 px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
                  DONE
                </span>
              </li>

              {/* Item 2 */}
              <li
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                  isDark ? 'bg-[#181926] border-transparent' : 'bg-white/80 border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-violet-400 text-[20px] mt-0.5 shrink-0">
                  check_circle
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs text-slate-400 line-through">
                    Run 3 fluid Reynolds simulations
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">+80 KP claimed</span>
                </div>
                <span className="font-mono text-[10px] text-violet-400 px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
                  DONE
                </span>
              </li>

              {/* Item 3: Active Actionable */}
              <li
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border shadow-sm transition-all ${
                  isDark
                    ? 'bg-[#1e1f30] border-violet-500/30'
                    : 'bg-amber-100/70 border-amber-300'
                }`}
              >
                <span className="material-symbols-outlined text-amber-500 text-[20px] mt-0.5 shrink-0">
                  radio_button_unchecked
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Complete 1 Perfect Resonance Test
                  </span>
                  <span className="font-mono text-[11px] text-amber-500">
                    Current: 0/1 • Reward: +120 KP &amp; 15 Crystals
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('mission-chamber')}
                  className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono text-xs font-bold hover:brightness-110 shadow-sm"
                >
                  GO
                </button>
              </li>
            </ul>
          </div>

          <div className="pt-3 flex items-center justify-between text-slate-400 font-mono text-xs">
            <span>Resets in: 06h 44m</span>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="text-violet-400 hover:underline font-semibold"
            >
              View Weekly Quests →
            </button>
          </div>
        </div>
      </section>

      {/* Competitive League Snapshot Banner */}
      <section className="mb-6">
        <div
          onClick={() => onNavigate('leaderboard')}
          className={`cursor-pointer rounded-2xl p-5 border shadow-md transition-all hover:scale-[1.008] ${
            isDark
              ? 'bg-[#181926] border-violet-500/20 hover:border-violet-500/40'
              : 'bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 border-purple-200 shadow-sm'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.2)]">
                <span className="material-symbols-outlined text-[28px]">military_tech</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-headline-sm text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    3-Day Master League Leaderboard
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-violet-500/20 text-violet-300 font-bold uppercase border border-violet-500/30">
                    Division IV
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  You are currently <strong className="text-amber-400 font-semibold">Rank #4</strong> (1,840 KP). Only{' '}
                  <span className="text-violet-400 font-bold">45 KP</span> away from the Top-3 Promotion Zone.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex flex-col text-right">
                <span className="font-mono text-[10px] uppercase text-slate-400">Sprint Closes In</span>
                <span className="font-mono text-violet-400 font-bold text-lg">18:22:09</span>
              </div>
              <span className="material-symbols-outlined text-violet-400 text-[20px]">chevron_right</span>
            </div>
          </div>
        </div>
      </section>

      {/* Suggested / Coming Soon Subjects Section */}
      <section className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-1 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
              <h2 className={`font-headline-lg text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Explore &amp; Pre-Enroll in Next Subjects (Suggested)
              </h2>
            </div>
          </div>
        </div>

        {/* Suggested Subjects 4-Column Grid with Distinct Pastel derivative blocks in light theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Molecular Chemistry */}
          <div
            onClick={() => onNavigate('disciplines')}
            className={`cursor-pointer flex flex-col justify-between rounded-2xl p-4 border transition-all hover:scale-[1.02] shadow-sm ${
              isDark
                ? 'bg-[#12131b] border-violet-500/20 hover:border-violet-400/40'
                : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                    isDark ? 'bg-[#181926] text-violet-400 border-violet-500/20' : 'bg-white text-emerald-600 border-emerald-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">biotech</span>
                </span>
              </div>
              <h3 className={`font-headline-sm text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Molecular Chemistry
              </h3>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Reaction Kinetics &amp; Hybridization. Orbital wave functions and enzymatic catalysts.
              </p>
            </div>
          </div>

          {/* Card 2: Evolutionary Biology */}
          <div
            onClick={() => onNavigate('disciplines')}
            className={`cursor-pointer flex flex-col justify-between rounded-2xl p-4 border transition-all hover:scale-[1.02] shadow-sm ${
              isDark
                ? 'bg-[#12131b] border-violet-500/20 hover:border-violet-400/40'
                : 'bg-blue-50/70 border-blue-200 hover:border-blue-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                    isDark ? 'bg-[#181926] text-teal-400 border-teal-500/20' : 'bg-white text-blue-600 border-blue-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">genetics</span>
                </span>
              </div>
              <h3 className={`font-headline-sm text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Evolutionary Biology
              </h3>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                CRISPR Splicing &amp; Population Genetics. Stochastic allele frequency drift algorithms.
              </p>
            </div>
          </div>

          {/* Card 3: Macro History & Geopolitics */}
          <div
            onClick={() => onNavigate('disciplines')}
            className={`cursor-pointer flex flex-col justify-between rounded-2xl p-4 border transition-all hover:scale-[1.02] shadow-sm ${
              isDark
                ? 'bg-[#12131b] border-violet-500/20 hover:border-violet-400/40'
                : 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                    isDark ? 'bg-[#181926] text-amber-400 border-amber-500/20' : 'bg-white text-amber-600 border-amber-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">public</span>
                </span>
              </div>
              <h3 className={`font-headline-sm text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Macro History &amp; Geopolitics
              </h3>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Logistics &amp; Civilizational Dynamics. Maritime choke points and energy transmission networks.
              </p>
            </div>
          </div>

          {/* Card 4: Geophysical Geography */}
          <div
            onClick={() => onNavigate('disciplines')}
            className={`cursor-pointer flex flex-col justify-between rounded-2xl p-4 border transition-all hover:scale-[1.02] shadow-sm ${
              isDark
                ? 'bg-[#12131b] border-violet-500/20 hover:border-violet-400/40'
                : 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                    isDark ? 'bg-[#181926] text-rose-400 border-rose-500/20' : 'bg-white text-rose-600 border-rose-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">terrain</span>
                </span>
              </div>
              <h3 className={`font-headline-sm text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Geophysical Geography
              </h3>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Tectonic Stress &amp; Climatology. Atmospheric heat transfer models and oceanic currents.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
