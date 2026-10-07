import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { ActivePage, ThemeMode, UserStats } from '../types';

interface DashboardViewProps {
  theme: ThemeMode;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onResumeMission: (projectId: string) => void;
  onOpenAuth: () => void;
  onClaimSurge: () => void;
  onClaimDirective: (id: string) => Promise<void>;
  dailyQuote?: {quote:string;author:string;date:string;category:string}|null;
  directives?: Array<{id:string;title:string;description:string;rewardXp:number;rewardCoins:number;claimed:boolean}>;
  activeProgress?: Array<{projectId:string;title:string;status:string;progressPercent:number}>;
  leaderboard?: {opened?:boolean;entries?:Array<{rank:number;userId:string;name:string;username:string;kp:number;streakDays:number}>};
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  theme,
  stats,
  onNavigate,
  onResumeMission,
  onOpenAuth,
  onClaimSurge,
  onClaimDirective,
  dailyQuote,
  directives = [],
  activeProgress = [],
  leaderboard = {opened:false, entries:[]},
}) => {
  const isDark = theme === 'dark';
  const [futureSubjects, setFutureSubjects] = useState<Array<{ id: string; displayName: string }>>([]);
  const [claimingDirectiveId, setClaimingDirectiveId] = useState<string | null>(null);
  const [guestProgress,setGuestProgress]=useState<Array<{projectId:string;title:string;status:string;progressPercent:number}>>([]);

  const fallbackQuotes = [
    { quote: 'The important thing is not to stop questioning.', author: 'Albert Einstein', date: '', category: 'science' },
    { quote: 'Nothing in life is to be feared, it is only to be understood.', author: 'Marie Curie', date: '', category: 'science' },
    { quote: 'If I have seen further it is by standing on the shoulders of giants.', author: 'Isaac Newton', date: '', category: 'science' },
    { quote: 'The important thing is to know what is important.', author: 'Albert Einstein', date: '', category: 'science' },
  ];
  const displayQuote = dailyQuote || fallbackQuotes[Math.floor(Date.now() / 86400000) % fallbackQuotes.length];

  useEffect(() => { const syncGuest=()=>{const id=localStorage.getItem('nextess_selected_mission');const title=localStorage.getItem('nextess_selected_mission_title');if(id&&title)setGuestProgress([{projectId:id,title,status:'IN_PROGRESS',progressPercent:Number(localStorage.getItem('nextess_guest_mission_progress')||0)}]);else setGuestProgress([]);};syncGuest();window.addEventListener('nextess-mission-updated',syncGuest);return()=>window.removeEventListener('nextess-mission-updated',syncGuest);}, []);

  useEffect(() => {
    let cancelled = false;
    api.subjects()
      .then((result: any) => {
        if (!cancelled) {
          setFutureSubjects(
            (result.subjects || [])
              .filter((subject: any) => subject.status === 'FUTURE')
              .sort((a: any, b: any) => a.ordering - b.ordering),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setFutureSubjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveActiveProgress=stats.isGuest?guestProgress:activeProgress;

  return (
    <div className="flex flex-col w-full pb-16">
      <section className="mb-4">
        <div className={`relative overflow-hidden rounded-xl px-4 py-2.5 border shadow-sm ${isDark ? 'bg-[#12131b] border-violet-500/20 text-slate-300' : 'bg-violet-50/70 border-violet-200 text-slate-700'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-[#1e1f30] text-violet-300' : 'bg-white text-violet-600 shadow-sm'}`}>
                <span className="material-symbols-outlined text-[18px]">format_quote</span>
              </span>
              <p className="text-xs truncate">
                <span className="italic">{displayQuote.quote}</span>
                <span className={`ml-2 font-mono font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>— {displayQuote.author}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0"><span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" /><span className="font-mono text-[11px] text-violet-400">DAILY QUOTES</span></div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className={`relative overflow-hidden rounded-2xl p-6 border shadow-xl transition-all ${isDark ? 'bg-[#181926] border-violet-500/20 text-slate-200' : 'bg-gradient-to-br from-white via-purple-50/40 to-indigo-50/40 border-violet-200 text-slate-800'}`}>
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] text-violet-400 uppercase tracking-widest font-bold">Explore Experiment</span>
                  <span className="text-slate-500 font-mono text-xs">•</span>
                  <span className="font-mono text-[11px] text-amber-400 uppercase tracking-wider font-semibold">Solve</span>
                </div>
                <h1 className={`font-headline-lg text-3xl md:text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {(() => { const h=Number(new Intl.DateTimeFormat('en-IN',{hour:'numeric',hour12:false,timeZone:'Asia/Kolkata'}).format(new Date())); return (h<12?'Good morning':h<17?'Good afternoon':'Good evening') + ', ' + (stats.name || 'Cadet') + '!'; })()}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm ${isDark ? 'bg-[#1e1f30] border-violet-500/20' : 'bg-white border-orange-200'}`}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500"><span className="material-symbols-outlined text-[26px]">local_fire_department</span></div>
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.streakDays} Days</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Streak</span>
                  </div>
                </div>
                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm ${isDark ? 'bg-[#1e1f30] border-violet-500/20' : 'bg-white border-violet-200'}`}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400"><span className="material-symbols-outlined text-[26px]">bolt</span></div>
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.kp.toLocaleString()} KP</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Learning Progress</span>
                  </div>
                </div>
                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm ${isDark ? 'bg-[#1e1f30] border-amber-500/20' : 'bg-white border-amber-200'}`}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500"><span className="material-symbols-outlined text-[26px]">monetization_on</span></div>
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.coins.toLocaleString()}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Coins</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-xl px-4 py-3 border shadow-sm ${isDark ? 'bg-[#1e1f30] border-violet-500/20' : 'bg-amber-50/80 border-amber-200'}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15 text-violet-400"><span className="material-symbols-outlined text-[20px]">verified</span></span>
                <div>
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Level {stats.level}</span>
                  <span className="block text-[11px] text-slate-400">{stats.isGuest ? 'Explorer guest state' : 'Account state from the server'}</span>
                </div>
              </div>
              {!stats.isGuest ? null : (
                <button onClick={onOpenAuth} className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-sm">Create Account</button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        <div className={`lg:col-span-7 flex flex-col justify-between rounded-2xl p-5 border shadow-lg relative overflow-hidden ${isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/60 border-indigo-200'}`}>
          <div className="absolute right-0 top-0 w-48 h-48 bg-violet-500/10 rounded-bl-full pointer-events-none" />
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded bg-violet-500/20 text-violet-400"><span className="material-symbols-outlined text-[16px]">play_circle</span></span><span className="font-mono text-[11px] uppercase tracking-wider text-violet-400 font-bold">Active Lab Chamber</span></div>
            {effectiveActiveProgress.length ? (
              <>
                <div><h2 className={`font-headline-md text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{effectiveActiveProgress[0].title}</h2><p className="text-xs mt-1 text-slate-400">{effectiveActiveProgress[0].status.replace(/_/g,' ')}</p></div>
                <div className={`rounded-xl p-3 border ${isDark ? 'bg-[#181926] border-violet-500/20' : 'bg-white/90 border-slate-200'}`}>
                  <div className="flex items-center justify-between"><span className="font-mono text-xs font-semibold">Saved investigation progress</span><span className="font-mono text-xs text-violet-400 font-bold">{effectiveActiveProgress[0].progressPercent}%</span></div>
                  <div className="w-full h-2 rounded-full bg-slate-700/30 overflow-hidden mt-2"><div className="h-full bg-gradient-to-r from-violet-600 to-indigo-400 rounded-full" style={{width:`${Math.max(0,Math.min(100,effectiveActiveProgress[0].progressPercent))}%`}} /></div>
                </div>
                <button onClick={() => onResumeMission(effectiveActiveProgress[0].projectId)} className="self-start px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-[0_4px_0_#5b21b6]">Resume Saved Mission</button>
              </>
            ) : (
              <div className={`rounded-xl p-5 border ${isDark ? 'bg-[#181926] border-violet-500/20' : 'bg-white/90 border-slate-200'}`}>
                <h2 className={`font-headline-md text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No active mission</h2>
                <p className="text-xs mt-1 text-slate-400">No persisted investigation is currently in progress.</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2">
            <span className="font-mono text-xs text-slate-400">Mission progress appears here only when supplied by the server.</span>
            <button onClick={() => onNavigate('missions-map')} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-[0_4px_0_#5b21b6] flex items-center gap-1.5">Open Missions <span className="material-symbols-outlined text-[18px]">arrow_forward</span></button>
          </div>
        </div>

        <div className={`lg:col-span-5 flex flex-col justify-between rounded-2xl p-5 border shadow-lg ${isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-gradient-to-br from-amber-50/60 via-white to-orange-50/50 border-amber-200'}`}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded bg-amber-400/20 text-amber-500"><span className="material-symbols-outlined text-[16px]">task_alt</span></span><h3 className={`font-headline-sm text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Daily Directives</h3></div><span className="font-mono text-xs text-slate-400">{directives.filter(d=>d.claimed).length}/{directives.length} Done</span></div>
            {directives.length ? (
              <ul className="flex flex-col gap-2">
                {directives.map((d) => (
                  <li key={d.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${isDark ? 'bg-[#181926] border-transparent' : 'bg-white/80 border-slate-200'}`}>
                    <span className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${d.claimed ? 'text-violet-400' : 'text-slate-500'}`}>{d.claimed ? 'check_circle' : 'radio_button_unchecked'}</span>
                    <div className="flex flex-col min-w-0 flex-1"><span className={`text-xs ${d.claimed ? 'text-slate-400 line-through' : isDark ? 'text-white' : 'text-slate-900'}`}>{d.title}</span><span className="font-mono text-[10px] text-slate-500 mt-0.5">{d.description}</span><span className="font-mono text-[10px] text-violet-400 mt-0.5">+{d.rewardXp} KP • +{d.rewardCoins} Coins</span></div>
                    {d.claimed ? (
                      <span className="font-mono text-[10px] text-violet-400 px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">DONE</span>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          if (claimingDirectiveId) return;
                          setClaimingDirectiveId(d.id);
                          try { await onClaimDirective(d.id); } finally { setClaimingDirectiveId(null); }
                        }}
                        disabled={claimingDirectiveId !== null}
                        className="shrink-0 px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {claimingDirectiveId === d.id ? 'Claiming…' : 'Claim'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-[#181926] border-violet-500/15' : 'bg-white/80 border-slate-200'}`}><div className="flex items-center gap-2 text-xs font-semibold"><span className="material-symbols-outlined text-slate-500 text-[18px]">radio_button_unchecked</span>No directives available</div><p className="text-[11px] text-slate-500 mt-1">Nothing is marked complete for this fresh session.</p></div>
            )}
          </div>
          <div className="pt-3 flex items-center justify-between text-slate-400 font-mono text-xs"><span>Server recorded state only</span><button onClick={() => onNavigate('leaderboard')} className="text-violet-400 hover:underline font-semibold">View League →</button></div>
        </div>
      </section>

      <section className="mb-6">
        <div onClick={() => onNavigate('leaderboard')} className={`cursor-pointer rounded-2xl p-5 border shadow-md transition-all hover:scale-[1.008] ${isDark ? 'bg-[#181926] border-violet-500/20 hover:border-violet-500/40' : 'bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 border-purple-200 shadow-sm'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400"><span className="material-symbols-outlined text-[28px]">military_tech</span></div><div><div className="flex items-center gap-2"><span className={`font-headline-sm text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>League Status</span><span className="px-2 py-0.5 rounded font-mono text-[10px] bg-violet-500/20 text-violet-300 font-bold uppercase border border-violet-500/30">{leaderboard.opened ? 'OPEN' : 'CLOSED'}</span></div><p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{leaderboard.opened ? `${leaderboard.entries?.length || 0} participant(s) currently listed.` : 'No open leaderboard participation is currently available.'}</p></div></div>
            <span className="material-symbols-outlined text-violet-400 text-[20px]">chevron_right</span>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
          <div><div className="flex items-center gap-2"><span className="h-3.5 w-1 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.5)]" /><h2 className={`font-headline-lg text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Future Subjects</h2></div><p className="text-xs text-slate-400 mt-1">Reserved subject slots are shown without invented mission content.</p></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(futureSubjects.length ? futureSubjects : [
            { id: 'fallback-chemistry', displayName: 'Physical & Synthetic Chemistry' },
            { id: 'fallback-biology', displayName: 'Evolutionary Biology' },
            { id: 'fallback-history', displayName: 'History' },
            { id: 'fallback-geography', displayName: 'Geography' },
          ]).map((subject, index) => (
            <div key={subject.id} className={`flex flex-col justify-between rounded-2xl p-4 border shadow-sm ${isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'}`}>
              <div>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${isDark ? 'bg-[#181926] text-violet-400 border-violet-500/20' : 'bg-slate-50 text-violet-600 border-slate-200'}`}>
                  <span className="material-symbols-outlined text-[20px]">{['science','biotech','account_balance','public'][index % 4]}</span>
                </span>
                <h3 className={`font-headline-sm text-sm font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{subject.displayName}</h3>
                <p className="text-xs mt-1 text-slate-500">Coming soon.</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
