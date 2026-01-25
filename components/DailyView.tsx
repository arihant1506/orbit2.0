
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleSlot, Category } from '../types';
import { Check, Terminal, Edit3, Trash2, Scan, Plus, X, ShieldCheck, Clock, Wifi, Activity, Globe, Zap, Sun, Moon, Cloud, Sunrise, Sunset, Loader2, Radio } from 'lucide-react';
import { LiquidSlider } from './LiquidSlider'; 
import { playOrbitSound } from '../utils/audio';

interface DailyViewProps {
  dayName: string;
  slots: ScheduleSlot[];
  username: string;
  onToggleSlot: (day: string, slotId: string) => void;
  onAddSlot: (slot: ScheduleSlot) => void;
  onRemoveSlot: (slotId: string) => void;
}

const THEME_CONFIG: Record<Category, any> = {
  Physical: { 
    glass: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    activeBorder: 'border-orange-500',
    text: 'text-orange-100',
    subText: 'text-orange-200/60',
    icon: 'text-orange-400',
    glow: 'shadow-[0_8px_32px_rgba(249,115,22,0.2)]',
    tint: '#f97316'
  },
  Academic: { 
    glass: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    activeBorder: 'border-cyan-500',
    text: 'text-cyan-100',
    subText: 'text-cyan-200/60',
    icon: 'text-cyan-400',
    glow: 'shadow-[0_8px_32px_rgba(6,182,212,0.2)]',
    tint: '#22d3ee'
  },
  Coding: { 
    glass: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    activeBorder: 'border-emerald-500',
    text: 'text-emerald-100',
    subText: 'text-emerald-200/60',
    icon: 'text-emerald-400',
    glow: 'shadow-[0_8px_32px_rgba(16,185,129,0.2)]',
    tint: '#10b981'
  },
  Creative: { 
    glass: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/30',
    activeBorder: 'border-fuchsia-500',
    text: 'text-fuchsia-100',
    subText: 'text-fuchsia-200/60',
    icon: 'text-fuchsia-400',
    glow: 'shadow-[0_8px_32px_rgba(217,70,239,0.2)]',
    tint: '#d946ef'
  },
  Rest: { 
    glass: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    activeBorder: 'border-indigo-500',
    text: 'text-indigo-100',
    subText: 'text-indigo-200/60',
    icon: 'text-indigo-400',
    glow: 'shadow-[0_8px_32px_rgba(99,102,241,0.2)]',
    tint: '#6366f1'
  },
  Logistics: { 
    glass: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    activeBorder: 'border-slate-500',
    text: 'text-slate-200',
    subText: 'text-slate-400/60',
    icon: 'text-slate-400',
    glow: 'shadow-[0_8px_32px_rgba(148,163,184,0.1)]',
    tint: '#94a3b8'
  },
};

// --- SOUND UTILS ---
// (Already imported from utils/audio)

// --- HELPERS ---
const getCategoryIcon = (category: Category) => {
  switch (category) {
    case 'Physical': return <Activity className="w-full h-full" />;
    case 'Academic': return <Zap className="w-full h-full" />;
    case 'Coding': return <Terminal className="w-full h-full" />;
    case 'Creative': return <Zap className="w-full h-full" />;
    case 'Rest': return <Moon className="w-full h-full" />;
    case 'Logistics': return <Zap className="w-full h-full" />;
    default: return <Zap className="w-full h-full" />;
  }
};

const getProtocolLabel = (category: Category): string => {
  switch (category) {
    case 'Physical': return 'KINETIC';
    case 'Academic': return 'NEURAL';
    case 'Coding': return 'LOGIC';
    case 'Creative': return 'VISION';
    case 'Rest': return 'STANDBY';
    case 'Logistics': return 'SYSTEM';
    default: return 'GENERAL';
  }
};

