
import React, { useState } from 'react';
import { Radio, Zap, Shield, Key, ArrowRight, User, Crown, Lock, Rocket } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (username: string, password?: string) => void;
}

// Sound Helper
const playAuthSound = (type: 'type' | 'success' | 'error') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'success') {
    // Access Granted Sound
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.2);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    osc.start(t);
    osc.stop(t + 0.4);
  } else if (type === 'error') {
    // Access Denied
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.2);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  }
};

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  // Owner State
  const [ownerPass, setOwnerPass] = useState('');
  const [ownerError, setOwnerError] = useState('');

  // User State
  const [userName, setUserName] = useState('');
  const [userPass, setUserPass] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [userError, setUserError] = useState('');

  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerPass === '12345678') {
      setOwnerError('');
      playAuthSound('success');
      onAuthSuccess('arihant', ownerPass);
    } else {
      playAuthSound('error');
      setOwnerError('INVALID MASTER KEY');
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim().length < 3) {
      setUserError('USERNAME TOO SHORT');
      playAuthSound('error');
      return;
    }
    if (userPass.length < 6) {
      setUserError('PASSWORD MIN 6 CHARS');
      playAuthSound('error');
      return;
    }
    setUserError('');
    playAuthSound('success');
    onAuthSuccess(userName.trim().toLowerCase(), userPass);
  };

  return (
    <div className="w-full max-w-5xl animate-fade-in-up p-2 sm:p-0">
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 mb-4 shadow-[0_0_30px_rgba(34,211,238,0.3)] animate-float">
          <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase font-sans">
          Orbit <span className="text-cyan-600 dark:text-cyan-400">OS</span>
        </h2>
        <p className="text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em] mt-2">
          Secure Terminal Access v3.2
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* COLUMN 1: OWNER CONSOLE */}
        <div className="relative overflow-hidden rounded-[2rem] bg-white/50 dark:bg-slate-950/40 border border-amber-500/20 backdrop-blur-xl p-6 sm:p-10 flex flex-col justify-between group shadow-xl dark:shadow-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-30"></div>
          
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Owner Console</h3>
                <p className="text-[8px] sm:text-[9px] font-mono text-amber-600/60 dark:text-amber-500/60 tracking-widest uppercase">Admin Identity Verified</p>
              </div>
            </div>

            <form onSubmit={handleOwnerSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] sm:text-[9px] font-mono text-slate-500 ml-2 uppercase">Operator</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                    <User className="w-4 h-4 text-amber-400/50" />
                  </div>
                  <input
                    type="text"
                    disabled
                    value="ARIHANT"
                    className="w-full bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl py-2.5 sm:py-3 pl-12 text-slate-400 dark:text-white/50 font-mono text-[10px] sm:text-xs uppercase tracking-widest cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] sm:text-[9px] font-mono text-slate-500 ml-2 uppercase">Master Key</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                    <Key className="w-4 h-4 text-amber-400/50" />
                  </div>
                  <input
                    type="password"
                    value={ownerPass}
                    onChange={(e) => setOwnerPass(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full bg-white dark:bg-slate-900/60 border rounded-xl py-2.5 sm:py-3 pl-12 pr-4 text-slate-900 dark:text-white font-mono text-[10px] sm:text-xs tracking-widest focus:outline-none focus:border-amber-500/40 transition-all ${ownerError ? 'border-red-500/50' : 'border-slate-200 dark:border-white/10'}`}
                  />
                </div>
                {ownerError && <p className="text-[8px] font-mono text-red-500 dark:text-red-400 mt-1 ml-2 uppercase tracking-tighter">{ownerError}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black italic tracking-tighter uppercase py-2.5 sm:py-3 rounded-xl transition-all flex items-center justify-center gap-2 group/btn text-xs sm:text-sm"
              >
                Launch Admin Mode
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          <div className="mt-8 flex items-center gap-2 opacity-30 text-[8px] font-mono text-amber-600 dark:text-amber-500 uppercase">
             <Shield className="w-3 h-3" /> System Root Access Enabled
          </div>
        </div>

        {/* COLUMN 2: USER CONSOLE */}
        <div className="relative overflow-hidden rounded-[2rem] bg-white/50 dark:bg-slate-950/40 border border-cyan-500/20 backdrop-blur-xl p-6 sm:p-10 flex flex-col justify-between shadow-xl dark:shadow-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30"></div>
          
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 sm:p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Pilot Hub</h3>
                <p className="text-[8px] sm:text-[9px] font-mono text-cyan-600/60 dark:text-cyan-500/60 tracking-widest uppercase">General Operations</p>
              </div>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-4">
               <div className="space-y-1">
                <label className="text-[8px] sm:text-[9px] font-mono text-slate-500 ml-2 uppercase">Callsign</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                    <User className="w-4 h-4 text-cyan-400/50" />
                  </div>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="USERNAME"
                    className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 sm:py-3 pl-12 text-slate-900 dark:text-white font-mono text-[10px] sm:text-xs uppercase tracking-widest focus:outline-none focus:border-cyan-500/40 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] sm:text-[9px] font-mono text-slate-500 ml-2 uppercase">Security Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                    <Lock className="w-4 h-4 text-cyan-400/50" />
                  </div>
                  <input
                    type="password"
                    value={userPass}
                    onChange={(e) => setUserPass(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full bg-white dark:bg-slate-900/60 border rounded-xl py-2.5 sm:py-3 pl-12 pr-4 text-slate-900 dark:text-white font-mono text-[10px] sm:text-xs tracking-widest focus:outline-none focus:border-cyan-500/40 transition-all ${userError ? 'border-red-500/50' : 'border-slate-200 dark:border-white/10'}`}
                  />
                </div>
                {userError && <p className="text-[8px] font-mono text-red-500 dark:text-red-400 mt-1 ml-2 uppercase tracking-tighter">{userError}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black italic tracking-tighter uppercase py-2.5 sm:py-3 rounded-xl transition-all flex items-center justify-center gap-2 group/btn text-xs sm:text-sm"
              >
                {isRegistering ? 'Initialize Pilot' : 'Sync Interface'}
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="w-full text-[8px] sm:text-[9px] font-mono text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 uppercase tracking-widest transition-colors mt-2"
              >
                {isRegistering ? 'Have an account? Login' : 'First deployment? Register Identity'}
              </button>
            </form>
          </div>

          <div className="mt-8 flex items-center gap-2 opacity-30 text-[8px] font-mono text-cyan-600 dark:text-cyan-500 uppercase">
             <Shield className="w-3 h-3" /> Encrypted Local Store
          </div>
        </div>
      </div>
    </div>
  );
};
