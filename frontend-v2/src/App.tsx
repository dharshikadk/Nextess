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
  const [activePage, setActivePage] = useState<ActivePage>(() => {
    const saved = localStorage.getItem('nextess_active_page') as ActivePage | null;
    if (saved === 'mission-chamber' && localStorage.getItem('nextess_selected_mission')) return 'mission-chamber';
    if (saved === 'mission-detail' && localStorage.getItem('nextess_selected_mission')) return 'mission-detail';
    return localStorage.getItem('nextess_selected_mission') ? 'mission-detail' : 'dashboard';
  });

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
  const [streakGoalOpen,setStreakGoalOpen]=useState(false);
  const [streakGoalBusy,setStreakGoalBusy]=useState(false);
  const [streakLossOpen,setStreakLossOpen]=useState(false);
  const [missedStreakDays,setMissedStreakDays]=useState(0);
  const [leaderPromptOpen,setLeaderPromptOpen]=useState(false);
  const [leaderGap,setLeaderGap]=useState(0);
  const guestBalances = () => ({ kp: Number(localStorage.getItem('nextess_guest_kp') || 100), coins: Number(localStorage.getItem('nextess_guest_coins') || 100) });

  const refresh=async()=>{
    let me:any=null;
    try{me=await api.me()}catch{
      setStats(prev=>({...prev,...guestBalances(),streakDays:0,level:1,name:'Guest Cadet',handle:'',userClass:'',college:'',profession:'',profileType:'STUDENT',profileStatus:'',profileImageData:'',isGuest:true,badgesCount:0}));
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
      try{const st=await api.streak();const previous=Number(localStorage.getItem('nextess_last_streak')||0);if(previous>0&&Number(st?.streakDays||0)===0&&Number(st?.missedDays||0)>0){setMissedStreakDays(Number(st.missedDays));setStreakLossOpen(true);}localStorage.setItem('nextess_last_streak',String(st?.streakDays||0));}catch{}
    }catch{}
    try{
      const [ds,bs,lb]=await Promise.all([api.directives(),api.badges(),api.leaderboard()]);
      setDirectives(ds?.directives||[]);setBadges(bs?.badges||[]);setLeaderboard(lb||{opened:false,entries:[]});const mine=(lb?.entries||[]).find((e:any)=>e.userId===u.id);const mineIndex=(lb?.entries||[]).findIndex((e:any)=>e.userId===u.id);const gap=mineIndex>0?Number(lb.entries[mineIndex-1].kp)-Number(mine?.kp||0):0;const promptKey='nextess_leader_prompt_'+new Date().toISOString().slice(0,10);if(mineIndex>0&&gap>0&&gap<=20&&!localStorage.getItem(promptKey)){setLeaderGap(gap);setLeaderPromptOpen(true);localStorage.setItem(promptKey,'1');}
    }catch{}
  };
  useEffect(() => { const handler = (event: Event) => { const detail=(event as CustomEvent<any>).detail; const balances=detail?.guestBalances; if (balances && Number.isFinite(balances.kp) && Number.isFinite(balances.coins)) { setStats(prev=>prev.isGuest?{...prev,kp:balances.kp,coins:balances.coins}:prev); return; } refresh(); }; window.addEventListener('nextess-mission-updated', handler); return () => window.removeEventListener('nextess-mission-updated', handler); }, []);
  useEffect(() => { localStorage.setItem('nextess_active_page', activePage); }, [activePage]);
  useEffect(() => { api.settings().then((result) => { const saved = result?.settings?.theme; if (saved === 'light' || saved === 'dark') setTheme(saved); }).catch(() => {}); }, []);
  useEffect(() => {
    let cancelled = false;
    api.quote().then((result) => {
      if (!cancelled) setQuote(result?.quote || null);
    }).catch(() => {
      if (!cancelled) setQuote(null);
    });
    return () => { cancelled = true; };
  }, []);
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
  const handleClaimDirective=async(id:string)=>{
    if(stats.isGuest){setAuthModalOpen(true);return;}
    try{
      const result=await api.claimDirective(id);
      setToastMessage(`Directive complete: +${result.rewardXp||0} KP, +${result.rewardCoins||0} coins.`);
      await refresh();
    }catch(e:any){
      setToastMessage(e?.message||'This directive could not be claimed.');
    }
  };

  const handleSaveProfile=(data:any)=>{setStats(prev=>({...prev,name:data.name??prev.name,profession:data.profession??'',profileType:data.profileType??prev.profileType,userClass:data.schoolClass??'',college:data.fieldOfStudy??'',profileStatus:data.profileStatus??'',profileImageData:data.profileImageData??''}));setToastMessage('Profile updated successfully.');refresh()};

  const handleAuthSuccess = (result?:any) => {
    setShowStartAnimation(false);
    setToastMessage(null);
    void refresh();
    if(result?.firstLogin)window.setTimeout(()=>setStreakGoalOpen(true),1200);
  };
  const handleStartAnimationComplete = () => { setShowStartAnimation(false); };

  const handleToggleGuest=()=>{if(stats.isGuest)setAuthModalOpen(true);else api.logout().then(()=>{localStorage.removeItem('nextess_selected_mission');localStorage.removeItem('nextess_mission_stage');localStorage.removeItem('nextess_active_page');localStorage.removeItem('nextess_investigation_id');localStorage.removeItem('nextess_investigation_mission_id');const balances=guestBalances();setStats(prev=>({...prev,isGuest:true,kp:balances.kp,coins:balances.coins,streakDays:0,level:1,name:'Guest Cadet',handle:'',badgesCount:0}));setActiveProgress([]);setDirectives([]);setBadges([])})};

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
      {/* Mission runtime uses the full viewport so the simulation can expand. */}
      {activePage !== 'mission-chamber' && (
        <Sidebar
          theme={theme}
          activePage={activePage}
          onNavigate={setActivePage}
          onOpenAuth={() => setAuthModalOpen(true)}
          isGuest={stats.isGuest}
        />
      )}

      {/* Main Content Area */}
      <div className={`${activePage === 'mission-chamber' ? '' : 'pl-72'} flex flex-col min-h-screen`}>
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
                onClaimDirective={handleClaimDirective}
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
              className={`absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-white transition-colors pointer-events-auto ${
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

      {streakGoalOpen && !stats.isGuest && <div className="fixed inset-0 z-[95] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Choose your streak goal"><div className={"w-full max-w-md rounded-3xl border p-7 shadow-2xl "+(isDark?'bg-[#12131b] border-violet-500/30 text-white':'bg-white border-violet-200 text-slate-900')}><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase text-violet-400">New learning commitment</div><h2 className="text-2xl font-bold mt-1">Choose your streak target</h2></div><button type="button" onClick={()=>setStreakGoalOpen(false)} className="p-1.5 rounded-lg text-slate-400" aria-label="Close streak goal">✕</button></div><p className="text-sm text-slate-500 mt-4">Pick a target that feels realistic. Your choice gives you a small starting reward and becomes your personal streak milestone.</p><div className="grid grid-cols-2 gap-3 mt-5">{[7,14].map(days=><button key={days} type="button" disabled={streakGoalBusy} onClick={async()=>{setStreakGoalBusy(true);try{const result=await api.setStreakGoal(days);setToastMessage(`${days}-day streak target set · +${result.reward?.xp||0} KP · +${result.reward?.coins||0} coins.`);await refresh();setStreakGoalOpen(false);}catch(e:any){setToastMessage(e?.message||'Could not save your streak goal.');}finally{setStreakGoalBusy(false);}}} className={"rounded-2xl border p-4 text-left "+(isDark?'bg-[#181926] border-violet-500/20':'bg-violet-50 border-violet-200')}><div className="text-2xl font-bold">{days} days</div><div className="text-xs text-slate-500 mt-1">{days===7?'Steady start':'Longer commitment'}</div></button>)}</div></div></div>}
      {streakLossOpen && !stats.isGuest && <div className="fixed inset-0 z-[95] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Streak recovery"><div className={"w-full max-w-md rounded-3xl border p-7 shadow-2xl "+(isDark?'bg-[#12131b] border-orange-500/30 text-white':'bg-white border-orange-200 text-slate-900')}><div className="flex justify-between gap-3"><div><div className="font-mono text-[10px] uppercase text-orange-400">Streak recovery</div><h2 className="text-2xl font-bold mt-1">Your streak took a break</h2></div><button onClick={()=>setStreakLossOpen(false)} className="p-1.5 text-slate-400" aria-label="Close streak recovery">✕</button></div><p className="text-sm text-slate-500 mt-4">You missed {missedStreakDays} day{missedStreakDays===1?'':'s'}. Use a streak freeze to recover missed days.</p><div className="grid grid-cols-2 gap-3 mt-5"><button onClick={async()=>{try{const r=await api.freezeStreak(1);setToastMessage(`1-day streak freeze used for ${r.costCoins} coins.`);await refresh();setStreakLossOpen(false);}catch(e:any){setToastMessage(e?.message||'The 1-day freeze is not available.');}}} className={"rounded-2xl border p-4 text-left "+(isDark?'bg-[#181926] border-orange-500/20':'bg-orange-50 border-orange-200')}><b>1 day</b><span className="block text-xs text-slate-500 mt-1">60 coins</span></button><button onClick={async()=>{try{const r=await api.freezeStreak(2);setToastMessage(`2-day streak freeze used for ${r.costCoins} coins.`);await refresh();setStreakLossOpen(false);}catch(e:any){setToastMessage(e?.message||'The 2-day freeze is not available.');}}} className={"rounded-2xl border p-4 text-left "+(isDark?'bg-[#181926] border-orange-500/20':'bg-orange-50 border-orange-200')}><b>2 days</b><span className="block text-xs text-slate-500 mt-1">120 coins</span></button></div></div></div>}
      {leaderPromptOpen && !stats.isGuest && <div className="fixed inset-0 z-[95] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Leaderboard progress"><div className={"w-full max-w-md rounded-3xl border p-7 shadow-2xl "+(isDark?'bg-[#12131b] border-cyan-500/30 text-white':'bg-white border-cyan-200 text-slate-900')}><div className="flex justify-between gap-3"><div><div className="font-mono text-[10px] uppercase text-cyan-400">Leaderboard proximity</div><h2 className="text-2xl font-bold mt-1">You are close to the next place</h2></div><button onClick={()=>setLeaderPromptOpen(false)} className="p-1.5 text-slate-400" aria-label="Close leaderboard prompt">✕</button></div><p className="text-sm text-slate-500 mt-4">You need {leaderGap} more KP to reach the next leaderboard position. Solve meaningful missions to close that gap.</p><button onClick={()=>{setLeaderPromptOpen(false);setActivePage('leaderboard')}} className="w-full mt-5 py-3 rounded-xl bg-cyan-600 text-white text-xs font-bold">View leaderboard</button></div></div>}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
    </>
  );
}
