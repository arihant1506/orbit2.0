
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Droplet, Clock, GraduationCap, Zap, Power, Check, Activity, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPreferences } from '../types';
import { playOrbitSound } from '../utils/audio';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { supabase } from '../utils/supabase';

interface NotificationControlProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

export const NotificationControl: React.FC<NotificationControlProps> = ({ preferences, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // New Push Hook
  const { subscribeToPush, loading: pushLoading } = usePushNotifications();

  // Safe check for Notification API
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
        setIsSupported(true);
        setPermission(Notification.permission);
    } else {
        setIsSupported(false);
        setPermission('denied');
    }
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSystemAccess = async () => {
    playOrbitSound('click');
    if (!isSupported) {
        alert("Notifications are not supported in this environment.");
        return;
    }
    
    // 1. Request Browser Permission (Frontend)
    try {
        const result = await Notification.requestPermission();
        setPermission(result);
        
        if (result === 'granted') {
            // 2. Subscribe to Backend (VAPID)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const success = await subscribeToPush(user.id);
                if (success) {
                    playOrbitSound('power_up');
                    alert("Secure Uplink Established. You will receive alerts even when offline.");
                } else {
                    playOrbitSound('error');
                    // Silent failure for Vercel users without backend
                    console.warn("Push sync skipped: Backend unavailable. Local alerts active.");
                }
            } else {
                alert("Please login to enable cloud notifications.");
            }
        } else {
            playOrbitSound('error');
        }
    } catch (e) {
        console.error("Permission request failed", e);
    }
  };

  const toggleChannel = (key: 'water' | 'schedule' | 'academic') => {
    const current = preferences.notifications?.[key] ?? true;
    const newState = !current;
    
    playOrbitSound(newState ? 'liquid_activate' : 'liquid_deactivate');

    onUpdate({
        ...preferences,
        notifications: {
            ...preferences.notifications,
            [key]: newState
        }
    });
  };

  const notifs = preferences.notifications || { water: true, schedule: true, academic: true };
  const isMasterEnabled = permission === 'granted' && isSupported;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => { setIsOpen(!isOpen); playOrbitSound('click'); }}
        className={`relative h-9 px-3 rounded-full flex items-center gap-2 border transition-all duration-300 group overflow-hidden ${isMasterEnabled ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
      >
        <div className="relative z-10 flex items-center gap-2">
            {isMasterEnabled ? <Activity className="w-3.5 h-3.5 animate-pulse" /> : <Bell className="w-3.5 h-3.5" />}
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest hidden sm:block">
                {isSupported ? (isMasterEnabled ? 'SYS.ONLINE' : 'SYS.SILENT') : 'UNSUPPORTED'}
            </span>
        </div>
        
        {/* Background Glow */}
        {isMasterEnabled && (
            <div className="absolute inset-0 bg-cyan-500/10 animate-pulse-slow" />
        )}
      </button>

      {/* DROPDOWN PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 12, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 max-w-[calc(100vw-2rem)] origin-top-right z-[100]"
          >
            {/* Main Container */}
            <div className="rounded-[1.8rem] bg-[#09090b] border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-white/5 relative">
                
                {/* Background Noise Texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />

                {/* 1. Header & Master Status */}
                <div className="p-5 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent relative">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xs font-black italic text-white uppercase tracking-tighter">Neural Uplink Config</h3>
                            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Notification Protocols</p>
                        </div>
                        <div className={`px-2 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isMasterEnabled ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isMasterEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            {isSupported ? (isMasterEnabled ? 'Signal Strong' : 'Signal Lost') : 'No Signal'}
                        </div>
                    </div>

                    <button 
                        onClick={handleSystemAccess}
                        disabled={pushLoading || !isSupported}
                        className={`w-full relative group overflow-hidden rounded-xl border transition-all duration-500 ${isMasterEnabled ? 'bg-cyan-950/20 border-cyan-500/20 hover:bg-cyan-900/30' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'} ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="relative z-10 flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isMasterEnabled ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                                    {pushLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isMasterEnabled ? <Zap className="w-4 h-4 fill-current" /> : <Power className="w-4 h-4" />)}
                                </div>
                                <div className="text-left">
                                    <div className={`text-xs font-bold ${isMasterEnabled ? 'text-white' : 'text-slate-300'}`}>
                                        {isSupported ? (isMasterEnabled ? 'Re-Sync Uplink' : 'Enable System Access') : 'Hardware Unsupported'}
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-mono">
                                        {isSupported ? (isMasterEnabled ? 'Cloud connection active' : 'Grant browser permissions') : 'Browser missing API'}
                                    </div>
                                </div>
                            </div>
                            {isMasterEnabled && <Check className="w-4 h-4 text-cyan-400" />}
                        </div>
                        {isMasterEnabled && <div className="absolute inset-0 bg-cyan-500/5 animate-pulse-slow" />}
                    </button>
                </div>

                {/* 2. Channel Toggles */}
                <div className="p-2 bg-black/40">
                    <div className="px-3 py-2 text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Active Channels
                    </div>
                    
                    <div className="space-y-1">
                        <ChannelToggle 
                            label="Bio-Metrics" 
                            sub="Hydration & Health"
                            active={notifs.water} 
                            icon={Droplet} 
                            color="blue"
                            onClick={() => toggleChannel('water')}
                        />

                        <ChannelToggle 
                            label="Routine Logic" 
                            sub="Task Sequence"
                            active={notifs.schedule} 
                            icon={Clock} 
                            color="amber"
                            onClick={() => toggleChannel('schedule')}
                        />

                        <ChannelToggle 
                            label="Academic Uplink" 
                            sub="Class Warnings (15m/5m)"
                            active={notifs.academic} 
                            icon={GraduationCap} 
                            color="purple"
                            onClick={() => toggleChannel('academic')}
                        />
                    </div>
                </div>

                {/* 3. Footer */}
                <div className="p-3 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">v3.2.0 Secure</span>
                    <button onClick={() => setIsOpen(false)} className="text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                        Close
                    </button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChannelToggle = ({ label, sub, active, icon: Icon, color, onClick }: any) => {
    const colors: any = {
        blue: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30' },
        amber: { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' },
        purple: { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/30' },
    };
    const style = colors[color];

    return (
        <div className="group relative p-3 rounded-xl border border-transparent hover:border-white/5 transition-all bg-transparent hover:bg-white/5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border transition-all duration-300 ${active ? `${style.bg}/20 ${style.border} ${style.text}` : 'bg-slate-800 border-white/5 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <div>
                        <div className={`text-xs font-bold transition-colors ${active ? 'text-white' : 'text-slate-500'}`}>{label}</div>
                        <div className="text-[9px] font-mono text-slate-600">{sub}</div>
                    </div>
                </div>

                <button 
                    onClick={onClick}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 border ${active ? `${style.bg} border-transparent shadow-[0_0_15px_${style.bg}]` : 'bg-slate-800 border-white/10'}`}
                >
                    <div className={`absolute top-0.5 bottom-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${active ? 'left-[26px]' : 'left-0.5'}`}>
                        {active && <div className={`absolute inset-0 m-auto w-2 h-2 rounded-full ${style.bg}/50 animate-pulse`} />}
                    </div>
                </button>
            </div>
        </div>
    );
};
