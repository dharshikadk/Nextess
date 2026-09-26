import React from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';

interface ProfileViewProps {
  theme: ThemeMode;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onOpenEditProfile: () => void;
  onShowToast: (msg: string) => void;
  onToggleGuest?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  theme,
  stats,
  onNavigate,
  onOpenEditProfile,
  onShowToast,
  onToggleGuest,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col w-full pb-20">
      {/* 1. Header / Profile Hero Card */}
      <section
        className={`w-full rounded-2xl p-6 shadow-xl relative overflow-hidden border mb-6 transition-all ${
          isDark
            ? 'bg-[#12131b] border-violet-500/25'
            : 'bg-gradient-to-br from-purple-50/90 via-white to-violet-50/70 border-violet-200'
        }`}
      >
        {/* Decorative ambient halo */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Avatar and Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-[#1e1f29] border border-violet-500/30 shadow-[0_0_24px_rgba(167,139,250,0.25)]">
                <img
                  src="https://lh3.googleusercontent.com/aida/AEtjO1UStlD9TYCj-UcTy0Wrx_g7YnNqeActRIwLdisx9Lcgbrron50YI8YmPeWBvqV8ryITARTAjxIvh__Mh-RbDJATz1C1rb8-MLwnwBvE1qMuR5l3JjyP4wLMZ8pLGO6mUkmypD9LWqi6eoRdRIgyOE7HQwjHnvdfpCZVFUv88q6AScoD59DOuMgtEfl10GslcZDqJZkK8sfgQFPgjNuN29vIrStQ2sd642NwQbwxSGbPGXv88iSm6ON49Q"
                  alt="Alex Vektor Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#242531] px-2.5 py-0.5 rounded-lg shadow-lg border border-violet-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_6px_rgba(165,137,248,0.8)]" />
                <span className="font-mono text-xs text-violet-300 font-bold">LVL {stats.level}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className={`font-headline-lg text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {stats.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 font-mono text-xs">
                  {stats.handle}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="font-mono text-xs text-violet-400 font-semibold">
                  {stats.profession || 'Theoretical Physics Researcher'}
                </span>
                <span className="text-slate-500">•</span>
                <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {stats.college || 'Stanford University'}
                </span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  {stats.userClass || 'Class of 2026'}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Action & Guest Mode Switch */}
          <div className="flex sm:flex-row lg:flex-col gap-2 shrink-0">
            <button
              onClick={onOpenEditProfile}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(139,92,246,0.35)] active:translate-y-0.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>Edit Profile</span>
            </button>

            {onToggleGuest && (
              <button
                onClick={onToggleGuest}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isDark
                    ? 'bg-[#181926] border-violet-500/20 text-slate-300 hover:text-white hover:bg-[#1e1f30]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-violet-400">
                  {stats.isGuest ? 'how_to_reg' : 'no_accounts'}
                </span>
                <span>{stats.isGuest ? 'Log In as Cadet Alex' : 'Switch to Guest Mode'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Core Metrics Ribbon / Key Stats (6 Bento metric cards with pastel variations in light mode) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {/* Card 1: Knowledge Points */}
        <div
          className={`rounded-2xl p-4 flex flex-col justify-between gap-3 border shadow-sm transition-all ${
            isDark ? 'bg-[#12131b] border-violet-500/15' : 'bg-purple-50/80 border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Knowledge Points
            </span>
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
              <span className="material-symbols-outlined text-[16px]">bolt</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`font-mono text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats.kp.toLocaleString()}
              </span>
              <span className="font-mono text-xs text-slate-400">KP</span>
            </div>
            <div className="mt-1.5 w-full bg-slate-700/20 h-1.5 rounded-full overflow-hidden">
              <div className="bg-violet-600 h-full rounded-full" style={{ width: '73.6%' }} />
            </div>
            <span className="font-mono text-[10px] text-slate-400 block mt-1">660 KP to Rank Tier V</span>
          </div>
        </div>

        {/* Card 2: Laboratory Coins */}
        <div
          className={`rounded-2xl p-4 flex flex-col justify-between gap-3 border shadow-sm transition-all ${
            isDark ? 'bg-[#12131b] border-amber-500/20' : 'bg-amber-50/80 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Credits
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined text-[16px]">monetization_on</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl font-bold text-amber-500">{stats.coins}</span>
              <span className="font-mono text-xs text-slate-400">Coins</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1 leading-tight">
              Ready for hints &amp; capsule unlocks
            </span>
          </div>
        </div>

        {/* Card 3: Current Streak */}
        <div
          className={`rounded-2xl p-4 flex flex-col justify-between gap-3 border shadow-sm transition-all ${
            isDark ? 'bg-[#12131b] border-orange-500/20' : 'bg-orange-50/80 border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Current Streak
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500">
              <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl font-bold text-orange-500">{stats.streakDays}</span>
              <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Days Active
              </span>
            </div>
            <span className="font-mono text-[10px] text-violet-400 block mt-1">+15% KP bonus active</span>
          </div>
        </div>

        {/* Card 4: Record Streak */}
        <div
          className={`rounded-2xl p-4 flex flex-col justify-between gap-3 border shadow-sm transition-all ${
            isDark ? 'bg-[#12131b] border-yellow-500/20' : 'bg-yellow-50/80 border-yellow-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Record Streak
            </span>
            <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-600">
              <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl font-bold text-amber-500">19</span>
              <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Days
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1 leading-tight">
              Logged Sprint #14 - Oct '24
            </span>
          </div>
        </div>

        {/* Card 5: Level Progress */}
        <div
          className={`rounded-2xl p-4 flex flex-col justify-between gap-3 border shadow-sm transition-all ${
            isDark ? 'bg-[#12131b] border-violet-500/15' : 'bg-indigo-50/80 border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Level Progress
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <span className="material-symbols-outlined text-[16px]">school</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className={`font-mono text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Lvl {stats.level}
              </span>
              <span className="font-mono text-xs text-violet-400 font-semibold">65%</span>
            </div>
            <div className="mt-1.5 w-full bg-slate-700/20 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: '65%' }} />
            </div>
            <span className="font-mono text-[10px] text-slate-400 block mt-1">Quantum Apprentice</span>
          </div>
        </div>

        {/* Card 6: 3-Day Contest Rank */}
        <div
          onClick={() => onNavigate('leaderboard')}
          className={`cursor-pointer rounded-2xl p-4 flex flex-col justify-between gap-3 border shadow-sm transition-all hover:scale-105 ${
            isDark ? 'bg-[#12131b] border-violet-500/20 hover:border-violet-400' : 'bg-pink-50/80 border-pink-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              3-Day League
            </span>
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400">
              <span className="material-symbols-outlined text-[16px]">military_tech</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-mono text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                #04
              </span>
              <span className="font-mono text-[10px] text-violet-400 uppercase font-bold">Div IV</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono mt-1">
              <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
              <span>45 KP to Podium (#3)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Earned Badges & Rewards (Clean Grid) */}
      <section
        className={`rounded-2xl p-6 border shadow-xl ${
          isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-400 text-[24px]">military_tech</span>
            <h2 className={`font-headline-md text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Earned Badges &amp; Rewards
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-400">5 UNLOCKED / 1 PENDING</span>
        </div>

        {/* 6 Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Badge 1: 7-Day Lock-in Streak */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              isDark ? 'bg-[#181926] border-white/5 hover:border-violet-500/30' : 'bg-orange-50/60 border-orange-200'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
              <span className="material-symbols-outlined text-[24px]">local_fire_department</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h3 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  7-Day Lock-in Streak
                </h3>
                <span className="material-symbols-outlined text-[15px] text-emerald-400">check_circle</span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Completed 7 consecutive days of daily STEM directives without missing sync.
              </p>
            </div>
          </div>

          {/* Badge 2: Flawless Diagnostic */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              isDark ? 'bg-[#181926] border-white/5 hover:border-violet-500/30' : 'bg-purple-50/60 border-purple-200'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 shrink-0">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h3 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Flawless Diagnostic
                </h3>
                <span className="material-symbols-outlined text-[15px] text-emerald-400">check_circle</span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Solved 5 mission simulation modules with zero trial errors on the very first attempt.
              </p>
            </div>
          </div>

          {/* Badge 3: Harmonic Guardian */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              isDark ? 'bg-[#181926] border-white/5 hover:border-violet-500/30' : 'bg-indigo-50/60 border-indigo-200'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <span className="material-symbols-outlined text-[24px]">graphic_eq</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h3 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Harmonic Guardian
                </h3>
                <span className="material-symbols-outlined text-[15px] text-emerald-400">check_circle</span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Mastered Tacoma Narrows resonance crisis (Mission 01 Apex) with zero structural drift.
              </p>
            </div>
          </div>

          {/* Badge 4: Podium Finisher */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              isDark ? 'bg-[#181926] border-white/5 hover:border-violet-500/30' : 'bg-amber-50/60 border-amber-200'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <span className="material-symbols-outlined text-[24px]">stars</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h3 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Podium Finisher
                </h3>
                <span className="material-symbols-outlined text-[15px] text-emerald-400">check_circle</span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Ranked in the Top 3 of an official 3-Day Master League tournament.
              </p>
            </div>
          </div>

          {/* Badge 5: Sandbox Pioneer */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              isDark ? 'bg-[#181926] border-white/5 hover:border-violet-500/30' : 'bg-emerald-50/60 border-emerald-200'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <span className="material-symbols-outlined text-[24px]">science</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h3 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Sandbox Pioneer
                </h3>
                <span className="material-symbols-outlined text-[15px] text-emerald-400">check_circle</span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Tested and calibrated 10+ live WebGL interactive physics modules.
              </p>
            </div>
          </div>

          {/* Badge 6: Obsidian Streak (Locked) */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 opacity-60 ${
              isDark ? 'bg-[#181926]/50 border-white/5' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-slate-700/20 flex items-center justify-center text-slate-400 shrink-0">
              <span className="material-symbols-outlined text-[24px]">lock</span>
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xs text-slate-400">Obsidian Streak</h3>
                <span className="font-mono text-[10px] text-slate-400">7 / 30 d</span>
              </div>
              <div className="mt-1.5 w-full bg-slate-700/20 h-1 rounded-full overflow-hidden">
                <div className="bg-violet-600 h-full rounded-full" style={{ width: '23.3%' }} />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Maintain daily telemetry streak for 30 consecutive calendar cycles.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
