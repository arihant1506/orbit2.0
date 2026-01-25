import React, { useState, useMemo } from 'react';
import { UserProfile, ThemeMode } from '../types';
import { User, Mail, Lock, Shield, Moon, Sun, Monitor, Bell, Calendar, Download, RefreshCw, Trash2, LogOut, ChevronRight, Check, AlertTriangle, Smartphone, Globe, Code, LayoutGrid, X, Palette, Sparkles, Bot, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playOrbitSound } from '../utils/audio';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updates: Partial<UserProfile>) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onExportData: () => void;
  onForceSync: () => void;
  lastSyncTime: Date | null;
  isSyncing?: boolean;
}

// --- AVATAR CONFIGURATION ---
const AVATAR_CATEGORIES = [
  { id: 'bottts', name: 'Mecha', icon: Bot, desc: 'Cybernetic Units' },
  { id: 'avataaars', name: 'Pilot', icon: User, desc: 'Human Personnel' },
  { id: 'notionists', name: 'Vector', icon: Code, desc: 'Minimalist Lineart' },
  { id: 'micah', name: 'Artist', icon: Palette, desc: 'Creative Expression' },
  { id: 'lorelei', name: 'Ether', icon: Sparkles, desc: 'Fantasy Avatars' },
];

const AvatarSelectorModal = ({ isOpen, onClose, onSelect, currentAvatar }: { isOpen: boolean, onClose: () => void, onSelect: (url: string) => void, currentAvatar?: string }) => {
    const [activeCat, setActiveCat] = useState('bottts');
    
    // Generate 12 avatars per category deterministically
    const avatars = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => {
             const seed = `Orbit_v3_${activeCat}_${i}`; 
             return `https://api.dicebear.com/9.x/${activeCat}/svg?seed=${seed}&backgroundColor=transparent`;
        });
    }, [activeCat]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in" onClick={onClose}>
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               onClick={(e) => e.stopPropagation()}
               className="w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col h-full max-h-[85vh] relative group ring-1 ring-white/5"
             >
                  {/* Cinematic Background FX */}
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none" />

                  {/* Header */}
                  <div className="flex-shrink-0 p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/5 relative z-10 backdrop-blur-md">
                      <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                              <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div>
                              <h3 className="text-xl sm:text-2xl font-black italic text-white uppercase tracking-tighter">Identity Fabricator</h3>
                              <p className="text-[10px] sm:text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2 opacity-80">
                                 Neural Interface Customization
                              </p>
                          </div>
                      </div>
                      <button onClick={onClose} className="p-2 sm:p-3 hover:bg-white/10 rounded-full transition-colors group border border-transparent hover:border-white/10">
                          <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 group-hover:text-white transition-colors" />
                      </button>
                  </div>

                  {/* Category Tabs - Scrollable */}
                  <div className="flex-shrink-0 border-b border-white/5 bg-black/40 relative z-10">
                      <div className="flex overflow-x-auto no-scrollbar px-4 sm:px-6 py-2 gap-2 sm:gap-4 items-center">
                          {AVATAR_CATEGORIES.map(cat => (
                              <button
                                 key={cat.id}
                                 onClick={() => { setActiveCat(cat.id); playOrbitSound('click'); }}
                                 className={`relative flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-4 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] transition-all flex-shrink-0 whitespace-nowrap group ${activeCat === cat.id ? 'bg-white/10 text-cyan-400 shadow-inner' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                              >
                                  <cat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeCat === cat.id ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                                  {cat.name}
                                  {activeCat === cat.id && (
                                    <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan-500 shadow-[0_0_10px_cyan]" />
                                  )}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Grid Area - Fluid & Responsive */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative z-10 bg-gradient-to-b from-black/20 to-transparent custom-scrollbar">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5 pb-8">
                          <AnimatePresence mode='popLayout'>
                              {avatars.map((url, i) => (
                                  <motion.button
                                      key={url}
                                      layout
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{ delay: i * 0.02, type: 'spring', stiffness: 300, damping: 25 }}
                                      onClick={() => onSelect(url)}
                                      className={`group relative aspect-square rounded-[1.5rem] border-2 overflow-hidden transition-all duration-300 ${currentAvatar === url ? 'border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)] bg-cyan-900/10' : 'border-white/5 hover:border-white/20 hover:shadow-xl hover:shadow-cyan-500/5 bg-white/5'}`}
                                  >
                                      {/* Inner Vignette */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                                      
                                      <img src={url} alt="avatar" className="w-full h-full object-cover p-3 sm:p-4 transform group-hover:scale-110 transition-transform duration-500 filter drop-shadow-xl" />
                                      
                                      {/* Selection Overlay */}
                                      <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px] transition-all duration-300 ${currentAvatar === url ? 'bg-black/20 opacity-100' : 'bg-black/60 opacity-0 group-hover:opacity-100'}`}>
                                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transform transition-transform ${currentAvatar === url ? 'bg-cyan-500 text-black scale-100' : 'bg-white text-black scale-90'}`}>
                                              <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                                          </div>
                                          <span className={`text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest ${currentAvatar === url ? 'text-cyan-400' : 'text-white'}`}>
                                            {currentAvatar === url ? 'Active' : 'Select'}
                                          </span>
                                      </div>
                                      
                                      {currentAvatar === url && (
                                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_cyan] animate-pulse" />
                                      )}
                                  </motion.button>
                              ))}
                          </AnimatePresence>
                      </div>
                  </div>
                  
                  {/* Footer Info */}
                  <div className="flex-shrink-0 p-3 sm:p-4 border-t border-white/5 bg-black/60 text-center backdrop-blur-md">
                      <p className="text-[8px] sm:text-[9px] font-mono text-slate-500 uppercase tracking-[0.3em]">
                        Rendered via Orbit Neural Engine • Category: {AVATAR_CATEGORIES.find(c => c.id === activeCat)?.desc}
                      </p>
                  </div>
             </motion.div>
        </div>
    );
};

const ChangePasswordModal = ({ isOpen, onClose, user, onUpdate }: { isOpen: boolean, onClose: () => void, user: UserProfile, onUpdate: (updates: Partial<UserProfile>) => void }) => {
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation (In a real app, verify against hash)
        if (currentPass !== user.password) {
            setError('Current password incorrect');
            playOrbitSound('error');
            return;
        }
        if (newPass.length < 6) {
            setError('New password must be at least 6 characters');
            playOrbitSound('error');
            return;
        }
        if (newPass !== confirmPass) {
            setError('New passwords do not match');
            playOrbitSound('error');
            return;
        }

        onUpdate({ password: newPass });
        playOrbitSound('success_chord');
        onClose();
        // Reset form
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
                
                <div className="p-6 sm:p-8 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Security Protocol</h3>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-2">Current Credential</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                                <input 
                                    type="password" 
                                    value={currentPass}
                                    onChange={(e) => setCurrentPass(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-sm outline-none focus:border-red-500/50 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="space-y-1 pt-2">
                            <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-2">New Credential</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                                <input 
                                    type="password" 
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-sm outline-none focus:border-red-500/50 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-2">Verify Credential</label>
                            <div className="relative">
                                <Check className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                                <input 
                                    type="password" 
                                    value={confirmPass}
                                    onChange={(e) => setConfirmPass(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-sm outline-none focus:border-red-500/50 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs font-mono bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                <AlertTriangle className="w-3 h-3" /> {error}
                            </div>
                        )}

                        <button type="submit" className="w-full py-4 mt-2 bg-red-600 hover:bg-red-500 text-white font-black italic uppercase rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95 text-xs sm:text-sm tracking-wider">
                            Update Access Keys
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, 
  onUpdateUser, 
  onLogout, 
  onDeleteAccount, 
  onExportData,
  onForceSync,
  lastSyncTime,
  isSyncing 
}) => {
  const [email, setEmail] = useState(user.email || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const preferences = user.preferences || {
    theme: 'system',
    startOfWeek: 'Monday',
    timeFormat: '12h',
    notifications: { dailyReminder: true, taskAlerts: true }
  };

  const handleSaveEmail = () => {
    onUpdateUser({ email });
    setIsEditingEmail(false);
    playOrbitSound('success_chord');
  };
  
  const handleAvatarSelect = (url: string) => {
    onUpdateUser({ avatar: url });
    setShowAvatarModal(false);
    playOrbitSound('power_up');
  };

  const updatePreference = (key: string, value: any) => {
    playOrbitSound('click');
    const newPrefs = { ...preferences, [key]: value };
    onUpdateUser({ preferences: newPrefs });
  };

  const toggleNotification = (key: 'dailyReminder' | 'taskAlerts') => {
    playOrbitSound('click');
    const newNotifs = { ...preferences.notifications, [key]: !preferences.notifications[key] };
    onUpdateUser({ preferences: { ...preferences, notifications: newNotifs } });
  };

  return (
    <div className="animate-fade-in-up space-y-6 sm:space-y-8 pb-32">
      <AvatarSelectorModal 
        isOpen={showAvatarModal} 
        onClose={() => setShowAvatarModal(false)}
        onSelect={handleAvatarSelect}
        currentAvatar={user.avatar}
      />

      <ChangePasswordModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        user={user}
        onUpdate={onUpdateUser}
      />
      
      {/* 1. IDENTITY HEADER */}
      <div className="relative p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 overflow-hidden shadow-2xl group">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
         <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-1000" />
         
         <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative group/avatar cursor-pointer" onClick={() => setShowAvatarModal(true)}>
               <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] shadow-[0_0_30px_rgba(6,182,212,0.3)] group-hover/avatar:shadow-[0_0_50px_rgba(6,182,212,0.5)] transition-all duration-500">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden relative">
                     {user.avatar ? (
                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover transform group-hover/avatar:scale-110 transition-transform duration-500" />
                     ) : (
                        <User className="w-10 h-10 text-cyan-400" />
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                     
                     {/* Overlay Icon */}
                     <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-[2px]">
                         <LayoutGrid className="w-6 h-6 text-white drop-shadow-md" />
                     </div>
                  </div>
               </div>
               <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-slate-800 border border-slate-600 text-slate-300 group-hover/avatar:text-white group-hover/avatar:bg-cyan-500 group-hover/avatar:border-cyan-400 transition-all shadow-lg z-20">
                  <RefreshCw className="w-3 h-3" />
               </button>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
               <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">{user.username}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold font-mono uppercase tracking-widest">
                    Pilot
                  </span>
               </div>
               
               <div className="space-y-2 max-w-md mx-auto sm:mx-0">
                  {/* Email Field */}
                  <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 border border-white/5">
                     <Mail className="w-4 h-4 text-slate-500" />
                     {isEditingEmail ? (
                        <div className="flex items-center gap-2 flex-1">
                           <input 
                              value={email} 
                              onChange={(e) => setEmail(e.target.value)}
                              className="bg-transparent border-none outline-none text-xs font-mono text-white w-full placeholder:text-slate-600"
                              placeholder="Enter email address"
                              autoFocus
                           />
                           <button onClick={handleSaveEmail} className="text-green-400 hover:text-green-300"><Check className="w-3 h-3" /></button>
                        </div>
                     ) : (
                        <div onClick={() => setIsEditingEmail(true)} className="flex-1 text-xs font-mono text-slate-400 cursor-pointer hover:text-cyan-400 transition-colors truncate">
                           {user.email || 'Link Email Address...'}
                        </div>
                     )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-wider justify-center sm:justify-start">
                     <span>Joined: {new Date(user.joinedDate).toLocaleDateString()}</span>
                     <span>•</span>
                     <span>Orbit v3.2</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* 2. APP PREFERENCES */}
         <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <Smartphone className="w-4 h-4" /> System Preferences
            </h3>

            <div className="space-y-6">
               {/* Theme Selector */}
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Moon className="w-4 h-4" /></div>
                     <span className="text-sm font-bold text-slate-200">Interface Theme</span>
                  </div>
                  <div className="flex bg-black/30 rounded-lg p-1 border border-white/5">
                     {(['light', 'system', 'dark'] as const).map((t) => (
                        <button 
                           key={t}
                           onClick={() => updatePreference('theme', t)}
                           className={`p-2 rounded-md transition-all ${preferences.theme === t ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                           {t === 'light' ? <Sun className="w-3.5 h-3.5" /> : t === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                        </button>
                     ))}
                  </div>
               </div>

               {/* Week Start */}
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Calendar className="w-4 h-4" /></div>
                     <span className="text-sm font-bold text-slate-200">Start of Week</span>
                  </div>
                  <button 
                     onClick={() => updatePreference('startOfWeek', preferences.startOfWeek === 'Monday' ? 'Sunday' : 'Monday')}
                     className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider min-w-[80px]"
                  >
                     {preferences.startOfWeek}
                  </button>
               </div>

               {/* Notifications */}
               <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleNotification('dailyReminder')}>
                     <div className="flex items-center gap-3 opacity-80">
                        <Bell className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-mono text-slate-300 uppercase">Daily Briefing (08:00)</span>
                     </div>
                     <div className={`w-8 h-4 rounded-full relative transition-colors ${preferences.notifications.dailyReminder ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${preferences.notifications.dailyReminder ? 'left-4.5' : 'left-0.5'}`} />
                     </div>
                  </div>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleNotification('taskAlerts')}>
                     <div className="flex items-center gap-3 opacity-80">
                        <AlertTriangle className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-mono text-slate-300 uppercase">Protocol Alerts</span>
                     </div>
                     <div className={`w-8 h-4 rounded-full relative transition-colors ${preferences.notifications.taskAlerts ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${preferences.notifications.taskAlerts ? 'left-4.5' : 'left-0.5'}`} />
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* 3. DATA & SECURITY */}
         <div className="space-y-6">
            {/* Sync Card */}
            <div className="p-6 rounded-[2rem] bg-emerald-900/10 border border-emerald-500/20 backdrop-blur-md">
                <h3 className="text-xs font-bold font-mono text-emerald-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                   <Globe className="w-4 h-4" /> Cloud Uplink
                </h3>
                <div className="flex items-center justify-between mb-4">
                   <div>
                      <div className="text-lg font-black italic text-white uppercase">Sync Status</div>
                      <div className="text-[10px] font-mono text-emerald-400/60 uppercase tracking-widest">
                         {lastSyncTime ? `Last active: ${lastSyncTime.toLocaleTimeString()}` : 'Waiting for connection...'}
                      </div>
                   </div>
                   <div className={`w-3 h-3 rounded-full ${lastSyncTime ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-700'}`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                      onClick={onForceSync}
                      disabled={isSyncing}
                      className="py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-900 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> 
                      {isSyncing ? 'Syncing...' : 'Force Sync'}
                   </button>
                   <button 
                      onClick={onExportData} 
                      className="py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-white hover:text-slate-900 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95"
                   >
                      <Download className="w-3 h-3" /> Export JSON
                   </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="p-6 rounded-[2rem] bg-red-900/5 border border-red-500/10 backdrop-blur-md">
                <h3 className="text-xs font-bold font-mono text-red-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                   <Shield className="w-4 h-4" /> Danger Zone
                </h3>
                <div className="space-y-3">
                   <button onClick={() => { setShowPasswordModal(true); playOrbitSound('click'); }} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group">
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white">Change Password</span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white" />
                   </button>
                   <button onClick={() => { if(confirm('Are you sure? This action is irreversible.')) onDeleteAccount(); }} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 transition-colors group text-red-400">
                      <span className="text-xs font-bold uppercase tracking-wide">Delete Account</span>
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
            </div>
         </div>
      </div>

      {/* 4. FOOTER & CREDITS */}
      <div className="text-center pt-8 border-t border-white/5">
         <div className="flex items-center justify-center gap-2 mb-6">
             <Code className="w-4 h-4 text-cyan-500" />
             <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.3em]">
                System Architecture by <span className="text-cyan-400">Arihant / Aj Production</span>
             </span>
         </div>
         
         <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 mb-4">
            <div className="flex gap-6">
                <button className="text-[10px] font-mono text-slate-600 hover:text-white uppercase tracking-wider transition-colors">Privacy Policy</button>
                <button className="text-[10px] font-mono text-slate-600 hover:text-white uppercase tracking-wider transition-colors">Terms of Service</button>
            </div>
            
            <button 
                onClick={onLogout} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all text-[10px] font-bold font-mono uppercase tracking-widest group shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
               <LogOut className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" /> 
               Disconnect
            </button>
         </div>

         <p className="text-[9px] text-slate-700 font-mono">Orbit Routine Tracker v3.2.0 (Build 2024.10.25)</p>
      </div>
    </div>
  );
};