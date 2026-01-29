
import React, { useState, useEffect } from 'react';
import { Radio, Shield, Key, ArrowRight, User, Crown, Lock, Rocket, Loader2, ScanFace } from 'lucide-react';
import { playOrbitSound } from '../utils/audio';

interface AuthProps {
  onAuthSuccess: (username: string, password?: string, isRegistering?: boolean) => Promise<string | null>;
  isSyncing?: boolean;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, isSyncing = false }) => {
  // Owner State
  const [ownerPass, setOwnerPass] = useState('');
  const [ownerError, setOwnerError] = useState('');
  const [isOwnerLoading, setIsOwnerLoading] = useState(false);

  // User State
  const [userName, setUserName] = useState('');
  const [userPass, setUserPass] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [userError, setUserError] = useState('');

  // Automatic Owner Login Effect
  useEffect(() => {
    if (ownerPass === '12345678') {
      handleOwnerSubmit();
    }
  }, [ownerPass]);

  const handleOwnerSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (ownerPass === '12345678') {
      setOwnerError('');
      setIsOwnerLoading(true);
      playOrbitSound('power_up');
      
      // Attempt login
      const error = await onAuthSuccess('arihant', ownerPass, false);
      
      if (error) {
        playOrbitSound('error');
        setOwnerError(error);
        setIsOwnerLoading(false);
      }
    } else {
      // Only show error if manually submitted, not while typing
      if (e) {
        playOrbitSound('error');
        setOwnerError('ACCESS DENIED');
      }
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim().length < 3) {
      setUserError('USERNAME TOO SHORT');
      playOrbitSound('error');
      return;
    }
    if (userPass.length < 6) {
      setUserError('PASSWORD MIN 6 CHARS');
      playOrbitSound('error');
      return;
    }
    setUserError('');
    playOrbitSound('click');
    
    // Await result to show error inline
    const error = await onAuthSuccess(userName.trim().toLowerCase(), userPass, isRegistering);
    if (error) {
        playOrbitSound('error');
        setUserError(error.toUpperCase());
    }
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 relative">
        
        {/* Decorative Connector */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 font-mono text-xs font-bold">
                VS
            </div>
        </div>

        {/* COLUMN 1: OWNER CONSOLE (Gold/Amber) */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0c0a00]/80 border border-amber-500/20 backdrop-blur-xl p-6 sm:p-10 flex flex-col justify-between group shadow-2xl shadow-amber-900/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Command Override</h3>
                <p className="text-[9px] font-mono text-amber-500/80 tracking-widest uppercase">Admin Verification Required</p>
              </div>
            </div>

            <form onSubmit={handleOwnerSubmit} className="space-y-6">
              <div className="space-y-1">
                <div className="flex justify-between">
                    <label className="text-[9px] font-mono text-amber-600/70 ml-2 uppercase tracking-widest">Operator Identity</label>
                    <span className="text-[9px] font-mono text-amber-500 font-bold uppercase flex items-center gap-1"><ShieldCheckIcon /> Verified</span>
                </div>
                <div className="relative group/input">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-amber-500/50" />
                  </div>
                  <input
                    type="text"
                    disabled
                    value="ARIHANT (OWNER)"
                    className="w-full bg-amber-950/20 border border-amber-500/20 rounded-xl py-4 pl-12 text-amber-100 font-mono text-xs uppercase tracking-widest cursor-not-allowed opacity-70"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-amber-600/70 ml-2 uppercase tracking-widest">Master Key</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Key className="w-4 h-4 text-amber-500/50 group-focus-within/input:text-amber-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={ownerPass}
                    onChange={(e) => setOwnerPass(e.target.value)}
                    placeholder="ENTER CODE"
                    className={`w-full bg-black/40 border rounded-xl py-4 pl-12 pr-4 text-white font-mono text-sm tracking-[0.5em] placeholder:tracking-normal focus:outline-none focus:border-amber-500/50 focus:bg-amber-950/30 transition-all ${ownerError ? 'border-red-500/50 animate-shake' : 'border-amber-500/20'}`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                     {ownerPass.length === 8 && !isOwnerLoading && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                  </div>
                </div>
                {ownerError && <p className="text-[9px] font-mono text-red-400 mt-2 ml-2 uppercase tracking-wide flex items-center gap-1"><AlertIcon /> {ownerError}</p>}
              </div>

              <button
                type="submit"
                disabled={isSyncing || isOwnerLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black italic tracking-tighter uppercase py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group/btn"
              >
                {isOwnerLoading || (isSyncing && ownerPass === '12345678') ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ScanFace className="w-4 h-4" /> Authenticate
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* COLUMN 2: USER CONSOLE (Cyan/Blue) */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#000814]/80 border border-cyan-500/20 backdrop-blur-xl p-6 sm:p-10 flex flex-col justify-between shadow-2xl shadow-cyan-900/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Pilot Access</h3>
                <p className="text-[9px] font-mono text-cyan-500/80 tracking-widest uppercase">Standard Operations</p>
              </div>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-6">
               <div className="space-y-1">
                <label className="text-[9px] font-mono text-cyan-600/70 ml-2 uppercase tracking-widest">Callsign</label>
                <div className="relative group/input">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-cyan-500/50 group-focus-within/input:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="USERNAME"
                    className="w-full bg-black/40 border border-slate-800 rounded-xl py-4 pl-12 text-white font-mono text-xs uppercase tracking-widest focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-950/20 transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-cyan-600/70 ml-2 uppercase tracking-widest">Security Code</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-cyan-500/50 group-focus-within/input:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={userPass}
                    onChange={(e) => setUserPass(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full bg-black/40 border rounded-xl py-4 pl-12 pr-4 text-white font-mono text-sm tracking-[0.3em] placeholder:tracking-normal focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-950/20 transition-all ${userError ? 'border-red-500/50' : 'border-slate-800'}`}
                  />
                </div>
                {userError && <p className="text-[9px] font-mono text-red-400 mt-2 ml-2 uppercase tracking-wide flex items-center gap-1"><AlertIcon /> {userError}</p>}
              </div>

              <button
                type="submit"
                disabled={isSyncing}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black italic tracking-tighter uppercase py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(8,145,178,0.2)] hover:shadow-[0_0_30px_rgba(8,145,178,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group/btn"
              >
                {isSyncing && !isOwnerLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isRegistering ? 'Register Identity' : 'Initialize Uplink'}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSyncing}
                onClick={() => { setIsRegistering(!isRegistering); playOrbitSound('click'); setUserError(''); }}
                className="w-full text-[9px] font-mono text-slate-500 hover:text-cyan-400 uppercase tracking-widest transition-colors mt-2"
              >
                {isRegistering ? 'Have an account? Login' : 'First deployment? Register Identity'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple icons for internal use
const ShieldCheckIcon = () => <Shield className="w-3 h-3" />;
const AlertIcon = () => <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center text-[8px] text-black font-bold">!</div>;
