import React, { useState } from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';

interface SettingsViewProps {
  theme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onOpenAuth: () => void;
  onAwardKP: (amount: number) => void;
  onShowToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onSetTheme,
  stats,
  onNavigate,
  onOpenAuth,
  onAwardKP,
  onShowToast,
}) => {
  const isDark = theme === 'dark';

  // State
  const [rating, setRating] = useState<number>(5);
  const [selectedFocus, setSelectedFocus] = useState<string>('General Impression');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0); // 0th item open by default

  const ratingDescriptions: Record<number, string> = {
    1: '1.0 - Needs significant calibration',
    2: '2.0 - Room for pedagogical improvement',
    3: '3.0 - Solid foundation & clear challenges',
    4: '4.0 - Highly engaging laboratory mechanics!',
    5: '5.0 - Phenomenal laboratory experience!',
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFeedbackSent(true);
      setFeedbackText('');
      onAwardKP(20);
      onShowToast('Research dispatch received! +20 KP added to your telemetry.');
    }, 700);
  };

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  return (
    <div className="flex flex-col w-full pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col gap-1 pt-2 mb-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-wider text-violet-400 font-bold">
            Environment &amp; Telemetry
          </span>
        </div>
        <h1 className={`font-headline-lg text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Settings &amp; Preferences
        </h1>
        <p className={`text-xs md:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Customize the Nextess environment, visual engine, and share your feedbacks.
        </p>
      </header>

      {/* Section 2: Visual Theme Matrix */}
      <section
        className={`flex flex-col gap-4 p-6 rounded-2xl border shadow-xl mb-6 relative overflow-hidden transition-all ${
          isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className={`font-headline-md text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Visual Theme
          </h2>
          <span className="text-xs font-mono text-violet-400">
            Active: {isDark ? 'Obsidian Night' : 'Pastel Daylight'}
          </span>
        </div>

        {/* Mode Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dark Mode Card */}
          <div
            onClick={() => onSetTheme('dark')}
            className={`cursor-pointer group flex flex-col gap-3 p-4 rounded-xl border transition-all relative ${
              isDark
                ? 'bg-[#181926] border-2 border-violet-500 shadow-[0_0_24px_rgba(139,92,246,0.3)]'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-90'
            }`}
          >
            {isDark && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500 rounded-t-xl" />
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0d0e14] border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-inner">
                  <span className="material-symbols-outlined text-[20px]">dark_mode</span>
                </div>
                <div>
                  <span className={`font-semibold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Dark Mode
                    {isDark && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/40 text-[10px] font-mono font-semibold">
                        Active
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-200 text-slate-400'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isDark ? 'check' : 'radio_button_unchecked'}
                </span>
              </div>
            </div>

            {/* Preview Frame */}
            <div className="h-26 rounded-lg bg-[#0d0e14] border border-violet-500/20 p-2.5 flex flex-col justify-between overflow-hidden relative shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500/70" />
                </div>
                <span className="font-mono text-[10px] text-violet-300">obsidian_core.lab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-14 rounded bg-[#181926] border border-violet-500/20 flex flex-col justify-center px-1.5 gap-1">
                  <div className="h-1.5 w-6 rounded bg-violet-500" />
                  <div className="h-1 w-10 rounded bg-slate-600" />
                </div>
                <div className="flex-1 h-8 rounded bg-[#181926] border border-violet-500/20 flex items-center px-2">
                  <div className="h-2 w-20 rounded bg-violet-500/40" />
                </div>
              </div>
            </div>

            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Deep obsidian &amp; violet accents optimized for deep night focus, zero optical glare, and multi-hour research simulations.
            </p>
          </div>

          {/* Light Mode Card */}
          <div
            onClick={() => onSetTheme('light')}
            className={`cursor-pointer group flex flex-col gap-3 p-4 rounded-xl border transition-all relative ${
              !isDark
                ? 'bg-violet-50/90 border-2 border-violet-500 shadow-[0_0_24px_rgba(139,92,246,0.25)]'
                : 'bg-[#181926] border-violet-500/20 hover:border-violet-500/40 opacity-90'
            }`}
          >
            {!isDark && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-violet-600 rounded-t-xl" />
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-500 shadow-inner">
                  <span className="material-symbols-outlined text-[20px]">light_mode</span>
                </div>
                <div>
                  <span className={`font-semibold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Light Mode
                    {!isDark && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-mono font-semibold">
                        Active
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  !isDark ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-700/30 text-slate-400'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {!isDark ? 'check' : 'radio_button_unchecked'}
                </span>
              </div>
            </div>

            {/* Preview Frame */}
            <div className="h-26 rounded-lg bg-white border border-slate-200 p-2.5 flex flex-col justify-between overflow-hidden relative shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                </div>
                <span className="font-mono text-[10px] text-slate-600">daylight_clean.lab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-14 rounded bg-purple-50 flex flex-col justify-center px-1.5 gap-1 border border-purple-200">
                  <div className="h-1.5 w-6 rounded bg-violet-600" />
                  <div className="h-1 w-10 rounded bg-slate-400" />
                </div>
                <div className="flex-1 h-8 rounded bg-purple-50 flex items-center px-2 border border-purple-200">
                  <div className="h-2 w-20 rounded bg-slate-300" />
                </div>
              </div>
            </div>

            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              High contrast clean daylight mode for daytime study, bright classroom screens, and sunlight visibility.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Interactive Feedback & 5-Star Laboratory Rating */}
      <section
        className={`flex flex-col gap-4 p-6 rounded-2xl border shadow-xl mb-6 relative transition-all ${
          isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h2 className={`font-headline-md text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Feedback &amp; Mission Rating
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              How is your learning experience with Nextess? We'd love your input to sculpt upcoming mission capsules.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30">
            <span className="material-symbols-outlined text-violet-400 text-[16px]">bolt</span>
            <span className="font-mono text-xs font-bold text-violet-300">+20 KP Bounty</span>
          </div>
        </div>

        {/* Star Rating Block */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-3 ${
            isDark ? 'bg-[#181926] border-violet-500/20' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Cadet Evaluation
            </span>
            <span className="font-bold text-sm text-amber-500">
              {ratingDescriptions[rating]}
            </span>
          </div>

          {/* 5 Stars */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setRating(val)}
                className="transition-transform hover:scale-125 focus:outline-none text-amber-400"
              >
                <span
                  className="material-symbols-outlined text-[30px]"
                  style={{ fontVariationSettings: `'FILL' ${val <= rating ? 1 : 0}` }}
                >
                  star
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Focus Area Category Pills */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Select Focus Area
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              'General Impression',
              'Problem Difficulty',
              'Simulation Engine',
              'Feature Request',
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFocus(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedFocus === cat
                    ? 'bg-violet-600 text-white shadow-md'
                    : isDark
                    ? 'bg-[#181926] border border-violet-500/20 text-slate-300 hover:text-white'
                    : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea & Submit */}
        <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-3">
          <textarea
            rows={4}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Tell us what you loved or how we can make missions even better..."
            className={`w-full rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all resize-none border ${
              isDark
                ? 'bg-[#0d0e14] border-violet-500/20 text-white placeholder:text-slate-600'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
            }`}
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="material-symbols-outlined text-violet-400 text-[18px]">verified_user</span>
              <span>Tell Us What You Feel About Nextess</span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !feedbackText.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs shadow-md active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>{isSubmitting ? 'Dispatching...' : 'Send Feedback'}</span>
            </button>
          </div>

          {/* Success Toast */}
          {feedbackSent && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
              <span>
                Research dispatch received! <strong className="text-white">+20 KP</strong> has been added to your local telemetry cache.
              </span>
            </div>
          )}
        </form>
      </section>

      {/* Section 4: Frequently Asked Questions (Accordion) */}
      <section
        className={`flex flex-col gap-4 p-6 rounded-2xl border shadow-xl mb-6 transition-all ${
          isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'
        }`}
      >
        <div>
          <span className="font-mono text-[10px] text-violet-400 uppercase tracking-widest font-semibold block mb-0.5">
            Knowledge Base
          </span>
          <h2 className={`font-headline-md text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Frequently Asked Questions
          </h2>
        </div>

        {/* 5 Accordion Items */}
        <div className="flex flex-col gap-2">
          {[
            {
              id: 0,
              num: '01',
              question: 'What is Nextess and how does it work?',
              answer:
                'Nextess replaces passive video lectures with hands-on, kinetic STEM simulations. Instead of memorizing abstract formulas, you step into real-world crises—engineering electrical power grids, optimizing rocket trajectories, or debugging quantum logic gates in interactive sandboxes.',
            },
            {
              id: 1,
              num: '02',
              question: 'How do Knowledge Points (KP) and Coins differ?',
              answer:
                'Knowledge Points (KP) measure conceptual mastery, research problem completion, and dictate your 3-Day Sprint League ranking. Coins are practical laboratory currency awarded upon mission conclusion; they allow you to acquire hint reveals, unlock experimental simulator sandboxes, or buy cosmetics.',
            },
            {
              id: 2,
              num: '03',
              question: 'How does the 3-day sprint league leaderboard work?',
              answer:
                'Every 72 hours, cadets in your tier compete on an accelerated ladder. Finishing in the top tier earns promotion to prestigious divisions (Bronze → Silver → Obsidian → Quantum), alongside multiplier streak bonuses and lab accolades.',
            },
            {
              id: 3,
              num: '04',
              question: 'Can I learn and experiment as a guest without signing up?',
              answer:
                'Yes! You can explore all intro missions, tweak live parameter nodes, and earn initial telemetry immediately as a Guest Cadet. Whenever you wish to safeguard your 7-day streak and secure leaderboard rank permanently, one-click authentication locks your progress.',
            },
            {
              id: 4,
              num: '05',
              question: 'What happens if I make mistakes during a mission challenge?',
              answer:
                'Mistakes are crucial data points. If a simulation destabilizes, you receive real-time telemetry diagnostics with recommended capsule reviews. Micro-coin hint costs are fully reimbursed whenever you subsequently clear the challenge objective!',
            },
          ].map((item) => {
            const isOpen = expandedFaq === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isDark
                    ? 'bg-[#181926] border-violet-500/15 hover:border-violet-500/40'
                    : 'bg-slate-50 border-slate-200 hover:border-violet-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(item.id)}
                  className="w-full flex items-center justify-between p-3.5 text-left focus:outline-none group"
                >
                  <span
                    className={`font-semibold text-xs sm:text-sm flex items-center gap-2.5 transition-colors ${
                      isOpen
                        ? 'text-violet-400'
                        : isDark
                        ? 'text-white group-hover:text-violet-300'
                        : 'text-slate-900 group-hover:text-violet-700'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-violet-400">{item.num}</span>
                    {item.question}
                  </span>
                  <span
                    className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-violet-400' : 'text-slate-400'
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {isOpen && (
                  <div
                    className={`px-4 pb-4 pt-1 text-xs leading-relaxed border-t ${
                      isDark
                        ? 'border-violet-500/15 text-slate-300'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 5: Session Status Bar */}
      <footer
        className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm ${
          isDark ? 'bg-[#181926] border-violet-500/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center flex-wrap gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold ${
              isDark ? 'bg-[#0d0e14] border-violet-500/25 text-violet-300' : 'bg-white border-slate-200 text-violet-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
            <span>Guest Session Active</span>
          </div>
          <span className="text-slate-500 hidden md:inline">•</span>
          <div className="flex items-center gap-1 font-mono text-xs text-violet-400 font-semibold">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>{stats.kp.toLocaleString()} KP</span>
          </div>
          <span className="text-slate-500 hidden md:inline">•</span>
          <div className="flex items-center gap-1 font-mono text-xs text-orange-500 font-semibold">
            <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
            <span>{stats.streakDays}-Day Streak</span>
          </div>
        </div>

        <button
          onClick={onOpenAuth}
          className="w-full md:w-auto px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md transition-all text-center"
        >
          Sign in to Save Your Progress
        </button>
      </footer>
    </div>
  );
};
