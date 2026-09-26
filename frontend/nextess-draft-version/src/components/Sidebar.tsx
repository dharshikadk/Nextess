import React from 'react';
import { ActivePage, ThemeMode } from '../types';

interface SidebarProps {
  theme: ThemeMode;
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  theme,
  activePage,
  onNavigate,
  onOpenAuth,
}) => {
  const isDark = theme === 'dark';

  const isMissionsActive =
    activePage === 'missions' ||
    activePage === 'disciplines' ||
    activePage === 'missions-map' ||
    activePage === 'mission-detail' ||
    activePage === 'mission-chamber';

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-72 z-50 flex flex-col justify-between p-4 border-r transition-colors duration-300 backdrop-blur-2xl ${
        isDark
          ? 'bg-[#0a0a0f]/95 border-violet-500/20 shadow-[0_1px_16px_rgba(0,0,0,0.6)] text-slate-200'
          : 'bg-[#fcfbf9]/95 border-slate-200 shadow-lg text-slate-800'
      }`}
    >
      <div className="flex flex-col gap-3 overflow-y-auto">
        {/* Nextess Brand Logo Header */}
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 px-2 py-1.5 cursor-pointer group"
        >
          <img
            alt="Nextess Logo"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            src="https://lh3.googleusercontent.com/aida/AEtjO1VHhb_MudE9FPV61pMhJoPx4xmVwPpVRx6EsZrgy6t1w-88OHluiIIOfln6XmYyxQ-icyezm9px0xql5qXe6ZOPQ5er9ayXHFQxh216xNOOlqBOC1VeL7qbesT2Q4DhMVtniCHgvrmknXSO4WfZqqSdtkMPFCjZtEkDfXZ3zWNzZIwAwFrjCf9X7MAriVMcxAynhHvjx0b9BPFvDabJ5f_3OtaRFw1IwqDOZNJruQsU0-N4WXnheAXsQw"
          />
          <div className="flex flex-col">
            <span
              className={`font-headline-sm text-lg font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Nextess
            </span>
          </div>
        </div>

        {/* Section 1: Main Modules */}
        <div className="px-2 pt-2">
          <span
            className={`font-caption-caps uppercase tracking-wider text-[11px] font-semibold ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Main Modules
          </span>
        </div>

        <nav className="flex flex-col gap-1.5 px-1">
          {/* Dashboard */}
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left border ${
              activePage === 'dashboard'
                ? isDark
                  ? 'bg-violet-600/30 text-white font-bold border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                  : 'bg-violet-100 text-violet-950 font-bold border-violet-300 shadow-sm'
                : isDark
                ? 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-white'
                : 'text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[22px] text-violet-400">terminal</span>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold leading-tight">Dashboard</span>
              <span className={`font-mono text-[11px] ${isMissionsActive ? (isDark ? 'text-violet-200' : 'text-violet-700') : 'opacity-75'}`}>
                Explore & Discover
              </span>
            </div>
          </button>

          {/* Missions (Learning Path & Discovery) */}
          <button
            onClick={() => onNavigate('disciplines')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left border ${
              isMissionsActive
                ? isDark
                  ? 'bg-violet-600/30 text-white font-bold border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                  : 'bg-violet-100 text-violet-950 font-bold border-violet-300 shadow-sm'
                : isDark
                ? 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-white'
                : 'text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[22px] text-violet-400">timeline</span>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold leading-tight">Missions</span>
              <span className={`font-mono text-[11px] ${isMissionsActive ? (isDark ? 'text-violet-200' : 'text-violet-700') : 'opacity-75'}`}>
                Learning Paths & Discovery
              </span>
            </div>
          </button>

          {/* Streaks & Leaderboard */}
          <button
            onClick={() => onNavigate('leaderboard')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left border ${
              activePage === 'leaderboard'
                ? isDark
                  ? 'bg-violet-600/30 text-white font-bold border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                  : 'bg-violet-100 text-violet-950 font-bold border-violet-300 shadow-sm'
                : isDark
                ? 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-white'
                : 'text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[22px] text-amber-400">military_tech</span>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold leading-tight">Streaks &amp; Leaderboard</span>
              <span className={`font-mono text-[11px] ${activePage === 'leaderboard' ? (isDark ? 'text-violet-200' : 'text-violet-700') : 'opacity-75'}`}>
                3-Day League
              </span>
            </div>
          </button>

          {/* Profile & Badges */}
          <button
            onClick={() => onNavigate('profile')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left border ${
              activePage === 'profile'
                ? isDark
                  ? 'bg-violet-600/30 text-white font-bold border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                  : 'bg-violet-100 text-violet-950 font-bold border-violet-300 shadow-sm'
                : isDark
                ? 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-white'
                : 'text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[22px] text-violet-400">pets</span>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold leading-tight">Profile &amp; Badges</span>
              <span className={`font-mono text-[11px] ${isMissionsActive ? (isDark ? 'text-violet-200' : 'text-violet-700') : 'opacity-75'}`}>
                Customise Appearance
              </span>
            </div>
          </button>
        </nav>

        {/* Section 2: System & Info */}
        <div className="px-2 pt-2 mt-1">
          <span
            className={`font-caption-caps uppercase tracking-wider text-[11px] font-semibold ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            System & Info
          </span>
        </div>

        <nav className="flex flex-col gap-1.5 px-1">
          {/* Settings */}
          <button
            onClick={() => onNavigate('settings')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left border ${
              activePage === 'settings'
                ? isDark
                  ? 'bg-violet-600/30 text-white font-bold border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                  : 'bg-violet-100 text-violet-950 font-bold border-violet-300 shadow-sm'
                : isDark
                ? 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-white'
                : 'text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">tune</span>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold leading-tight">Settings</span>
              <span className={`font-mono text-[11px] ${activePage === 'settings' ? (isDark ? 'text-violet-200' : 'text-violet-700') : 'opacity-75'}`}>
                Theme & Preferences
              </span>
            </div>
          </button>

          {/* About */}
          <button
            onClick={() => onNavigate('about')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left border ${
              activePage === 'about'
                ? isDark
                  ? 'bg-violet-600/30 text-white font-bold border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                  : 'bg-violet-100 text-violet-950 font-bold border-violet-300 shadow-sm'
                : isDark
                ? 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-white'
                : 'text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">info</span>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold leading-tight">About</span>
              <span className={`font-mono text-[11px] ${activePage === 'about' ? (isDark ? 'text-violet-200' : 'text-violet-700') : 'opacity-75'}`}>
                Vision & Roadmap
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Cadet Access Box (Bottom of Sidebar) */}
      <div className="flex flex-col gap-2 p-1">
        <div
          className={`p-3.5 rounded-2xl flex flex-col gap-2 border transition-all ${
            isDark
              ? 'bg-[#12131b] border-violet-500/25 shadow-lg'
              : 'bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 border-violet-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">
                workspace_premium
              </span>
              <span className="font-mono text-xs font-bold text-amber-500">Cadet Access</span>
            </div>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                isDark ? 'bg-[#181926] text-violet-300 border border-violet-500/20' : 'bg-white text-violet-800 border border-violet-200'
              }`}
            >
              Guest
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Unlock persistent progress sync & ranked simulation bouts.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={onOpenAuth}
              className="flex-1 flex items-center justify-center py-2 px-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-[0_2px_8px_rgba(139,92,246,0.35)]"
            >
              <span className="material-symbols-outlined text-[15px] mr-1">login</span>
              Sign In / Sign Up
            </button>
            <button
              onClick={onOpenAuth}
              title="Sync Station"
              className={`p-2 rounded-xl border transition-all ${
                isDark
                  ? 'bg-[#1f2030] text-violet-300 border-violet-500/30 hover:bg-violet-600 hover:text-white'
                  : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