const getMinutesFromFormatted = (timeStr: string): number => {
  if (timeStr.toLowerCase().includes('all day')) return -1;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);
  if (!match) return 540; 
  let [_, h, m, p] = match;
  let hours = parseInt(h);
  if (p.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (p.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + parseInt(m);
};

const checkIsActive = (timeRange: string): boolean => {
    if (timeRange.toLowerCase().includes('all day')) return true;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const parts = timeRange.split(' - ').map(p => getMinutesFromFormatted(p.trim()));
    if (parts.length < 2) return false;
    const [start, end] = parts;
    if (start > end) return currentMinutes >= start || currentMinutes < end;
    return currentMinutes >= start && currentMinutes < end;
};

const LiquidMorphToggle = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => {
    return (
        <div className="relative w-24 h-12 bg-black/20 rounded-full flex items-center shadow-inner border border-white/5 overflow-hidden">
             <div className="absolute inset-0" style={{ filter: 'url(#goo-effect)' }}>
                  <div className={`absolute top-1 w-10 h-10 rounded-full bg-cyan-500 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-[0_0_20px_rgba(6,182,212,0.6)]`} style={{ left: value === 0 ? '4px' : '52px' }} />
                  <div className={`absolute top-1/2 -translate-y-1/2 w-8 h-4 bg-cyan-500/50 transition-all duration-500`} style={{ left: '32px', opacity: 0.5 }} />
             </div>
             <button onClick={() => { onChange(0); playOrbitSound('liquid_activate'); }} className={`relative z-10 w-1/2 h-full flex items-center justify-center font-black text-sm transition-colors duration-300 ${value === 0 ? 'text-white' : 'text-slate-600'}`}>AM</button>
             <button onClick={() => { onChange(1); playOrbitSound('liquid_deactivate'); }} className={`relative z-10 w-1/2 h-full flex items-center justify-center font-black text-sm transition-colors duration-300 ${value === 1 ? 'text-white' : 'text-slate-600'}`}>PM</button>
        </div>
    );
}

// --- NEW REFINED LIQUID TOGGLE ---
const LiquidToggle = ({ isCompleted, onToggle, theme }: { isCompleted: boolean, onToggle: (e: any) => void, theme: any }) => {
    return (
        <div 
            className="relative w-20 h-9 sm:w-24 sm:h-11 rounded-full cursor-pointer select-none touch-none group"
            onClick={(e) => {
               playOrbitSound(isCompleted ? 'liquid_deactivate' : 'liquid_activate');
               onToggle(e);
            }}
            onMouseEnter={() => playOrbitSound('hover')}
        >
            {/* Transparent Glass Track */}
            <div className={`absolute inset-0 rounded-full border transition-all duration-700 ease-out backdrop-blur-[4px] ${isCompleted ? 'bg-transparent border-white/20' : 'bg-transparent border-white/10'}`}>
                 <div className="absolute inset-0 bg-white/5 rounded-full" />
                 {/* Internal Glow when active */}
                 <div className={`absolute inset-0 rounded-full transition-opacity duration-700 ${isCompleted ? 'opacity-30' : 'opacity-0'}`} 
                      style={{ background: `radial-gradient(circle at center, ${theme.tint}, transparent 70%)` }} />
            </div>

            {/* Labels */}
            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none z-0">
                <span className={`text-[8px] sm:text-[9px] font-black font-mono tracking-widest transition-all duration-500 ${isCompleted ? 'opacity-0 -translate-x-2 blur-sm' : 'opacity-40 text-slate-400 translate-x-0'}`}>NO</span>
                <span className={`text-[8px] sm:text-[9px] font-black font-mono tracking-widest transition-all duration-500 ${isCompleted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 blur-sm'}`} style={{ color: theme.tint }}>YES</span>
            </div>

            {/* The Pure Liquid Orb Thumb */}
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 25, mass: 1 }}
                className="absolute top-0.5 bottom-0.5 w-8 sm:w-10 rounded-full z-10 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]"
                style={{ left: isCompleted ? 'calc(100% - 2.1rem)' : '0.15rem' }}
            >
                 {/* Glass Orb Body */}
                 <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isCompleted ? 'bg-white/10' : 'bg-white/5'} backdrop-blur-md border border-white/40 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.2)] overflow-hidden`}>
                     {/* Top Specular Highlight (Gloss) */}
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[40%] bg-gradient-to-b from-white/80 to-transparent rounded-t-full opacity-90" />
                     
                     {/* Iridescent Refraction */}
                     <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 via-transparent to-purple-400/20 mix-blend-overlay opacity-50" />
                     
                     {/* Active Tint */}
                     <div className={`absolute inset-0 transition-opacity duration-500 ${isCompleted ? 'opacity-30' : 'opacity-0'}`} style={{ backgroundColor: theme.tint }} />
                 </div>
                 
                 {/* Icon inside Orb */}
                 <div className="relative z-10 opacity-90">
                     {isCompleted ? (
                         <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                     ) : (
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-300/50 shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                     )}
                 </div>
            </motion.div>
            
            {/* External Glow for presence */}
             <div className={`absolute -inset-1 rounded-full transition-opacity duration-700 pointer-events-none blur-xl ${isCompleted ? 'opacity-30' : 'opacity-0'}`} style={{ background: theme.tint }} />
        </div>
    );
};

const ChronometerHUD = ({ timeRange, isActive, isDone, theme }: { timeRange: string, isActive: boolean, isDone: boolean, theme: any }) => {
  const [startStr, endStr] = timeRange.includes('-') ? timeRange.split('-').map(s => s.trim()) : [timeRange, ''];
  return (
    <div className={`flex flex-row sm:flex-col lg:flex-row items-center justify-between sm:justify-center lg:justify-between p-4 sm:p-5 w-full sm:w-40 lg:w-48 border-b sm:border-b-0 sm:border-r border-white/10 bg-black/30 backdrop-blur-sm rounded-t-3xl sm:rounded-l-3xl sm:rounded-tr-none relative overflow-hidden ${isDone ? 'opacity-40 grayscale' : ''}`}>
        <div className="relative z-10 text-left sm:text-center lg:text-left">
            <div className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest mb-1 opacity-60 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                {isActive ? 'CURRENT' : 'START'}
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight leading-none ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-slate-300'}`}>
                {startStr.replace(/AM|PM/, '').trim()}
            </div>
        </div>
        
        <div className="relative flex items-center justify-center px-4 sm:py-3 lg:py-0 lg:px-2">
             <div className="absolute w-full h-[1px] sm:w-[2px] lg:w-full lg:h-[1px] bg-white/10" />
             <div className={`relative z-10 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black font-mono tracking-wider border backdrop-blur-sm transition-all ${isActive ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-110' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                MIN
             </div>
        </div>
        
        {endStr && (
            <div className="relative z-10 text-right sm:text-center lg:text-right">
                <div className={`text-lg sm:text-xl font-bold font-mono tracking-tight leading-none ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                    {endStr.replace(/AM|PM/, '').trim()}
                </div>
            </div>
        )}
    </div>
  );
};

