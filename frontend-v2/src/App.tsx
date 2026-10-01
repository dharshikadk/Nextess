/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActivePage, ThemeMode, UserStats } from './types';
import { api } from './api';
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
import { NextessLoadingScreen } from './components/NextessLoadingScreen';

export default function App() {
  // Theme State (Dark Mode default as per screens, with pastel daylight mode available)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('nextess_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  // Active Screen
  const [activePage, setActivePage] = useState<ActivePage>(() => localStorage.getItem('nextess_selected_mission') ? 'mission-detail' : 'dashboard');

  // Modals & Notifications
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sessionBannerDismissed, setSessionBannerDismissed] = useState(false);

  const [stats,setStats]=useState<UserStats>({kp:100,coins:100,streakDays:0,lockInDay:0,lockInTarget:0,level:1,title:'Cadet',name:'Guest Cadet',handle:'',userClass:'',college:'',profession:'',profileType:'STUDENT',profileStatus:'',profileImageData:'',isGuest:true,division:'',rank:0,accuracyRate:0,badgesCount:0,sparkySurgeActive:false,sparkyMinutesRemaining:0});
  const [quote,setQuote]=useState<any>(null);
  const [directives,setDirectives]=useState<any[]>([]);
  const [badges,setBadges]=useState<any[]>([]);
  const [activeProgress,setActiveProgress]=useState<any[]>([]);
  const [leaderboard,setLeaderboard]=useState<any>({opened:false,entries:[]});
  const [appReady, setAppReady] = useState(false);
  const [showStartAnimation, setShowStartAnimation] = useState(false);

  const refresh=async()=>{
    let me:any=null;
    try{me=await api.me()}catch{
      setStats(prev=>({...prev,kp:100,coins:100,streakDays:0,level:1,name:'Guest Cadet',handle:'',userClass:'',college:'',profession:'',profileType:'STUDENT',profileStatus:'',profileImageData:'',isGuest:true,badgesCount:0}));
      setActiveProgress([]);setDirectives([]);setBadges([]);
      try{setLeaderboard(await api.leaderboard())}catch{setLeaderboard({opened:false,entries:[]})}
      return;
    }
    if(!me?.user){
      setStats(prev=>({...prev,kp:100,coins:100,streakDays:0,level:1,name:'Guest Cadet',handle:'',userClass:'',college:'',profession:'',profileType:'STUDENT',profileStatus:'',profileImageData:'',isGuest:true,badgesCount:0}));
      setActiveProgress([]);setDirectives([]);setBadges([]);
      return;
    }
    const u=me.user;
    setStats(prev=>({...prev,kp:u?.xp??0,coins:u?.coins??0,level:u?.level??1,name:u?.name??'Cadet',handle:u?.username?'@'+u.username:'',userClass:u?.schoolClass||u?.gradeClass||'',college:u?.fieldOfStudy||'',profession:u?.profession||'',profileType:u?.profileType||'STUDENT',profileStatus:u?.profileStatus||'',profileImageData:u?.profileImageData||'',isGuest:false}));
    try{
      const d=await api.dashboard();
      setStats(prev=>({...prev,kp:d.user?.xp??prev.kp,coins:d.user?.coins??prev.coins,streakDays:d?.streakDays??prev.streakDays,level:d.user?.level??prev.level,name:d?.name??prev.name,handle:d.user?.username?'@'+d.user.username:prev.handle,userClass:d.user?.schoolClass||d.user?.gradeClass||prev.userClass,college:d.user?.fieldOfStudy||prev.college,profession:d.user?.profession||prev.profession,profileType:d.user?.profileType||prev.profileType,profileStatus:d.user?.profileStatus||prev.profileStatus,profileImageData:d.user?.profileImageData||prev.profileImageData,badgesCount:d?.badgesCount??prev.badgesCount,isGuest:false}));
      setActiveProgress(d?.activeProgress||[]);
    }catch{}
    try{
      const [ds,bs,lb]=await Promise.all([api.directives(),api.badges(),api.leaderboard()]);
      setDirectives(ds?.directives||[]);setBadges(bs?.badges||[]);setLeaderboard(lb||{opened:false,entries:[]});
    }catch{}
  };
  useEffect(() => { const handler = () => { refresh(); }; window.addEventListener('nextess-mission-updated', handler); return () => window.removeEventListener('nextess-mission-updated', handler); }, []);
  useEffect(() => { api.settings().then((result) => { const saved = result?.settings?.theme; if (saved === 'light' || saved === 'dark') setTheme(saved); }).catch(() => {}); }, []);
  useEffect(() => {
    let mounted = true;
    const readyFallback = new Promise<void>((resolve) => setTimeout(resolve, 10000));
    Promise.race([refresh(), readyFallback]).finally(() => {
      if (mounted) setAppReady(true);
    });
    return () => { mounted = false; };
  }, []);
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
    if (!stats.isGuest) api.updateSettings({theme:newTheme}).catch(()=>setToastMessage('Theme could not be synchronized with the server.'));
  };

  const handleAwardKP=(_amount:number)=>refresh();
  const handleClaimSurge=()=>{setToastMessage('Rewards are issued by the server after eligible activity.');refresh()};

  const handleSaveProfile=(data:any)=>{setStats(prev=>({...prev,name:data.name??prev.name,profession:data.profession??'',profileType:data.profileType??prev.profileType,userClass:data.schoolClass??'',college:data.fieldOfStudy??'',profileStatus:data.profileStatus??'',profileImageData:data.profileImageData??''}));setToastMessage('Profile updated successfully.');refresh()};

  const handleAuthSuccess = async () => { await refresh(); setShowStartAnimation(true); setToastMessage('Account synchronized with Nextess.'); };
  const handleStartAnimationComplete = () => { setShowStartAnimation(false); };

  const handleToggleGuest=()=>{if(stats.isGuest)setAuthModalOpen(true);else api.logout().then(()=>{localStorage.removeItem('nextess_selected_mission');localStorage.removeItem('nextess_mission_stage');setStats(prev=>({...prev,isGuest:true,kp:100,coins:100,streakDays:0,level:1,name:'Guest Cadet',handle:'',badgesCount:0}));setActiveProgress([]);setDirectives([]);setBadges([])})};

  const isDark = theme === 'dark';

  return (
    <>
      <NextessLoadingScreen mode="loading" visible={!appReady} message="Getting Nextess ready..." />
      <NextessLoadingScreen mode="start" visible={showStartAnimation} onVideoComplete={handleStartAnimationComplete} />
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
        isGuest={stats.isGuest}
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
                dailyQuote={quote}
                directives={directives}
                activeProgress={activeProgress}
                leaderboard={leaderboard}
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
                badges={badges}
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

      {/* Floating guest exploration banner — contains no progress claims. */}
      {stats.isGuest && !sessionBannerDismissed && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xl z-40 transition-all duration-300 pointer-events-none">
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
                  You are exploring Nextess as a guest. Create an account when you want your learning activity and rewards to be associated with a real user account.
                </p>
              </div>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="pointer-events-auto shrink-0 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-[0_3px_0_#5b21b6] active:translate-y-0.5"
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
    </>
  );
}
