/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActivePage, ThemeMode, UserStats } from './types';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DisciplinesView } from './components/DisciplinesView';
import { MissionsMapView } from './components/MissionsMapView';
import { MissionDetailView } from './components/MissionDetailView';
import { MissionChamberView } from './components/MissionChamberView';
import { LeaderboardView } from './components/LeaderboardView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { AboutView } from './components/AboutView';
import { CadetAuthModal } from './components/CadetAuthModal';
import { EditProfileModal } from './components/EditProfileModal';
import { Toast } from './components/Toast';

export default function App() {
  // Theme State (Dark Mode default as per screens, with pastel daylight mode available)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('nextess_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  // Active Screen
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');

  // Modals & Notifications
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sessionBannerDismissed, setSessionBannerDismissed] = useState(false);

  // User Stats & Gamification Data
  const [stats, setStats] = useState<UserStats>({
    kp: 1840,
    coins: 420,
    streakDays: 7,
    lockInDay: 14,
    lockInTarget: 10,
    level: 14,
    title: 'Explorer',
    name: 'Guest Cadet',
    handle: '@guest_explorer',
    userClass: 'Class of 2026',
    college: 'Stanford University',
    profession: 'Theoretical Physics Researcher',
    isGuest: true,
    division: 'Div IV',
    rank: 4,
    accuracyRate: 96.4,
    badgesCount: 14,
    sparkySurgeActive: false,
    sparkyMinutesRemaining: 45,
  });

  // Synchronize document element class with current theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('nextess_theme', theme);
  }, [theme]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  const handleAwardKP = (amount: number) => {
    setStats((prev) => ({
      ...prev,
      kp: prev.kp + amount,
    }));
  };

  const handleClaimSurge = () => {
    handleAwardKP(50);
    setToastMessage('⚡ Hyperfocus Surge bonus claimed! +50 KP added to your telemetry.');
  };

  const handleSaveProfile = (
    name: string,
    handle: string,
    userClass: string,
    college: string,
    profession: string
  ) => {
    setStats((prev) => ({
      ...prev,
      name,
      handle,
      userClass,
      college,
      profession,
    }));
    setToastMessage('Profile updated successfully.');
  };

  const handleAuthSuccess = (name: string, handle: string) => {
    setStats((prev) => ({
      ...prev,
      name,
      handle,
      isGuest: false,
    }));
    setToastMessage(`Welcome aboard, Cadet ${name}! Telemetry synchronized with central relay.`);
  };

  const handleToggleGuest = () => {
    setStats((prev) => {
      const nextGuest = !prev.isGuest;
      return {
        ...prev,
        isGuest: nextGuest,
        name: nextGuest ? 'Guest Cadet' : 'Alex Vektor',
        handle: nextGuest ? '@guest_explorer' : '@alex_vektor',
      };
    });
    setToastMessage(
      stats.isGuest
        ? 'Signed in as Cadet Alex Vektor.'
        : 'Switched to Guest Cadet mode. Sign In button is now visible in top bar.'
    );
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-[#0d0e14] text-slate-200' : 'bg-[#f8f9fe] text-slate-800'
      }`}
    >
      {/* Fixed Left Sidebar */}
      <Sidebar
        theme={theme}
        activePage={activePage}
        onNavigate={setActivePage}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="pl-72 flex flex-col min-h-screen">
        {/* Fixed Top Bar */}
        <TopBar
          theme={theme}
          onToggleTheme={handleToggleTheme}
          stats={stats}
          activePage={activePage}
          onNavigate={setActivePage}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        {/* Scrollable Page Body */}
        <main className="relative pt-16 w-full px-6 min-h-screen">
          <div className="pt-4">
            {activePage === 'dashboard' && (
              <DashboardView
                theme={theme}
                stats={stats}
                onNavigate={setActivePage}
                onOpenAuth={() => setAuthModalOpen(true)}
                onClaimSurge={handleClaimSurge}
              />
            )}

            {activePage === 'disciplines' && (
              <DisciplinesView
                theme={theme}
                onNavigate={setActivePage}
                onShowToast={setToastMessage}
              />
            )}

            {activePage === 'missions' && (
              <DisciplinesView
                theme={theme}
                onNavigate={setActivePage}
                onShowToast={setToastMessage}
              />
            )}

            {activePage === 'missions-map' && (
              <MissionsMapView
                theme={theme}
                stats={stats}
                onNavigate={setActivePage}
                onShowToast={setToastMessage}
              />
            )}

            {activePage === 'mission-detail' && (
              <MissionDetailView
                theme={theme}
                stats={stats}
                onNavigate={setActivePage}
                onShowToast={setToastMessage}
              />
            )}

            {activePage === 'mission-chamber' && (
              <MissionChamberView
                theme={theme}
                stats={stats}
                onNavigate={setActivePage}
                onAwardKP={handleAwardKP}
                onShowToast={setToastMessage}
              />
            )}

            {activePage === 'leaderboard' && (
              <LeaderboardView
                theme={theme}
                stats={stats}
                onNavigate={setActivePage}
                onShowToast={setToastMessage}
              />
            )}

            {activePage === 'profile' && (
              <ProfileView
                theme={theme}
                stats={stats}
                onNavigate={setActivePage}
                onOpenEditProfile={() => setEditProfileOpen(true)}
                onShowToast={setToastMessage}
                onToggleGuest={handleToggleGuest}
              />
            )}

            {activePage === 'settings' && (
              <SettingsView
                theme={theme}
                onSetTheme={handleSetTheme}
                stats={stats}
                onNavigate={setActivePage}
                onOpenAuth={() => setAuthModalOpen(true)}
                onAwardKP={handleAwardKP}
                onShowToast={setToastMessage}
              />
            )}

            {activePage === 'about' && (
              <AboutView
                theme={theme}
                onNavigate={setActivePage}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Unsaved Laboratory Session Banner for Guests */}
      {stats.isGuest && !sessionBannerDismissed && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xl z-40 transition-all duration-300">
          <div
            className={`rounded-2xl p-4 border shadow-2xl backdrop-blur-md relative ${
              isDark
                ? 'bg-[#181926]/95 border-amber-500/40 text-white shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
                : 'bg-white/95 border-amber-300 text-slate-900 shadow-[0_8px_32px_rgba(245,158,11,0.2)]'
            }`}
          >
            <button
              onClick={() => setSessionBannerDismissed(true)}
              aria-label="Close unsaved session notification"
              className={`absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-white transition-colors ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3 pr-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-500 border border-amber-400/40">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Unsaved Laboratory Session
                  </span>
                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                      isDark
                        ? 'bg-[#0d0e14] text-amber-400 border-amber-400/30'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    Playing as Explorer Guest
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Your {stats.kp.toLocaleString()} KP and {stats.streakDays}-day streak progress are temporarily held in local cache. Sign in to sync with global cloud telemetry.
                </p>
              </div>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="shrink-0 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-[0_3px_0_#5b21b6] active:translate-y-0.5"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals & Toasts */}
      <CadetAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        theme={theme}
        onSuccess={handleAuthSuccess}
      />

      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        theme={theme}
        stats={stats}
        onSave={handleSaveProfile}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