// --- LIVE WALLPAPER ENGINE ---
const WALLPAPER_COLLECTIONS = {
  dawn: [
    "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8", 
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef", 
    "https://images.unsplash.com/photo-1595837837078-438995874288", 
  ],
  morning: [ 
    "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c", 
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", 
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb", 
  ],
  noon: [ 
    "https://images.unsplash.com/photo-1501854140884-074cf2b21d25", 
    "https://images.unsplash.com/photo-1542345812-d98d5c95f13d", 
    "https://images.unsplash.com/photo-1506202687253-52e1b29d3527", 
  ],
  afternoon: [ 
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff", 
    "https://images.unsplash.com/photo-1504221507732-5246c045949b", 
    "https://images.unsplash.com/photo-1494548162494-384bba4ab999", 
  ],
  sunset: [ 
    "https://images.unsplash.com/photo-1472120435266-53113306b2a3", 
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e", 
    "https://images.unsplash.com/photo-1511884642898-4c92249f20b6", 
  ],
  night: [ 
    "https://images.unsplash.com/photo-1532978879514-67d7d4771501", 
    "https://images.unsplash.com/photo-1519681393798-3828fb4090bb", 
    "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b", 
    "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07", 
  ]
};

const useLiveWallpaper = () => {
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [nextUrl, setNextUrl] = useState<string>("");
  const [isCrossFading, setIsCrossFading] = useState(false);
  const [phaseData, setPhaseData] = useState({ name: "SYNCING", icon: <Loader2 className="animate-spin" />, color: "text-slate-400", bgGlow: "shadow-white/10" });

  const fetchWallpaper = () => {
    const h = new Date().getHours();
    let collection: string[] = [];
    let phase = { name: "", icon: <Activity />, color: "", bgGlow: "" };

    if (h >= 5 && h < 7) {
       collection = WALLPAPER_COLLECTIONS.dawn;
       phase = { name: "DAWN PROTOCOL", icon: <Sunrise className="w-3 h-3 text-orange-400" />, color: "text-orange-400", bgGlow: "shadow-[0_0_100px_rgba(249,115,22,0.3)]" };
    } else if (h >= 7 && h < 11) {
       collection = WALLPAPER_COLLECTIONS.morning;
       phase = { name: "MORNING CYCLE", icon: <Sun className="w-3 h-3 text-cyan-400" />, color: "text-cyan-400", bgGlow: "shadow-[0_0_100px_rgba(34,211,238,0.3)]" };
    } else if (h >= 11 && h < 15) {
       collection = WALLPAPER_COLLECTIONS.noon;
       phase = { name: "ZENITH PHASE", icon: <Sun className="w-3 h-3 text-yellow-400" />, color: "text-yellow-400", bgGlow: "shadow-[0_0_100px_rgba(250,204,21,0.3)]" };
    } else if (h >= 15 && h < 18) {
       collection = WALLPAPER_COLLECTIONS.afternoon;
       phase = { name: "GOLDEN HOUR", icon: <Sun className="w-3 h-3 text-amber-500" />, color: "text-amber-500", bgGlow: "shadow-[0_0_100px_rgba(245,158,11,0.3)]" };
    } else if (h >= 18 && h < 20) {
       collection = WALLPAPER_COLLECTIONS.sunset;
       phase = { name: "SUNSET SEQUENCE", icon: <Sunset className="w-3 h-3 text-pink-500" />, color: "text-pink-500", bgGlow: "shadow-[0_0_100px_rgba(236,72,153,0.3)]" };
    } else {
       collection = WALLPAPER_COLLECTIONS.night;
       phase = { name: "NIGHT OPS", icon: <Moon className="w-3 h-3 text-indigo-400" />, color: "text-indigo-400", bgGlow: "shadow-[0_0_100px_rgba(99,102,241,0.3)]" };
    }

    const randomIndex = Math.floor(Math.random() * collection.length);
    const baseUrl = collection[randomIndex];
    const newUrl = `${baseUrl}?auto=format&fit=crop&w=1200&q=80&t=${Date.now()}`;
    
    if (currentUrl === "") {
        setCurrentUrl(newUrl);
    } else {
        setNextUrl(newUrl);
        setIsCrossFading(true);
        setTimeout(() => {
            setCurrentUrl(newUrl);
            setNextUrl("");
            setIsCrossFading(false);
        }, 1500);
    }
    setPhaseData(phase);
  };

  useEffect(() => {
    fetchWallpaper();
    const interval = setInterval(fetchWallpaper, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  return { currentUrl, nextUrl, isCrossFading, phaseData };
};

// --- ORBITAL DAY TRACKER (THE NEW PROGRESS BAR) ---
const OrbitalDayTracker = ({ progress, time, dayName, slots }: { progress: number, time: Date, dayName: string, slots: ScheduleSlot[] }) => {
  const { currentUrl, nextUrl, isCrossFading, phaseData } = useLiveWallpaper();
  
  const START_HOUR = 6;
  const END_HOUR = 23; 
  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  const currentMinutes = (time.getHours() * 60 + time.getMinutes()) - (START_HOUR * 60);
  const timePercent = Math.max(0, Math.min(100, (currentMinutes / totalMinutes) * 100));

  const totalTasks = slots.length;
  const completedTasks = slots.filter(s => s.isCompleted).length;

  return (
    <div className="relative w-full h-64 sm:h-72 rounded-[2.5rem] bg-slate-900 border border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] overflow-hidden group select-none transition-all hover:scale-[1.005]">
       
       {/* 1. BACKGROUND LAYER */}
       <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[300000ms] ease-linear transform scale-100 group-hover:scale-110"
            style={{ backgroundImage: `url(${currentUrl})` }} 
          />
          <div 
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000`}
            style={{ backgroundImage: `url(${nextUrl})`, opacity: isCrossFading ? 1 : 0 }} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
       </div>

       {/* 2. THE TIME MASK (FOG OF WAR) */}
       <div 
          className="absolute inset-0 z-10 pointer-events-none backdrop-blur-[2px] backdrop-grayscale-[0.5] transition-all duration-1000 ease-linear"
          style={{ 
             clipPath: `polygon(${timePercent}% 0, 100% 0, 100% 100%, ${timePercent}% 100%)`,
             background: 'rgba(0,0,0,0.5)' 
          }}
       >
          <div className="absolute inset-0 bg-grid-white/[0.05]" />
       </div>

       {/* 3. THE SCANNER LINE */}
       <div 
          className="absolute top-0 bottom-0 w-[2px] z-20 bg-gradient-to-b from-transparent via-red-500 to-transparent shadow-[0_0_20px_rgba(239,68,68,1)] transition-all duration-1000 ease-linear"
          style={{ left: `${timePercent}%` }}
       >
          <div className="absolute top-0 bottom-0 -left-[15px] w-[30px] bg-red-500/5 blur-xl" />
          <div className="absolute bottom-1/2 left-0 w-2 h-2 bg-red-500 rounded-full -translate-x-1/2 shadow-[0_0_10px_red]" />
       </div>

       {/* 4. CONTENT HUD */}
       <div className="absolute inset-0 z-30 p-6 sm:p-8 flex flex-col justify-between">
          
          {/* TOP ROW */}
          <div className="flex justify-between items-start">
             <div>
                <h2 className="text-3xl sm:text-5xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tighter uppercase drop-shadow-xl pr-4">
                   {dayName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                   <div className={`w-2 h-2 rounded-full ${phaseData.color.replace('text-', 'bg-')} animate-pulse`} />
                   <span className={`text-xs font-mono font-bold uppercase tracking-[0.3em] ${phaseData.color} drop-shadow-md`}>
                      {phaseData.name}
                   </span>
                </div>
             </div>

             <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 text-right shadow-lg shrink-0 ml-2">
                <div className="text-2xl font-mono font-bold text-white tabular-nums tracking-tighter leading-none">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">Local Time</div>
             </div>
          </div>

          {/* BOTTOM ROW (Stats Grid) */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
             {/* Progress Metric */}
             <div className="col-span-1 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                 <div className="text-[8px] sm:text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">Completion</div>
                 <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-white tracking-tighter">{progress}</span>
                    <span className="text-xs sm:text-sm font-bold text-cyan-400">%</span>
                 </div>
                 <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: `${progress}%` }} />
                 </div>
             </div>

             {/* Task Counter */}
             <div className="col-span-1 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                 <div className="text-[8px] sm:text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">Directives</div>
                 <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-white tracking-tighter">{completedTasks}</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-500">/ {totalTasks}</span>
                 </div>
                 <div className="text-[8px] sm:text-[9px] text-emerald-400 mt-2 font-bold uppercase tracking-wider truncate">
                    {totalTasks - completedTasks} Remaining
                 </div>
             </div>

             {/* Active Status */}
             <div className="col-span-1 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 backdrop-blur-md flex flex-col justify-center items-center text-center hover:bg-cyan-500/20 transition-colors">
                 <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 mb-1 sm:mb-2 animate-pulse" />
                 <div className="text-[8px] sm:text-[9px] font-mono font-bold text-cyan-300 uppercase tracking-widest">
                    {progress === 100 ? 'Complete' : 'Active'}
                 </div>
             </div>
          </div>
       </div>

       {/* DECORATIVE CORNERS */}
       <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/20 rounded-tr-lg opacity-50" />
       <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/20 rounded-bl-lg opacity-50" />
    </div>
  );
};

export const DailyView: React.FC<DailyViewProps> = ({ dayName, slots, username, onToggleSlot, onAddSlot, onRemoveSlot }) => {
  const [modalMode, setModalMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('Logistics');
  const [sHour, setSHour] = useState(9);
  const [sMin, setSMin] = useState(0);
  const [sAmpm, setSAmpm] = useState(0); 
  const [eHour, setEHour] = useState(10);
  const [eMin, setEMin] = useState(0);
  const [eAmpm, setEAmpm] = useState(0); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const activeSlot = slots.find(s => checkIsActive(s.timeRange));

  const [showCelebration, setShowCelebration] = useState(false);
  
  // Progress Calculation
  const completedCount = slots.filter(s => s.isCompleted).length;
  const progress = slots.length > 0 ? Math.round((completedCount / slots.length) * 100) : 0;
  
  const prevProgressRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Celebration Trigger Logic
  useEffect(() => {
    if (progress === 100 && prevProgressRef.current < 100 && slots.length > 0) {
      setShowCelebration(true);
      playOrbitSound('power_up'); 
      const t = setTimeout(() => setShowCelebration(false), 4500); 
      return () => clearTimeout(t);
    }
    prevProgressRef.current = progress;
  }, [progress, slots.length]);

  const durationString = useMemo(() => {
     let startMins = (sHour === 0 ? 12 : sHour) * 60 + sMin;
     if (sAmpm === 1 && sHour !== 12) startMins += 12 * 60;
     if (sAmpm === 0 && sHour === 12) startMins -= 12 * 60;

     let endMins = (eHour === 0 ? 12 : eHour) * 60 + eMin;
     if (eAmpm === 1 && eHour !== 12) endMins += 12 * 60;
     if (eAmpm === 0 && eHour === 12) endMins -= 12 * 60;

     if (endMins < startMins) endMins += 24 * 60; 
     
     const diff = endMins - startMins;
     const h = Math.floor(diff / 60);
     const m = diff % 60;
     return `${h}h ${m}m`;
  }, [sHour, sMin, sAmpm, eHour, eMin, eAmpm]);

  
  const handleSlotAction = (day: string, slotId: string, isCompleted: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) playOrbitSound('success_chord');
    onToggleSlot(day, slotId);
  };

  const determineCategory = (title: string): Category => {
    const t = title.toLowerCase();
    if (t.match(/(gym|workout|run|walk|sleep|breakfast|lunch|dinner|shower|bath|nap)/)) return 'Physical';
    if (t.match(/(code|react|js|ts|python|java|debug|git|develop|build)/)) return 'Coding';
    if (t.match(/(study|read|class|lecture|exam|quiz|learn|math|science)/)) return 'Academic';
    if (t.match(/(design|draw|paint|edit|video|photo|write|music|art)/)) return 'Creative';
    if (t.match(/(relax|chill|game|netflix|movie|tv|rest|break)/)) return 'Rest';
    if (t.match(/(plan|commute|shop|clean|organize|email|meeting)/)) return 'Logistics';
    return 'Logistics';
  };

  const openModal = (slot?: ScheduleSlot) => {
    playOrbitSound('click');
    if (slot) {
      setModalMode('edit');
      setEditingId(slot.id);
      setFormTitle(slot.title);
      setFormDesc(slot.description || '');
      setFormCategory(slot.category);
      const match = slot.timeRange.match(/(\d{1,2}):(\d{2})\s?([AP]M)\s?-\s?(\d{1,2}):(\d{2})\s?([AP]M)/i);
      if (match) {
        setSHour(parseInt(match[1]) === 12 ? 0 : parseInt(match[1])); setSMin(parseInt(match[2])); setSAmpm(match[3].toUpperCase() === 'PM' ? 1 : 0);
        setEHour(parseInt(match[4]) === 12 ? 0 : parseInt(match[4])); setEMin(parseInt(match[5])); setEAmpm(match[6].toUpperCase() === 'PM' ? 1 : 0);
      }
    } else {
      setModalMode('add'); setEditingId(null); setFormTitle(''); setFormDesc(''); setFormCategory('Logistics');
      setSHour(9); setSMin(0); setSAmpm(0); setEHour(10); setEMin(0); setEAmpm(0);
    }
  };

  const handleSave = () => {
    if (!formTitle) return;
    playOrbitSound('click');
    const startStr = `${sHour === 0 ? 12 : sHour}:${sMin.toString().padStart(2, '0')} ${sAmpm === 0 ? 'AM' : 'PM'}`;
    const endStr = `${eHour === 0 ? 12 : eHour}:${eMin.toString().padStart(2, '0')} ${eAmpm === 0 ? 'AM' : 'PM'}`;
    
    onAddSlot({
      id: editingId || `slot-${Date.now()}`,
      title: formTitle,
      timeRange: `${startStr} - ${endStr}`,
      category: formCategory,
      description: formDesc,
      isCompleted: false
    });
    setModalMode('closed');
  };

  return (
    <div className="animate-fade-in-up space-y-6 sm:space-y-10 pb-10">
      <svg className="hidden"><defs><filter id="goo-effect"><feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" /><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" /><feComposite in="SourceGraphic" in2="goo" operator="atop"/></filter></defs></svg>

      {/* --- CELEBRATION OVERLAY --- */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl pointer-events-none"
          >
            {/* Background Rays */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(34,211,238,0.1)_20deg,transparent_40deg)] animate-spin-slow" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] bg-[conic-gradient(from_180deg,transparent_0deg,rgba(168,85,247,0.1)_20deg,transparent_40deg)] animate-spin-slow" style={{ animationDirection: 'reverse' }} />
            </div>

            <div className="relative z-10 flex flex-col items-center">
               {/* Central Glitch/Tech Logo */}
               <motion.div 
                 initial={{ scale: 0.5, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ type: "spring", stiffness: 300, damping: 20 }}
                 className="mb-8 relative"
               >
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-cyan-500/50 flex items-center justify-center relative shadow-[0_0_50px_rgba(34,211,238,0.5)]">
                     <div className="absolute inset-0 rounded-full border-t-4 border-l-4 border-white animate-spin" />
                     <div className="absolute inset-2 rounded-full border-b-4 border-r-4 border-purple-500 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                     <Check className="w-16 h-16 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" strokeWidth={4} />
                  </div>
               </motion.div>

               <motion.h1 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.2 }}
                 className="text-4xl sm:text-6xl font-black italic text-white tracking-tighter uppercase text-center drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]"
               >
                 Protocol<br/>Complete
               </motion.h1>
               
               <motion.div
                 initial={{ width: 0 }}
                 animate={{ width: 200 }}
                 transition={{ delay: 0.4, duration: 0.8 }}
                 className="h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-4"
               />
               
               <motion.p 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.8 }}
                 className="mt-4 text-xs font-mono text-cyan-400 uppercase tracking-[0.5em]"
               >
                 100% Synchronization
               </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- NEW HEADER: ORBITAL DAY TRACKER --- */}
      <OrbitalDayTracker progress={progress} time={currentTime} dayName={dayName} slots={slots} />

      {/* --- CONTROLS --- */}
      <div className="flex justify-between items-end px-2 sm:px-4">
          <div className="flex items-center gap-3">
             <div className="h-px w-8 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
             <h4 className="text-[10px] sm:text-xs font-mono font-bold text-cyan-500 uppercase tracking-[0.4em] sm:tracking-[0.4em] shadow-cyan-500/20 drop-shadow-md">
                 Chronicle Sequence
             </h4>
             <div className="h-px w-8 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             <button onClick={() => setAmbientEnabled(!ambientEnabled)} className={`flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-xl border transition-all duration-500 glass-panel hover:bg-white/10 ${ambientEnabled ? 'border-cyan-500/50 text-cyan-400' : 'border-white/10 text-slate-400'}`}>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest hidden sm:inline">{ambientEnabled ? 'Uplink Active' : 'Audio Offline'}</span>
             </button>
             <button onClick={() => openModal()} className="group relative px-5 py-2 sm:px-8 sm:py-3 glass-panel hover:bg-white/10 text-white rounded-xl overflow-hidden transition-all shadow-lg active:scale-95 border-white/20">
                <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] -translate-x-full group-hover:animate-shimmer" />
                <div className="relative flex items-center gap-2 font-black italic text-xs sm:text-sm uppercase tracking-wide">
                  <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Initialize</span>
                </div>
             </button>
          </div>
      </div>

      {/* --- SLOT CONTAINER --- */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 ${slots.length === 0 ? 'block' : ''}`}>
        {slots.length === 0 ? (
          <div className="py-20 sm:py-32 text-center glass-panel rounded-[2rem] sm:rounded-[3rem] border-dashed border-white/10 col-span-2">
             <Terminal className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-700 mb-6" />
             <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-slate-500">No Data Stream</p>
          </div>
        ) : (
          slots.map((slot) => {
            const isDone = slot.isCompleted;
            const isActive = checkIsActive(slot.timeRange);
            const theme = THEME_CONFIG[slot.category] || THEME_CONFIG.Logistics;
            
            return (
              <div key={slot.id} className={`relative group rounded-3xl transition-all duration-500 ease-out select-none flex flex-col ${isActive && !isDone ? 'scale-[1.02] z-30 shadow-2xl ring-1 ring-cyan-500/50' : 'z-10 hover:scale-[1.01] hover:z-20'} ${isDone ? 'opacity-80 scale-[0.98]' : 'opacity-100'}`}>
                 <div className={`absolute inset-0 rounded-3xl backdrop-blur-3xl border transition-all duration-500 ${isDone ? 'bg-black/40 border-white/5 grayscale' : isActive ? `${theme.glass} ${theme.activeBorder} border shadow-lg` : `${theme.glass} ${theme.border} group-hover:border-opacity-50`} ${isActive ? theme.glow : ''}`} />
                 <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                 <div className="relative z-20 flex flex-col sm:flex-row lg:flex-row items-stretch min-h-[140px] sm:min-h-[160px] h-full">
                    <ChronometerHUD timeRange={slot.timeRange} isActive={isActive} isDone={isDone} theme={theme} />
                    <div className="flex-1 p-5 sm:p-8 flex flex-col justify-center relative overflow-hidden cursor-pointer" onClick={(e) => handleSlotAction(dayName, slot.id, isDone, e)}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-1.5 rounded-md ${theme.text} bg-white/10 shadow-sm border border-white/20`}><div className="w-3 h-3 sm:w-4 sm:h-4">{getCategoryIcon(slot.category)}</div></div>
                            <span className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${theme.subText}`}>{getProtocolLabel(slot.category)}</span>
                            {slot.isCompleted && (<span className="ml-auto px-2 py-0.5 rounded text-[8px] font-black uppercase bg-green-500 text-white tracking-widest shadow-lg shadow-green-500/20">Complete</span>)}
                        </div>
                        <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-black italic uppercase tracking-tight leading-none mb-2 transition-all duration-300 ${isDone ? 'text-slate-400 line-through decoration-slate-500/50' : theme.text}`}>{slot.title}</h3>
                        {slot.description && (<p className={`text-xs sm:text-sm font-mono max-w-lg ${isDone ? 'text-slate-500' : theme.subText}`}>{slot.description}</p>)}
                    </div>
                    
                    <div className="flex flex-row sm:flex-col lg:flex-col items-center justify-between sm:justify-center p-4 sm:p-6 gap-4 border-t sm:border-t-0 sm:border-l lg:border-t-0 lg:border-l border-white/5 bg-black/20 rounded-b-3xl sm:rounded-bl-none sm:rounded-r-3xl lg:rounded-bl-none lg:rounded-r-3xl">
                        <LiquidToggle isCompleted={isDone} onToggle={(e) => handleSlotAction(dayName, slot.id, isDone, e)} theme={theme} />
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); openModal(slot); }} className="p-2 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-white/5 transition-all"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); playOrbitSound('delete'); onRemoveSlot(slot.id); }} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                 </div>
              </div>
            );
          })
        )}
      </div>

      {modalMode !== 'closed' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-fade-in backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-[#0a0a0a]/80 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group max-h-[90vh] overflow-y-auto flex flex-col backdrop-blur-3xl">
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[150%] bg-gradient-to-tr from-cyan-900/20 via-purple-900/20 to-blue-900/20 animate-spin-slower blur-[100px]" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[100%] h-[100%] bg-gradient-to-bl from-emerald-900/10 to-indigo-900/20 animate-pulse-slow blur-[80px]" />
                </div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none z-0" />
                <div className="px-8 pt-8 pb-4 flex items-start justify-between relative z-20">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                           <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 animate-pulse" />
                           <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.3em]">{modalMode === 'add' ? 'System Input' : 'Modify Sequence'}</span>
                        </div>
                        <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter drop-shadow-lg">{modalMode === 'add' ? 'New Protocol' : 'Edit Protocol'}</h3>
                    </div>
                    <button onClick={() => setModalMode('closed')} className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
                
                <div className="p-8 pt-0 space-y-8 relative z-10">
                    <div className="relative bg-black/20 border border-white/5 rounded-[2rem] p-6 sm:p-8 overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Temporal Dilation
                            </span>
                            <div className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                Duration: {durationString}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-widest block">Start Time</span>
                                  <LiquidMorphToggle value={sAmpm} onChange={setSAmpm} />
                                </div>
                                <LiquidSlider value={sHour === 0 ? 12 : sHour} onChange={(v) => setSHour(v === 12 ? 0 : v)} min={1} max={12} unit="HR" label="HOUR" />
                                <LiquidSlider value={sMin} onChange={setSMin} min={0} max={59} unit="MIN" label="MINUTE" />
                            </div>
                            <div className="h-px bg-white/10 w-full" />
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono font-bold text-purple-500 uppercase tracking-widest block">End Time</span>
                                  <LiquidMorphToggle value={eAmpm} onChange={setEAmpm} />
                                </div>
                                <LiquidSlider value={eHour === 0 ? 12 : eHour} onChange={(v) => setEHour(v === 12 ? 0 : v)} min={1} max={12} unit="HR" label="HOUR" />
                                <LiquidSlider value={eMin} onChange={setEMin} min={0} max={59} unit="MIN" label="MINUTE" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Directive Name</label>
                            <input autoFocus value={formTitle} onChange={e => { setFormTitle(e.target.value); const detected = determineCategory(e.target.value); if (detected !== formCategory) { setFormCategory(detected); playOrbitSound('click'); } }} placeholder="ENTER TASK DATA..." className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white font-mono placeholder:text-slate-700 outline-none focus:border-cyan-500 transition-all text-xl shadow-inner focus:shadow-[0_0_30px_rgba(6,182,212,0.1)] backdrop-blur-sm" />
                            <div className="flex justify-end pr-2"><span className={`text-[8px] sm:text-[9px] px-2 py-0.5 rounded border uppercase font-mono tracking-widest transition-colors ${THEME_CONFIG[formCategory].text} ${THEME_CONFIG[formCategory].border} ${THEME_CONFIG[formCategory].glass}`}>Category: {formCategory}</span></div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Parameters (Optional)</label>
                           <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="ADDITIONAL INSTRUCTIONS..." className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-mono text-xs placeholder:text-slate-700 outline-none focus:border-cyan-500 transition-all h-24 resize-none shadow-inner backdrop-blur-sm" />
                        </div>
                    </div>
                    <button onClick={handleSave} className="w-full py-5 bg-white hover:bg-cyan-400 text-slate-950 font-black italic uppercase rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] active:scale-95 flex items-center justify-center gap-2 group/btn relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                      <Terminal className="w-5 h-5" /> {modalMode === 'add' ? 'Initialize Sequence' : 'Update Sequence'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
