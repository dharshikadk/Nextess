import React from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';

interface TopBarProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  stats: UserStats;
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onOpenAuth: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  theme,
  onToggleTheme,
  stats,
  activePage,
  onNavigate,
  onOpenAuth,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`fixed top-0 left-72 right-0 h-16 z-40 flex items-center justify-between px-6 border-b transition-colors duration-300 backdrop-blur-xl ${
        isDark
          ? 'bg-[#0d0e14]/85 border-[rgba(167,139,250,0.18)] shadow-[0_1px_12px_rgba(0,0,0,0.5)] text-slate-200'
          : 'bg-white/90 border-slate-200 shadow-sm text-slate-800'
      }`}
    >
      {/* Left: Quick Breadcrumb / Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isDark ? 'bg-violet-400 shadow-[0_0_10px_#a78bfa]' : 'bg-violet-600 shadow-[0_0_8px_rgba(124,58,237,0.5)]'
            } animate-pulse`}
          />
          <span
            className={`font-mono text-xs font-semibold uppercase tracking-wider ${
              isDark ? 'text-violet-300' : 'text-violet-700'
            }`}
          >
            {activePage === 'dashboard' && 'Dashboard'}
            {activePage === 'disciplines' && 'Discipline Directory'}
            {activePage === 'missions' && 'Missions Path'}
            {activePage === 'missions-map' && 'Physics Node Chain'}
            {activePage === 'mission-detail' && 'Mission 01 Ladder'}
            {activePage === 'mission-chamber' && 'Simulation Lab'}
            {activePage === 'leaderboard' && '3-Day League'}
            {activePage === 'profile' && 'Cadet Profile'}
            {activePage === 'settings' && 'System Configuration'}
            {activePage === 'about' && 'Vision & Roadmap'}
          </span>
        </div>
      </div>

      {/* Right: Gamified Stats, Theme Switcher & User Profile */}
      <div className="flex items-center gap-2.5">
        {/* Knowledge Points */}
        <button
          onClick={() => onNavigate('leaderboard')}
          title="Knowledge Points - Click to open Leaderboard"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all hover:scale-105 active:scale-95 ${
            isDark
              ? 'bg-[#181926] border-[rgba(167,139,250,0.25)] shadow-[0_0_12px_rgba(167,139,250,0.15)] text-white'
              : 'bg-violet-50 border-violet-200 shadow-sm text-violet-900'
          }`}
        >
          <span className="material-symbols-outlined text-violet-500 text-[18px]">bolt</span>
          <span className="font-mono text-xs font-bold">{stats.kp.toLocaleString()} KP</span>
        </button>

        {/* Coins / Credits */}
        <div
          title="Laboratory Coins"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
            isDark
              ? 'bg-[#181926] border-amber-500/20 shadow-[0_0_12px_rgba(251,191,36,0.15)] text-amber-300'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <span className="material-symbols-outlined text-amber-500 text-[18px]">monetization_on</span>
          <span className="font-mono text-xs font-bold">{stats.coins}</span>
        </div>

        {/* Streak */}
        <button
          onClick={() => onNavigate('leaderboard')}
          title="Active Streak - Click to view"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all hover:scale-105 ${
            isDark
              ? 'bg-[#181926] border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.2)] text-orange-400'
              : 'bg-orange-50 border-orange-200 text-orange-700'
          }`}
        >
          <span className="material-symbols-outlined text-orange-500 text-[18px]">local_fire_department</span>
          <span className="font-mono text-xs font-bold">{stats.streakDays} Days</span>
        </button>

        <div className={`h-6 w-px mx-1 ${isDark ? 'bg-[#242535]' : 'bg-slate-200'}`} />

        {/* Sun / Moon Animated Toggle (Theme switch button in top bar) */}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Switch to Pastel Day Theme' : 'Switch to Obsidian Night Theme'}
          className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border ${
            isDark
              ? 'bg-[#181926] border-violet-500/30 text-amber-400 hover:bg-[#1e1f30] hover:shadow-[0_0_16px_rgba(251,191,36,0.3)]'
              : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 hover:shadow-[0_0_14px_rgba(245,158,11,0.25)]'
          }`}
        >
          {isDark ? (
            <span className="material-symbols-outlined text-[20px] transition-transform duration-500 hover:rotate-12">
              dark_mode
            </span>
          ) : (
            <span className="material-symbols-outlined text-[21px] transition-transform duration-500 hover:rotate-45">
              light_mode
            </span>
          )}
        </button>

        {/* Sign In Quick Pill (shown only for guest) */}
        {stats.isGuest && (
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isDark
                ? 'bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600 hover:text-white'
                : 'bg-violet-100 border border-violet-300 text-violet-800 hover:bg-violet-600 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            <span>Sign In</span>
          </button>
        )}

        {/* User Avatar + Level Badge (Clickable to open profile) */}
        <button
          onClick={() => onNavigate('profile')}
          title="Open Alex Vektor Profile"
          className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all hover:scale-105 ${
            isDark
              ? 'bg-[#181926] border-[rgba(167,139,250,0.25)] hover:border-violet-400'
              : 'bg-white border-slate-200 hover:border-violet-400 shadow-sm'
          }`}
        >
          <img
            src="https://lh3.googleusercontent.com/aida/AEtjO1VhA8U4sQc_e762c_uQ70JcglQxTfG_F0rV5780-hC_bBshzBwG98X9s3x2p_1Qp56QyHkZ-9E1n1kRjX4_qA48i74pW_8lM27eA3P7x3zFz6F6sR9zD9uJpXN7Q"
            alt="Alex Vektor"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-violet-500/40"
          />
          <div className="flex flex-col text-left">
            <span className={`font-mono text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Lvl {stats.level}
            </span>
            <span className="text-[10px] text-violet-400 leading-none font-semibold uppercase truncate max-w-[90px]">
              {stats.profession || stats.title}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
