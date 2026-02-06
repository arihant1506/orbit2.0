
import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, UserPreferences } from '../types';
import { User, Mail, Lock, Shield, Moon, Sun, Monitor, Bell, Download, RefreshCw, Trash2, LogOut, ChevronRight, Check, AlertTriangle, Smartphone, Globe, Code, LayoutGrid, X, Palette, Sparkles, Bot, Key, Phone as PhoneIcon, Database, Zap, Ghost, Grid, Smile, Dices, Shuffle, Cat, Skull, Bird, PenTool, Volume2, VolumeX, Vibrate, Move, Clock, Calendar, AppWindow, ExternalLink, Gamepad2, Music, Box, Fingerprint, Dice5, ScanFace, CheckCircle2, MessageSquare, Bug } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { playOrbitSound } from '../utils/audio';
import { testDatabaseConnection } from '../utils/db';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updates: Partial<UserProfile>) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onExportData: () => void;
  onForceSync: () => void;
  lastSyncTime: Date | null;
  isSyncing?: boolean;
  onInstallApp?: () => void;
  canInstall?: boolean;
  onToggleWidgetMode?: () => void;
}

// --- EXTENDED AVATAR CONFIG ---
const AVATAR_CATEGORIES = [
  { id: 'adventurer', name: 'Rebels', icon: Zap, color: 'from-yellow-400 to-orange-500', accent: 'text-yellow-400', bg: 'bg-yellow-500/20', desc: "Bold spirits." },
  { id: 'avataaars', name: 'Citizens', icon: User, color: 'from-blue-400 to-indigo-500', accent: 'text-blue-400', bg: 'bg-blue-500/20', desc: "Standard issue." },
  { id: 'bottts', name: 'Mecha', icon: Bot, color: 'from-cyan-400 to-emerald-500', accent: 'text-cyan-400', bg: 'bg-cyan-500/20', desc: "Logic cores." },
  { id: 'croodles', name: 'Critters', icon: Cat, color: 'from-lime-400 to-green-600', accent: 'text-lime-400', bg: 'bg-lime-500/20', desc: "Organic life." },
  { id: 'lorelei', name: 'Ether', icon: Ghost, color: 'from-purple-400 to-pink-500', accent: 'text-purple-400', bg: 'bg-purple-500/20', desc: "Drifters." },
  { id: 'notionists', name: 'Notion', icon: PenTool, color: 'from-slate-400 to-zinc-500', accent: 'text-slate-400', bg: 'bg-slate-500/20', desc: "Minimalist." },
  { id: 'open-peeps', name: 'Peeps', icon: Smile, color: 'from-green-400 to-teal-500', accent: 'text-green-400', bg: 'bg-green-500/20', desc: "Casual vibes." },
  { id: 'pixel-art', name: '8-Bit', icon: Gamepad2, color: 'from-red-400 to-pink-500', accent: 'text-red-400', bg: 'bg-red-500/20', desc: "Retro." },
  { id: 'big-ears', name: 'Funky', icon: Music, color: 'from-orange-300 to-red-400', accent: 'text-orange-400', bg: 'bg-orange-500/20', desc: "Loud designs." },
  { id: 'micah', name: 'Dream', icon: Sparkles, color: 'from-pink-300 to-rose-400', accent: 'text-pink-400', bg: 'bg-pink-500/20', desc: "Soft lines." },
  { id: 'fun-emoji', name: 'Emojis', icon: MessageSquare, color: 'from-yellow-300 to-amber-500', accent: 'text-amber-400', bg: 'bg-amber-500/20', desc: "Expressive." },
  { id: 'shapes', name: 'Geo', icon: Box, color: 'from-indigo-400 to-purple-600', accent: 'text-indigo-400', bg: 'bg-indigo-500/20', desc: "Abstract." },
  { id: 'croodles-neutral', name: 'Spirit', icon: Bug, color: 'from-teal-400 to-cyan-600', accent: 'text-teal-400', bg: 'bg-teal-500/20', desc: "Scribbles." },
];

// --- SUB-COMPONENTS ---

