import React, { useState } from 'react';
import { ThemeMode } from '../types';

interface CadetAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onSuccess: (name: string, handle: string) => void;
}

export const CadetAuthModal: React.FC<CadetAuthModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'signin' | 'signup' | 'sync'>('signin');
  const [callsign, setCallsign] = useState('Alex Vektor');
  const [email, setEmail] = useState('alex.vektor@cadet.lab');
  const [password, setPassword] = useState('••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const handle = `@${callsign.toLowerCase().replace(/\s+/g, '_')}`;
      onSuccess(callsign, handle);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl transition-all relative ${
          isDark
            ? 'bg-[#12131b] border-violet-500/30 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-lg font-bold">Cadet Access Station</h3>
            <p className="text-xs text-slate-400">Sync research breakthroughs &amp; 3-day rank</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className={`flex rounded-xl p-1 mb-4 border ${isDark ? 'bg-[#07080c] border-violet-500/20' : 'bg-slate-100 border-slate-200'}`}>
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'signin'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'signup'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => setTab('sync')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'sync'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sync Station
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {tab === 'signup' && (
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
                Cadet Call-Sign
              </label>
              <input
                type="text"
                required
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                className={`p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                  isDark
                    ? 'bg-[#181926] border-violet-500/20 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
              Laboratory Comm / Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                isDark
                  ? 'bg-[#181926] border-violet-500/20 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
              {tab === 'sync' ? 'Station Auth Key' : 'Security Passphrase'}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                isDark
                  ? 'bg-[#181926] border-violet-500/20 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-xs text-violet-300 flex items-center gap-2 mt-1">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>All local progress (1,840 KP, 7-Day streak) will be bound to this account.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition-all mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                <span>Authenticating with Global Relay...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">lock_open</span>
                <span>
                  {tab === 'signin' && 'Authenticate Session'}
                  {tab === 'signup' && 'Create Cadet Credentials'}
                  {tab === 'sync' && 'Sync to Telemetry Cloud'}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
