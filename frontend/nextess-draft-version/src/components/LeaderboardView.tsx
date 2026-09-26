import React, { useState } from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';

interface LeaderboardViewProps {
  theme: ThemeMode;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onShowToast: (msg: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  theme,
  stats,
  onNavigate,
  onShowToast,
}) => {
  const isDark = theme === 'dark';
  const [claimedPerk, setClaimedPerk] = useState<boolean>(false);

  const handleClaimPerk = () => {
    if (!claimedPerk) {
      setClaimedPerk(true);
      onShowToast('⚡ Sparky 2x Velocity Booster (+150 KP Surge) Activated for 45 minutes!');
    } else {
      onShowToast('Perk already active! 42 minutes remaining.');
    }
  };

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Header Action Ribbon */}
      <div className="flex flex-wrap items-end justify-between gap-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
            <span className="font-mono text-xs uppercase tracking-wider text-violet-400 font-bold">
              Tournament Hub
            </span>
          </div>
          <h1
            className={`font-headline-lg text-2xl md:text-3xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Streaks &amp; Leaderboard
          </h1>
        </div>

        {/* Streak Mode State Switcher */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl border shadow-md ${
            isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'
          }`}
        >
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold ${
              isDark
                ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                : 'bg-violet-600 text-white shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-orange-500">
              local_fire_department
            </span>
            <span>Active (7-Day)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 12 Columns */}
      <div className="grid grid-cols-12 gap-6 mt-2 items-start">
        {/* Left & Center Column: Streaks + Tournament (Cols 1-8) */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
          {/* 1. STREAK CENTRAL SHOWCASE */}
          <div
            className={`relative overflow-hidden rounded-2xl p-6 border shadow-xl transition-all ${
              isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-gradient-to-br from-orange-50/60 via-white to-amber-50/50 border-orange-200'
            }`}
          >
            {/* Ambient Glow */}
            <div className="absolute -right-16 -top-16 w-72 h-72 bg-orange-500/15 rounded-full blur-[90px] pointer-events-none" />

            {/* Active Streak UI */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Flaming Icon Shield */}
                  <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-[#181926] border border-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.35)] shrink-0">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-rose-600/30 via-orange-500/30 to-amber-400/20 animate-pulse" />
                    <span className="material-symbols-outlined text-[46px] text-orange-500 relative drop-shadow-[0_0_14px_rgba(249,115,22,0.8)]">
                      local_fire_department
                    </span>
                    <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-orange-600 text-white font-mono text-[9px] font-bold shadow-md">
                      HOT
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <h2 className={`font-headline-lg text-2xl font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      7 DAY STREAK
                      <span className="material-symbols-outlined text-amber-400 text-[26px]">
                        verified
                      </span>
                    </h2>
                  </div>
                </div>
              </div>

              {/* Weekly Calendar Matrix */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="font-mono text-[11px] text-slate-400 tracking-wider uppercase font-semibold">
                  Weekly Streak
                </span>
                <div className="grid grid-cols-7 gap-2">
                  {[
                    { day: 'MON', kp: '120KP' },
                    { day: 'TUE', kp: '180KP' },
                    { day: 'WED', kp: '95KP' },
                    { day: 'THU', kp: '240KP' },
                    { day: 'FRI', kp: '310KP' },
                    { day: 'SAT', kp: '450KP' },
                  ].map((item) => (
                    <div
                      key={item.day}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border shadow-xs ${
                        isDark ? 'bg-[#181926] border-violet-500/10' : 'bg-white border-slate-200'
                      }`}
                    >
                      <span className="font-mono text-xs text-slate-400">{item.day}</span>
                      <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-500 shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">
                          local_fire_department
                        </span>
                      </div>
                      <span className={`font-mono text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.kp}
                      </span>
                    </div>
                  ))}

                  {/* Sun (Today - Active Completed) */}
                  <div
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border shadow-md ${
                      isDark ? 'bg-violet-600/20 border-violet-500/50 shadow-[0_0_16px_rgba(139,92,246,0.3)]' : 'bg-violet-100 border-violet-400'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-violet-400 font-bold">SUN</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </div>
                    <span className="font-mono text-[11px] text-violet-400 font-bold">TODAY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 3-DAY LIVE CONTEST LEAGUE (QUANTUM MASTERS LEAGUE) */}
          <div
            className={`flex flex-col gap-4 rounded-2xl p-6 border shadow-xl ${
              isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'
            }`}
          >
            {/* Contest Header & Live Timer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-700/20">
              <div className="flex flex-col gap-0.5">
                <span className="px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/30 text-violet-400 font-mono text-[10px] font-bold uppercase w-fit">
                  3-Day Sprint League
                </span>
                <h2 className={`font-headline-md text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  3-Day Master League Leaderboard
                </h2>
              </div>

              {/* Countdown Timer Block */}
              <div
                className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl border shadow-inner ${
                  isDark ? 'bg-[#181926] border-violet-500/20' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400">
                  <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-slate-400 uppercase">
                    Contest Window Closes In
                  </span>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-violet-400">
                    <span className="px-1.5 py-0.2 rounded bg-black/40 text-violet-300">18</span>h{' '}
                    <span className="px-1.5 py-0.2 rounded bg-black/40 text-violet-300">42</span>m
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Podium for Top 3 Toppers */}
            <div className="pt-2 pb-2">
              <div className="font-mono text-[11px] text-slate-400 uppercase tracking-widest text-center mb-3 font-semibold">
                Current Projected Podium
              </div>
              <div className="grid grid-cols-3 gap-3 items-end max-w-lg mx-auto pt-2">
                {/* Silver (#2) */}
                <div className="flex flex-col items-center gap-1.5 order-1">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden p-0.5 shadow-lg ring-2 ring-slate-400/40">
                      <img
                        className="w-full h-full object-cover rounded-full"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOG0tiwXS28pkr4yZp6VjpdPvaxAMNHFgziS_RazryaRfy9-unN343hRQzlleU-nUz8xVUtUUbAaQHZ5JHwq5XkZnJ9XmhUkVOhDFtn_LtDGaDA_D2cGJLpNuPRIqoxMsZ56DsQTHlIanN9-rAc9j0mleHLLaErFhfMbFgAJeS7nUX7MzVD0xnK-SEQF6jHKadpLeK1kHgi0T8td8Gfydo6tAMxSY5efdrCtEYsssAAQ1JW_e3NHs"
                        alt="Val_Vektor"
                      />
                    </div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-200 font-mono text-[9px] font-bold border border-slate-400">
                      🥈 2ND
                    </div>
                  </div>
                  <div className="text-center mt-1">
                    <span className={`text-xs font-bold block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Val_Vektor
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 font-bold">2,110 KP</span>
                  </div>
                  <div
                    className={`w-full h-20 rounded-t-2xl border-t border-x border-slate-400/30 flex items-center justify-center shadow-inner ${
                      isDark ? 'bg-[#181926]' : 'bg-slate-200'
                    }`}
                  >
                    <span className="text-xl text-slate-400 font-bold opacity-50">2</span>
                  </div>
                </div>

                {/* Gold (#1) */}
                <div className="flex flex-col items-center gap-1.5 order-2">
                  <div className="relative">
                    <span className="material-symbols-outlined text-[20px] text-amber-400 absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce">
                      military_tech
                    </span>
                    <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 p-0.5 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                      <img
                        className="w-full h-full object-cover rounded-full"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2goN9E4l0l-rB_fcKpPUj1ar14McnBy-IOMTMtkh71tAf6j2xECq5crIRZG0-YRt7Lmzxx_9ug1bSoZrhDH4rQfv1rUvUhG6F4EYoDs1qcDhr9uwyd2JCLluVyUxWa4jotHEdGhMjdCYwz69m8HljCf7UtIGUBdMEvssfdpH4M8IrmBPl-9VbG3CZoHwAx5BamM0bDCq785JmRM38WT3GsvtsBvQL4SeSn8folurxqoT5zHvo3gw"
                        alt="Nova_Dirac"
                      />
                    </div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-400 text-slate-950 font-mono text-[10px] font-bold shadow-md">
                      🥇 1ST
                    </div>
                  </div>
                  <div className="text-center mt-1">
                    <span className={`text-xs font-bold block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Nova_Dirac
                    </span>
                    <span className="font-mono text-[11px] text-amber-500 font-bold">2,490 KP</span>
                  </div>
                  <div
                    className={`w-full h-28 rounded-t-2xl border-t border-x border-amber-400/40 flex flex-col items-center justify-center shadow-lg ${
                      isDark ? 'bg-gradient-to-t from-[#181926] to-[#242535]' : 'bg-amber-100'
                    }`}
                  >
                    <span className="text-2xl text-amber-500 font-bold">1</span>
                    <span className="font-mono text-[9px] text-violet-400 font-semibold uppercase">
                      PROMOTED
                    </span>
                  </div>
                </div>

                {/* Bronze (#3) */}
                <div className="flex flex-col items-center gap-1.5 order-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden p-0.5 shadow-lg ring-2 ring-amber-600/40">
                      <img
                        className="w-full h-full object-cover rounded-full"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWR3h6Xqp8i52m5BuAcE0g1SKh51rJscH3xBBBykj6Au0q8CyJr-uUhWc7WixqrK8urfxaLwEUN5yINR71O7oUVOO7uCwU0OGnSqLaP-9LO_aBM16H3K7yOpeyXk0emJe6DYqfAMfIro6sf5sFrWNGulMX0ygEpDcJ2HmobcKkArIdbuyrv-33co9oKH5Pqttg5AD-t8jL63yIS7rkt66vJa_ZmXbTqKk50KKs2TEcmnkW1Hiq73A"
                        alt="QuantPulse"
                      />
                    </div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 font-mono text-[9px] font-bold border border-amber-600">
                      🥉 3RD
                    </div>
                  </div>
                  <div className="text-center mt-1">
                    <span className={`text-xs font-bold block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      QuantPulse
                    </span>
                    <span className="font-mono text-[11px] text-amber-500 font-bold">1,905 KP</span>
                  </div>
                  <div
                    className={`w-full h-14 rounded-t-2xl border-t border-x border-amber-600/30 flex items-center justify-center shadow-inner ${
                      isDark ? 'bg-[#181926]' : 'bg-amber-50'
                    }`}
                  >
                    <span className="text-xl text-amber-600 font-bold opacity-50">3</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-Time Leaderboard Table */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-3 uppercase">
                <div className="flex items-center gap-6">
                  <span>Rank</span>
                  <span>Competitor</span>
                </div>
                <div className="flex items-center gap-6">
                  <span>Streak</span>
                  <span>KP Velocity</span>
                </div>
              </div>

              {/* Rank 01 */}
              <div
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                  isDark ? 'bg-[#181926] border-violet-500/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 font-mono text-xs font-bold text-amber-500 text-center">01</span>
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400/40">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2goN9E4l0l-rB_fcKpPUj1ar14McnBy-IOMTMtkh71tAf6j2xECq5crIRZG0-YRt7Lmzxx_9ug1bSoZrhDH4rQfv1rUvUhG6F4EYoDs1qcDhr9uwyd2JCLluVyUxWa4jotHEdGhMjdCYwz69m8HljCf7UtIGUBdMEvssfdpH4M8IrmBPl-9VbG3CZoHwAx5BamM0bDCq785JmRM38WT3GsvtsBvQL4SeSn8folurxqoT5zHvo3gw"
                      alt="Nova_Dirac"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Nova_Dirac</span>
                    <span className="font-mono text-[10px] text-slate-400">Lvl 19 • Relativistic Mechanics</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 font-mono text-xs text-orange-400">
                    <span className="material-symbols-outlined text-[15px]">local_fire_department</span>
                    14d
                  </div>
                  <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    2,490 KP
                  </span>
                </div>
              </div>

              {/* Rank 02 */}
              <div
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                  isDark ? 'bg-[#181926] border-violet-500/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 font-mono text-xs font-bold text-slate-400 text-center">02</span>
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-400/40">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOG0tiwXS28pkr4yZp6VjpdPvaxAMNHFgziS_RazryaRfy9-unN343hRQzlleU-nUz8xVUtUUbAaQHZ5JHwq5XkZnJ9XmhUkVOhDFtn_LtDGaDA_D2cGJLpNuPRIqoxMsZ56DsQTHlIanN9-rAc9j0mleHLLaErFhfMbFgAJeS7nUX7MzVD0xnK-SEQF6jHKadpLeK1kHgi0T8td8Gfydo6tAMxSY5efdrCtEYsssAAQ1JW_e3NHs"
                      alt="Val_Vektor"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Val_Vektor</span>
                    <span className="font-mono text-[10px] text-slate-400">Lvl 16 • Semiconductor Physics</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 font-mono text-xs text-orange-400">
                    <span className="material-symbols-outlined text-[15px]">local_fire_department</span>
                    9d
                  </div>
                  <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    2,110 KP
                  </span>
                </div>
              </div>

              {/* Rank 03 */}
              <div
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                  isDark ? 'bg-[#181926] border-violet-500/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 font-mono text-xs font-bold text-amber-500 text-center">03</span>
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-600/40">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWR3h6Xqp8i52m5BuAcE0g1SKh51rJscH3xBBBykj6Au0q8CyJr-uUhWc7WixqrK8urfxaLwEUN5yINR71O7oUVOO7uCwU0OGnSqLaP-9LO_aBM16H3K7yOpeyXk0emJe6DYqfAMfIro6sf5sFrWNGulMX0ygEpDcJ2HmobcKkArIdbuyrv-33co9oKH5Pqttg5AD-t8jL63yIS7rkt66vJa_ZmXbTqKk50KKs2TEcmnkW1Hiq73A"
                      alt="QuantPulse"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>QuantPulse</span>
                    <span className="font-mono text-[10px] text-slate-400">Lvl 15 • Fluid Dynamics</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 font-mono text-xs text-orange-400">
                    <span className="material-symbols-outlined text-[15px]">local_fire_department</span>
                    11d
                  </div>
                  <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    1,905 KP
                  </span>
                </div>
              </div>

              {/* USER HIGHLIGHT POSITION (Rank 04) */}
              <div
                className={`flex flex-col gap-2 p-3 rounded-xl border-2 transition-all ${
                  isDark
                    ? 'bg-violet-950/40 border-violet-500/60 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                    : 'bg-violet-100/80 border-violet-400 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-violet-600 text-white font-mono text-xs font-bold shadow-xs">
                      04
                    </div>
                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white ring-2 ring-violet-400">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          You (Cadet Alex)
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-violet-600/30 text-violet-300 font-mono text-[9px] font-bold border border-violet-500/40">
                          CURRENT
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        Lvl 14 Explorer • Quantum Electrodynamics
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 font-mono text-xs text-orange-400 font-bold">
                      <span className="material-symbols-outlined text-[15px]">local_fire_department</span>
                      {stats.streakDays}d
                    </div>
                    <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {stats.kp.toLocaleString()} KP
                    </span>
                  </div>
                </div>

                {/* Distance to Next Medal */}
                <div className="flex items-center justify-between px-1 pt-1 border-t border-violet-500/20 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-violet-300">
                    <span className="material-symbols-outlined text-[15px] text-amber-400 animate-pulse">
                      arrow_upward
                    </span>
                    <span>
                      Only <strong className="text-amber-400 underline font-bold">65 KP away</strong> from #3 Bronze Medal!
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Next win: +80 KP</span>
                </div>
              </div>

              {/* Rank 05 */}
              <div
                className={`flex items-center justify-between p-2.5 rounded-xl border opacity-80 ${
                  isDark ? 'bg-[#181926]/60 border-violet-500/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 font-mono text-xs text-slate-400 text-center">05</span>
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-violet-500/20">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqCXZWhKl1X4cPFf3mqTvqZ-bO6pPwENfT_thLV2cDb7DT7EchMe5b2CWpkissK2WsrtF8CtTyq3CtAfyx6DifEIkixBjQGurV6z7xtDdyJJyij_amSgpYuXwJ1t9dwT0nESyQZ1qOio9vRjY4IlgaL4I64p0a07KUSQjJ6jgq45SvS1j1J-b_-LRhFAjMlmgglEx987n8xcpjbAcszyUbdW0td6R9tKfxd4xwD9O508aPHj9o9FI"
                      alt="HelixStrand"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      HelixStrand
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">Lvl 13 • CRISPR Bio-Informatics</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 font-mono text-xs text-orange-400">
                    <span className="material-symbols-outlined text-[15px]">local_fire_department</span>
                    5d
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400">1,790 KP</span>
                </div>
              </div>
            </div>

            {/* Under-Leaderboard Promotional Nudge */}
            <div
              onClick={() => onNavigate('disciplines')}
              className={`cursor-pointer flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                isDark
                  ? 'bg-[#181926] border-violet-500/20 hover:border-violet-500/40 hover:bg-[#1e1f30]'
                  : 'bg-violet-50 border-violet-200 hover:bg-violet-100/80 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold shadow-md">
                  <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Keep practicing!
                  </span>
                  <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Finishing 1 interactive mission pushes you directly into the top promotion zone!
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('disciplines');
                }}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
              >
                <span>Go to Missions</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Mascot Booster & Trophy Cabinet (Cols 9-12) */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          {/* 3. CELEBRATING PUPPY MASCOT CARD */}
          <div
            className={`relative overflow-hidden rounded-2xl p-5 border shadow-xl ${
              isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-gradient-to-br from-violet-50 via-white to-amber-50 border-violet-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-amber-500 uppercase font-bold tracking-wider">
                Companion Boost
              </span>
              <span className="material-symbols-outlined text-amber-500 text-[18px] animate-spin">
                auto_awesome
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden shadow-lg p-1 border border-violet-500/30">
                <img
                  className="w-full h-full object-cover rounded-xl"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHM1WsZFJL47nfhRkzbgfl2vyDc3V1FT22PXEtk_agfJeJPPW-3Hk7fsp-Fxmf2pmL96cVL2aS9INwCfMZRedYV7NBB17JvC771pxPGyqtEXBwEPEkQM1_-5oVEAMegfx-hniSgQPAvhl0f2Q78K5J-FnXT2qBbUEA19enlzQqeSfW-9HSwgM2Xh69Kvu_R9p8TwCYc_qGboScn3xsLxe3rfLo50iObuWkFEn9T8WZ9uglUR1oL1o"
                  alt="Sparky Mascot"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[10px] border border-violet-400">
                  ★
                </div>
              </div>
              <div className="flex flex-col">
                <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Sparky the Cyber-Pup
                </span>
                <p className={`text-xs italic mt-0.5 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  "Woof! You crushed 5 challenges in a row! Here is your 2x velocity booster!"
                </p>
              </div>
            </div>

            {/* Mascot Reward Capsule Trigger */}
            <div
              className={`mt-4 p-2.5 rounded-xl flex items-center justify-between border ${
                isDark ? 'bg-[#181926] border-violet-500/20' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-400 text-[18px]">bolt</span>
                <div className="flex flex-col">
                  <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    +150 Bonus KP Surge
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    Active for next 45 minutes
                  </span>
                </div>
              </div>
              <button
                onClick={handleClaimPerk}
                className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-sm transition-all"
              >
                {claimedPerk ? 'Active' : 'Claim Perk'}
              </button>
            </div>
          </div>

          {/* 4. SHOWCASE CABINET: TROPHY BADGES */}
          <div
            className={`flex flex-col gap-4 rounded-2xl p-5 border shadow-xl ${
              isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Showcase Cabinet
                </span>
                <h3 className={`font-headline-md text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Trophy Badges
                </h3>
              </div>
              <button
                onClick={() => onNavigate('profile')}
                className="text-xs text-violet-400 hover:underline font-mono"
              >
                View All (18)
              </button>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Badge 1 */}
              <div
                className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                  isDark ? 'bg-[#181926] border-violet-500/15 hover:border-violet-500/40' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-500 shadow-sm border border-orange-500/30">
                  <span className="material-symbols-outlined text-[26px]">local_fire_department</span>
                </div>
                <span className={`text-xs font-bold mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Streak Master
                </span>
                <span className="font-mono text-[10px] text-orange-400 font-semibold">7-Day Continuous</span>
                <span className="font-mono text-[9px] text-slate-400 uppercase mt-0.5">Unlocked Today</span>
              </div>

              {/* Badge 2 */}
              <div
                className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                  isDark ? 'bg-[#181926] border-violet-500/15 hover:border-violet-500/40' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 shadow-sm border border-violet-500/30">
                  <span className="material-symbols-outlined text-[26px]">target</span>
                </div>
                <span className={`text-xs font-bold mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Flawless Run
                </span>
                <span className="font-mono text-[10px] text-violet-400 font-semibold">0 Errors in Lab 4</span>
                <span className="font-mono text-[9px] text-slate-400 uppercase mt-0.5">Season Rare</span>
              </div>

              {/* Badge 3 */}
              <div
                className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                  isDark ? 'bg-[#181926] border-violet-500/15 hover:border-violet-500/40' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 shadow-sm border border-indigo-500/30">
                  <span className="material-symbols-outlined text-[26px]">terminal</span>
                </div>
                <span className={`text-xs font-bold mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Sim Hacker
                </span>
                <span className="font-mono text-[10px] text-indigo-400 font-semibold">Boundary Explorer</span>
                <span className="font-mono text-[9px] text-slate-400 uppercase mt-0.5">Cadet Grade</span>
              </div>

              {/* Badge 4 */}
              <div
                className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                  isDark ? 'bg-[#181926] border-violet-500/15 hover:border-violet-500/40' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shadow-sm border border-amber-500/30">
                  <span className="material-symbols-outlined text-[26px]">workspace_premium</span>
                </div>
                <span className={`text-xs font-bold mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  League Topper
                </span>
                <span className="font-mono text-[10px] text-amber-500 font-semibold">Top 5% Placement</span>
                <span className="font-mono text-[9px] text-slate-400 uppercase mt-0.5">Rank Season 3</span>
              </div>
            </div>

            {/* Quick Stats Strip */}
            <div
              className={`p-2.5 rounded-xl flex items-center justify-around text-center border ${
                isDark ? 'bg-[#181926] border-violet-500/20' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <div className="flex flex-col">
                <span className={`font-mono text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>14</span>
                <span className="font-mono text-[10px] text-slate-400 uppercase">Badges</span>
              </div>
              <div className="w-px h-6 bg-slate-700/30" />
              <div className="flex flex-col">
                <span className="font-mono text-sm font-bold text-amber-500">96.4%</span>
                <span className="font-mono text-[10px] text-slate-400 uppercase">Accuracy</span>
              </div>
              <div className="w-px h-6 bg-slate-700/30" />
              <div className="flex flex-col">
                <span className="font-mono text-sm font-bold text-violet-400">#4</span>
                <span className="font-mono text-[10px] text-slate-400 uppercase">Rank</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