const SettingToggle = ({ label, active, onClick, icon: Icon, colorClass }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group ${active ? 'bg-white/5 border-white/20' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
    >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${active ? `bg-${colorClass}-500/20 text-${colorClass}-400` : 'bg-slate-800 text-slate-500'}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className={`text-sm font-bold font-mono uppercase tracking-wider ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
        </div>
        
        {/* Holographic Switch */}
        <div className={`w-12 h-6 rounded-full border relative transition-all duration-500 ${active ? `bg-${colorClass}-500/20 border-${colorClass}-500/50 shadow-[0_0_15px_rgba(var(--color-${colorClass}),0.3)]` : 'bg-black border-slate-700'}`}>
            <div className={`absolute top-0.5 bottom-0.5 w-5 h-5 rounded-full transition-all duration-500 shadow-md ${active ? `right-0.5 bg-${colorClass}-400` : 'left-0.5 bg-slate-600'}`} />
        </div>
    </button>
);

const TypewriterText = ({ text, className }: { text: string, className?: string }) => {
    const [displayed, setDisplayed] = useState('');
    
    useEffect(() => {
        setDisplayed('');
        let i = 0;
        const t = setInterval(() => {
            if (i < text.length) {
                setDisplayed(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(t);
            }
        }, 30);
        return () => clearInterval(t);
    }, [text]);

    return <span className={className}>{displayed}<span className="animate-pulse">_</span></span>;
};

const AvatarSelectorModal = ({ isOpen, onClose, onSelect, currentAvatar }: any) => {
    const [activeCatId, setActiveCatId] = useState('adventurer');
    const [seed, setSeed] = useState(Math.random().toString(36).substring(7));
    const [loading, setLoading] = useState(false);
    
    const activeConfig = AVATAR_CATEGORIES.find(c => c.id === activeCatId) || AVATAR_CATEGORIES[0];
    const previewUrl = `https://api.dicebear.com/9.x/${activeConfig.id}/svg?seed=${seed}&backgroundColor=transparent`;

    const handleRandomize = () => {
        playOrbitSound('click');
        setLoading(true);
        setTimeout(() => setLoading(false), 300);
        setSeed(Math.random().toString(36).substring(7));
    };

    const handleConfirm = () => {
        playOrbitSound('success_chord');
        onSelect(previewUrl);
    };

    // Staggered Entrance Animation for the Grid
    const gridContainerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.03, // Fast roll
                delayChildren: 0.2
            }
        }
    };

    const gridItemVariants: Variants = {
        hidden: { y: -20, opacity: 0, scale: 0.8 },
        visible: { 
            y: 0, 
            opacity: 1, 
            scale: 1,
            transition: { type: "spring", stiffness: 400, damping: 20 }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            
            {/* Modal Content - Centered & Compact */}
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-lg bg-[#050505] border border-white/10 rounded-[2.5rem] relative overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10"
            >
                {/* Header Strip */}
                <div className="flex items-center justify-between px-6 pt-6 pb-2 z-20">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <ScanFace className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Identity Lab</span>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* --- TOP: PREVIEW STAGE --- */}
                <div className="relative flex-none flex flex-col items-center justify-center p-6 z-10">
                    {/* Glow */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr ${activeConfig.color} opacity-20 blur-[80px] rounded-full pointer-events-none`} />
                    
                    <div className="relative cursor-pointer group" onClick={handleRandomize}>
                        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-white/10 bg-black/40 overflow-hidden relative shadow-2xl transition-transform active:scale-95">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                            <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className={`w-full h-full object-cover transition-all duration-300 ${loading ? 'blur-md scale-110 opacity-50' : 'blur-0 scale-100 opacity-100'}`} 
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Dice5 className="w-10 h-10 text-white animate-spin-slow" />
                            </div>
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#0a0a0a] border border-white/20 shadow-xl whitespace-nowrap">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${activeConfig.accent}`}>
                                {activeConfig.name}
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- MIDDLE: NEURAL MATRIX (Grid) --- */}
                <div className="flex-1 px-6 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 mb-3 opacity-60">
                        <LayoutGrid className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Select Archetype</span>
                    </div>
                    
                    {/* THE ROLL GRID */}
                    <motion.div 
                        variants={gridContainerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3 auto-rows-min pb-4"
                    >
                        {AVATAR_CATEGORIES.map(cat => (
                            <motion.button
                                key={cat.id}
                                variants={gridItemVariants}
                                onClick={() => { setActiveCatId(cat.id); playOrbitSound('click'); }}
                                className={`
                                    relative aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all
                                    ${activeCatId === cat.id 
                                        ? `bg-gradient-to-br ${cat.color} border-transparent text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-105 z-10` 
                                        : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300 hover:border-white/10'}
                                `}
                            >
                                <cat.icon className={`w-5 h-5 ${activeCatId === cat.id ? 'animate-bounce' : ''}`} />
                                <span className="text-[7px] font-black uppercase tracking-wide opacity-80 truncate w-full text-center px-1">
                                    {cat.name}
                                </span>
                            </motion.button>
                        ))}
                    </motion.div>
                </div>

                {/* --- BOTTOM: CONTROLS --- */}
                <div className="flex-none p-6 pt-2 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
                    <div className="flex gap-3">
                        <button onClick={handleRandomize} className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all active:scale-95 flex items-center justify-center gap-2 group">
                            <Shuffle className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Reroll</span>
                        </button>
                        <button onClick={handleConfirm} className={`flex-[2] py-4 rounded-xl font-black italic uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.02] active:scale-95 bg-gradient-to-r ${activeConfig.color} text-white`}>
                            <CheckCircle2 className="w-4 h-4" />
                            Initialize
                        </button>
                    </div>
                </div>

            </motion.div>
        </div>
    );
};

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, onUpdateUser, onLogout, onDeleteAccount, onExportData, onForceSync, lastSyncTime, isSyncing, onInstallApp, canInstall, onToggleWidgetMode
}) => {
  const [email, setEmail] = useState(user.email || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // --- PREFERENCES MANAGEMENT ---
  const prefs = user.preferences || {
      theme: 'dark',
      startOfWeek: 'Monday',
      timeFormat: '12h',
      soundEnabled: true,
      reducedMotion: false,
      haptics: true,
      notifications: { water: true, schedule: true, academic: true }
  };

  const updatePref = (key: keyof UserPreferences, value: any) => {
      playOrbitSound('click');
      onUpdateUser({ preferences: { ...prefs, [key]: value } });
  };

  const handleTestDB = async () => {
      playOrbitSound('click');
      const res = await testDatabaseConnection();
      alert(res.message);
  };
  
  const launchWidgetPopup = () => {
    window.open(
      `${window.location.pathname}?mode=widget`, 
      'OrbitWidget', 
      'width=350,height=600,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  return (
    <div className="animate-fade-in-up space-y-8 pb-32 max-w-6xl mx-auto">
      <AnimatePresence>
        {showAvatarModal && (
            <AvatarSelectorModal 
                isOpen={showAvatarModal} 
                onClose={() => setShowAvatarModal(false)} 
                onSelect={(url: string) => { onUpdateUser({avatar: url}); setShowAvatarModal(false); }} 
                currentAvatar={user.avatar} 
            />
        )}
      </AnimatePresence>
      
      {/* 1. IDENTITY CARD */}
      <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-r from-[#0f172a] to-[#020617] border border-white/10 shadow-2xl overflow-hidden group">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
         <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
         
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div onClick={() => setShowAvatarModal(true)} className="relative w-32 h-32 rounded-full border-4 border-white/10 cursor-pointer hover:border-cyan-500/50 transition-all overflow-hidden group/avatar shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-slate-500 m-auto mt-8" />}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity"><RefreshCw className="w-8 h-8 text-white" /></div>
            </div>
            
            <div className="text-center md:text-left flex-1 space-y-2">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter pr-2">{user.username}</h2>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold font-mono uppercase tracking-widest">
                        Pilot Lvl 1
                    </span>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 text-slate-400">
                    <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg border border-white/5">
                        <Mail className="w-3 h-3" />
                        {isEditingEmail ? (
                            <input value={email} onChange={e => setEmail(e.target.value)} onBlur={() => {onUpdateUser({email}); setIsEditingEmail(false)}} className="bg-transparent outline-none text-xs font-mono text-white w-40" autoFocus />
                        ) : (
                            <span onClick={() => setIsEditingEmail(true)} className="text-xs font-mono cursor-pointer hover:text-white">{user.email || 'Link Email...'}</span>
                        )}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                        ID: {user.username.slice(0,3).toUpperCase()}-{Math.floor(Math.random()*1000)}
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* 2. CONFIGURATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SYSTEM PREFERENCES */}
          <div className="space-y-6">
              <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4" /> System Core
              </h3>
              
              <div className="p-6 rounded-[2.5rem] bg-[#0c0a0e] border border-white/10 shadow-xl space-y-4">
                  {/* Sound & Haptics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SettingToggle 
                          label="Audio FX" 
                          active={prefs.soundEnabled} 
                          onClick={() => updatePref('soundEnabled', !prefs.soundEnabled)}
                          icon={prefs.soundEnabled ? Volume2 : VolumeX}
                          colorClass="cyan"
                      />
                      <SettingToggle 
                          label="Haptics" 
                          active={prefs.haptics} 
                          onClick={() => updatePref('haptics', !prefs.haptics)}
                          icon={Vibrate}
                          colorClass="purple"
                      />
                  </div>

                  {/* Visuals */}
                  <SettingToggle 
                      label="Reduced Motion" 
                      active={prefs.reducedMotion} 
                      onClick={() => updatePref('reducedMotion', !prefs.reducedMotion)}
                      icon={Move}
                      colorClass="emerald"
                  />

                  {/* Theme (Visual Only for now) */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
                      <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400"><Palette className="w-5 h-5" /></div>
                          <span className="text-sm font-bold font-mono uppercase tracking-wider text-slate-400">Interface Theme</span>
                      </div>
                      <div className="flex gap-2">
                          {['dark', 'light'].map(t => (
                              <button key={t} onClick={() => updatePref('theme', t)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${prefs.theme === t ? 'border-white bg-white/20 text-white' : 'border-white/10 text-slate-600'}`}>
                                  {t === 'dark' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

          {/* CHRONOLOGY & DATA */}
          <div className="space-y-6">
              <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Chronology & Data
              </h3>

              <div className="p-6 rounded-[2.5rem] bg-[#0c0a0e] border border-white/10 shadow-xl space-y-4">
                  
                  {/* Time Format */}
                  <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                      {['12h', '24h'].map(fmt => (
                          <button 
                            key={fmt} 
                            onClick={() => updatePref('timeFormat', fmt)}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${prefs.timeFormat === fmt ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                          >
                              {fmt} Clock
                          </button>
                      ))}
                  </div>

                  {/* Start of Week */}
                  <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                      {['Monday', 'Sunday'].map(day => (
                          <button 
                            key={day} 
                            onClick={() => updatePref('startOfWeek', day)}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${prefs.startOfWeek === day ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                          >
                              Start {day}
                          </button>
                      ))}
                  </div>

                  <div className="h-px bg-white/5 my-4" />

                  {/* Data Actions */}
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={onForceSync} disabled={isSyncing} className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all flex flex-col items-center justify-center gap-2 group">
                          <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{isSyncing ? 'Syncing...' : 'Force Sync'}</span>
                      </button>
                      
                      <button onClick={handleTestDB} className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex flex-col items-center justify-center gap-2">
                          <Database className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Test DB</span>
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* 3. DANGER ZONE & WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10">
              <h3 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <AppWindow className="w-4 h-4" /> Expansion
              </h3>
              <div className="space-y-3">
                  <button onClick={launchWidgetPopup} className="w-full flex items-center justify-between p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all text-purple-300">
                      <span className="text-xs font-bold uppercase tracking-wider">Launch Desktop Widget</span>
                      <ExternalLink className="w-4 h-4" />
                  </button>
                  {canInstall && (
                      <button onClick={onInstallApp} className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white">
                          <span className="text-xs font-bold uppercase tracking-wider">Install App</span>
                          <Download className="w-4 h-4" />
                      </button>
                  )}
              </div>
          </div>

          <div className="p-6 rounded-[2.5rem] bg-red-950/10 border border-red-900/20">
              <h3 className="text-xs font-bold font-mono text-red-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <Shield className="w-4 h-4" /> Danger Zone
              </h3>
              <button onClick={() => { if(confirm('Are you sure? This is irreversible.')) onDeleteAccount(); }} className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete Account
              </button>
          </div>
      </div>

      <div className="text-center pt-8 border-t border-white/5 pb-10">
         <div className="flex items-center justify-center gap-2 mb-4">
             <Code className="w-4 h-4 text-cyan-500" />
             <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.3em]">
                System Architecture by <span className="text-cyan-400">Arihant / Aj Production</span>
             </span>
         </div>
         <button onClick={onLogout} className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-widest flex items-center justify-center gap-2 mx-auto">
             <LogOut className="w-4 h-4" /> Disconnect Session
         </button>
      </div>
    </div>
  );
};
