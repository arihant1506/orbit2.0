
import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleSlot, Category } from '../types';
import { Check, Edit3, Trash2, Plus, X, Activity, Terminal, Sparkles, Brain, Briefcase, Clock, ArrowRight, Play } from 'lucide-react';
import { playOrbitSound } from '../utils/audio';
import { AromaOrb } from './AromaOrb';
import { LiquidSlider } from './LiquidSlider';

// --- ENHANCED THEME CONFIGURATION ---
const THEME_CONFIG: Record<Category, any> = {
  Physical: { 
    glass: 'bg-gradient-to-br from-orange-950/80 via-[#1a1005]/90 to-black/80', 
    border: 'border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]', 
    accent: 'bg-orange-500', 
    activeBorder: 'border-orange-400 ring-1 ring-orange-500/50',
    text: 'text-orange-100', 
    subText: 'text-orange-300',
    tint: '#f97316',
    gradient: 'from-orange-500/20 via-orange-600/10 to-transparent',
    icon: Activity,
    glow: 'shadow-[0_0_40px_-10px_rgba(249,115,22,0.3)]'
  },
  Academic: { 
    glass: 'bg-gradient-to-br from-cyan-950/80 via-[#05151a]/90 to-black/80',
    border: 'border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]', 
    accent: 'bg-cyan-500', 
    activeBorder: 'border-cyan-400 ring-1 ring-cyan-500/50',
    text: 'text-cyan-100', 
    subText: 'text-cyan-300',
    tint: '#22d3ee',
    gradient: 'from-cyan-500/20 via-cyan-600/10 to-transparent',
    icon: Brain,
    glow: 'shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)]'
  },
  Coding: { 
    glass: 'bg-gradient-to-br from-emerald-950/80 via-[#051a10]/90 to-black/80',
    border: 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]', 
    accent: 'bg-emerald-500', 
    activeBorder: 'border-emerald-400 ring-1 ring-emerald-500/50',
    text: 'text-emerald-100', 
    subText: 'text-emerald-300',
    tint: '#10b981',
    gradient: 'from-emerald-500/20 via-emerald-600/10 to-transparent',
    icon: Terminal,
    glow: 'shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]'
  },
  Creative: { 
    glass: 'bg-gradient-to-br from-fuchsia-950/80 via-[#1a051a]/90 to-black/80',
    border: 'border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)]', 
    accent: 'bg-fuchsia-500', 
    activeBorder: 'border-fuchsia-400 ring-1 ring-fuchsia-500/50',
    text: 'text-fuchsia-100', 
    subText: 'text-fuchsia-300',
    tint: '#d946ef',
    gradient: 'from-fuchsia-500/20 via-fuchsia-600/10 to-transparent',
    icon: Sparkles,
    glow: 'shadow-[0_0_40px_-10px_rgba(217,70,239,0.3)]'
  },
  Rest: { 
    glass: 'bg-gradient-to-br from-indigo-950/80 via-[#0a0a15]/90 to-black/80',
    border: 'border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]', 
    accent: 'bg-indigo-500', 
    activeBorder: 'border-indigo-400 ring-1 ring-indigo-500/50',
    text: 'text-indigo-100', 
    subText: 'text-indigo-300',
    tint: '#6366f1',
    gradient: 'from-indigo-500/20 via-indigo-600/10 to-transparent',
    icon: Sparkles, 
    glow: 'shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]'
  },
  Logistics: { 
    glass: 'bg-gradient-to-br from-slate-900/80 via-[#10151a]/90 to-black/80',
    border: 'border-slate-500/30 shadow-[0_0_15px_rgba(148,163,184,0.1)]', 
    accent: 'bg-slate-500', 
    activeBorder: 'border-slate-400 ring-1 ring-slate-500/50',
    text: 'text-slate-200', 
    subText: 'text-slate-400',
    tint: '#94a3b8',
    gradient: 'from-slate-500/20 via-slate-600/10 to-transparent',
    icon: Briefcase,
    glow: 'shadow-[0_0_40px_-10px_rgba(148,163,184,0.2)]'
  },
};

const CATEGORIES: Category[] = ['Physical', 'Academic', 'Coding', 'Creative', 'Rest', 'Logistics'];

const getProtocolLabel = (category: Category): string => {
  switch (category) {
    case 'Physical': return 'KINETIC';
    case 'Academic': return 'NEURAL';
    case 'Coding': return 'LOGIC';
    case 'Rest': return 'STANDBY';
    case 'Creative': return 'FLOW';
    default: return 'SYSTEM';
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

const checkIsActive = (timeRange: string, currentMinutes: number): boolean => {
    if (timeRange.toLowerCase().includes('all day')) return true;
    const parts = timeRange.split(' - ').map(p => getMinutesFromFormatted(p.trim()));
    if (parts.length < 2) return false;
    const [start, end] = parts;
    if (start > end) return currentMinutes >= start || currentMinutes < end;
    return currentMinutes >= start && currentMinutes < end;
};

// --- SUB-COMPONENTS ---

const LiquidToggle = memo(({ isCompleted, onToggle, theme }: { isCompleted: boolean, onToggle: (e: any) => void, theme: any }) => {
    const activeStyle = { backgroundColor: `${theme.tint}1A`, borderColor: `${theme.tint}80` };
    
    return (
        <div 
            className="relative w-16 h-8 sm:w-20 sm:h-9 rounded-full cursor-pointer select-none touch-none group will-change-transform tap-highlight-transparent"
            onClick={(e) => {
               playOrbitSound(isCompleted ? 'liquid_deactivate' : 'liquid_activate');
               onToggle(e);
            }}
        >
            <div 
                className={`absolute inset-0 rounded-full border transition-all duration-500 ease-out backdrop-blur-sm ${!isCompleted ? 'bg-black/60 border-white/20' : ''}`}
                style={isCompleted ? activeStyle : undefined}
            >
                 {/* Internal Glow */}
                 {isCompleted && <div className="absolute inset-0 rounded-full opacity-40 blur-md" style={{ backgroundColor: theme.tint }} />}
            </div>
            
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 600, damping: 30 }}
                className={`absolute top-1 bottom-1 w-6 sm:w-7 rounded-full z-10 flex items-center justify-center shadow-lg transition-colors duration-300 ${isCompleted ? 'bg-white' : 'bg-slate-500'}`}
                style={{ left: isCompleted ? 'calc(100% - 1.75rem)' : '0.25rem' }}
            >
                {isCompleted ? (
                     <Check className="w-3.5 h-3.5 text-black stroke-[4]" />
                 ) : (
                     <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                 )}
            </motion.div>
        </div>
    );
});

// Professional Card
const MemoizedSlotCard = memo(({ slot, dayName, onAction, onRemove, onEdit, currentMinutes }: { slot: ScheduleSlot, dayName: string, onAction: any, onRemove: any, onEdit: any, currentMinutes: number }) => {
    const isDone = slot.isCompleted;
    const isActive = checkIsActive(slot.timeRange, currentMinutes);
    const theme = THEME_CONFIG[slot.category] || THEME_CONFIG.Logistics;
    const Icon = theme.icon;
    
    // Parse times
    const [startStr, endStr] = slot.timeRange.split('-').map(s => s.trim());
    
    return (
        <div 
            id={slot.id} // Added ID for Auto-Scroll Targeting
            className={`
                relative group rounded-[2rem] transition-all duration-500 ease-out select-none flex flex-col md:flex-row items-stretch 
                w-full will-change-transform transform-gpu overflow-hidden border backdrop-blur-2xl 
                ${isActive ? `${theme.activeBorder} ${theme.glow} scale-[1.01] z-20` : `${theme.border} hover:border-white/30 hover:scale-[1.005] z-10`} 
                ${isDone ? 'opacity-60 grayscale-[0.5]' : 'opacity-100'} 
                ${theme.glass}
            `}
        >
            
            {/* 1. Dynamic Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-30 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none`} />
            
            {/* 2. Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
            
            {/* 3. Left Indicator Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.accent} transition-all duration-500 ${isActive ? 'opacity-100 shadow-[0_0_15px_currentColor]' : 'opacity-50 group-hover:opacity-80'}`} />

            {/* SECTOR 1: TIME (Digital Clock Style) */}
            <div className="w-full md:w-40 flex-shrink-0 flex md:flex-col items-center justify-between md:justify-center p-5 md:p-6 border-b md:border-b-0 md:border-r border-white/10 bg-black/20 relative">
                <div className="text-left md:text-center w-full">
                    {/* Status Label */}
                    <div className={`text-[9px] font-black font-mono uppercase tracking-[0.2em] mb-1.5 flex items-center md:justify-center gap-1.5 ${isActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`}>
                        {isActive ? <Play className="w-3 h-3 fill-current" /> : <Clock className="w-3 h-3" />}
                        {isActive ? 'ACTIVE' : 'SCHEDULED'}
                    </div>

                    {/* Time Digits - Scaled down slightly for mobile safety */}
                    <div className={`text-3xl md:text-4xl font-black font-mono tracking-tighter leading-none ${isActive ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-slate-200'}`}>
                        {startStr.replace(/[AP]M/i, '').trim()}
                        <span className="text-xs md:text-sm font-bold text-slate-500 ml-1 align-top">{startStr.slice(-2)}</span>
                    </div>
                    
                    {endStr && (
                        <div className="mt-1 text-xs md:text-sm font-mono font-bold text-slate-500">
                           <span className="opacity-50">TO</span> {endStr.replace(/[AP]M/i, '').trim()}
                        </div>
                    )}
                </div>
            </div>

            {/* SECTOR 2: INFO (Main Content) */}
            <div className="flex-1 p-5 md:p-8 flex flex-col justify-center relative z-10 min-w-0">
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-3">
                   <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-1.5 ${theme.subText} bg-white/5`}>
                      <Icon className="w-3 h-3" />
                      {getProtocolLabel(slot.category)}
                   </span>
                   {isActive && (
                       <span className="flex h-2 w-2 relative">
                         <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.accent}`}></span>
                         <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.accent}`}></span>
                       </span>
                   )}
                </div>

                <h3 className={`text-xl md:text-3xl font-black italic uppercase tracking-tight leading-[0.95] mb-2 break-words transition-colors duration-300 drop-shadow-md pr-1 ${isDone ? 'line-through decoration-white/20 text-slate-500' : 'text-white'}`}>
                    {slot.title}
                </h3>
                
                {slot.description && (
                    <p className={`text-[10px] md:text-xs font-mono uppercase tracking-wide line-clamp-2 ${isDone ? 'text-slate-600' : theme.subText} opacity-90`}>
                        {slot.description}
                    </p>
                )}
            </div>

            {/* SECTOR 3: COMMAND (Actions) */}
            <div className="w-full md:w-auto flex-shrink-0 flex flex-row md:flex-col items-center justify-between p-4 md:px-6 md:py-0 border-t md:border-t-0 md:border-l border-white/10 bg-black/20 relative z-20 gap-4">
                
                {/* Toggle Switch */}
                <div className="my-auto">
                    <LiquidToggle isCompleted={isDone} onToggle={(e) => onAction(dayName, slot.id, isDone, e)} theme={theme} />
                </div>

                {/* Edit/Delete Tools - Always visible on mobile for ease */}
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(slot); }} 
                        className="p-3 md:p-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                        title="Edit Slot"
                    >
                        <Edit3 className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); playOrbitSound('delete'); onRemove(slot.id); }} 
                        className="p-3 md:p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
                        title="Delete Slot"
                    >
                        <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    if (prev.slot !== next.slot) return false;
    if (prev.dayName !== next.dayName) return false;
    const prevActive = checkIsActive(prev.slot.timeRange, prev.currentMinutes);
    const nextActive = checkIsActive(next.slot.timeRange, next.currentMinutes);
    return prevActive === nextActive;
});

// --- ISOLATED TRACKER (Own Timer) ---
const OrbitalDayTracker = memo(({ progress, dayName, slots }: { progress: number, dayName: string, slots: ScheduleSlot[] }) => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const totalTasks = slots.length;
  const completedTasks = slots.filter(s => s.isCompleted).length;
  const START_HOUR = 6;
  const END_HOUR = 23; 
  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  const currentMinutes = (time.getHours() * 60 + time.getMinutes()) - (START_HOUR * 60);
  const timePercent = Math.max(0, Math.min(100, (currentMinutes / totalMinutes) * 100));

  return (
    <div className="relative w-full h-auto sm:h-64 rounded-[2.5rem] bg-[#050505] border border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] overflow-hidden group select-none transition-all hover:scale-[1.005] will-change-transform transform-gpu">
       {/* Cinematic Background */}
       <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity" />
       <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
       
       <div className="absolute inset-0 z-30 p-6 sm:p-10 flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-[0.3em]">System Active</span>
                </div>
                <h2 className="text-4xl sm:text-6xl font-black italic text-white tracking-tighter uppercase drop-shadow-2xl pr-2">
                   {dayName}
                </h2>
             </div>
             
             <div className="relative -mt-2 -mr-2">
                 <AromaOrb size="w-20 h-20 sm:w-24 sm:h-24" intensity="high" colorMode="default" showRings={true} />
             </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mt-4 sm:mt-0">
             {/* Stat 1 */}
             <div className="col-span-1 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                 <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">Efficiency</div>
                 <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{progress}</span>
                    <span className="text-sm font-bold text-cyan-400">%</span>
                 </div>
                 <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-cyan-400 transition-all duration-1000 shadow-[0_0_10px_cyan]" style={{ width: `${progress}%` }} />
                 </div>
             </div>
             
             {/* Stat 2 */}
             <div className="col-span-1 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                 <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">Tasks Done</div>
                 <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{completedTasks}</span>
                    <span className="text-sm font-bold text-slate-500">/ {totalTasks}</span>
                 </div>
             </div>
          </div>
       </div>
       
       {/* Time Indicator Line */}
       <div 
          className="absolute top-0 bottom-0 w-[2px] z-20 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)] transition-all duration-[60000ms] ease-linear opacity-80"
          style={{ left: `${timePercent}%` }}
       >
          <div className="absolute bottom-0 -left-1.5 w-4 h-4 bg-red-500 rounded-full blur-sm" />
       </div>
    </div>
  );
});

interface DailyViewProps {
  dayName: string;
  slots: ScheduleSlot[];
  username: string;
  onToggleSlot: (day: string, slotId: string) => void;
  onAddSlot: (slot: ScheduleSlot) => void;
  onRemoveSlot: (slotId: string) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({ dayName, slots, username, onToggleSlot, onAddSlot, onRemoveSlot }) => {
  const [modalMode, setModalMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('Logistics');
  const [sHour, setSHour] = useState(9);
  const [sMin, setSMin] = useState(0);
  const [sAmpm, setSAmpm] = useState(0); 
  const [eHour, setEHour] = useState(10);
  const [eMin, setEMin] = useState(0);
  const [eAmpm, setEAmpm] = useState(0); 
  
  const [timeTab, setTimeTab] = useState<'start' | 'end'>('start');
  const [currentMinutes, setCurrentMinutes] = useState(new Date().getHours() * 60 + new Date().getMinutes());
  
  const formRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
        setCurrentMinutes(new Date().getHours() * 60 + new Date().getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- AUTO-SCROLL TO ACTIVE SLOT LOGIC ---
  useEffect(() => {
    hasScrolledRef.current = false;
  }, [dayName]);

  useEffect(() => {
    if (hasScrolledRef.current || slots.length === 0) return;

    let activeSlot = slots.find(s => checkIsActive(s.timeRange, currentMinutes));
    
    if (!activeSlot) {
        activeSlot = slots.find(s => {
            const [startStr] = s.timeRange.split('-');
            const startMin = getMinutesFromFormatted(startStr.trim());
            return startMin > currentMinutes;
        });
    }

    const targetId = activeSlot?.id;

    if (targetId) {
        const timer = setTimeout(() => {
            const el = document.getElementById(targetId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                hasScrolledRef.current = true;
            }
        }, 1500);
        return () => clearTimeout(timer);
    }
  }, [slots, currentMinutes]);

  useEffect(() => {
    if (modalMode !== 'closed' && formRef.current) {
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
  }, [modalMode]);

  const completedCount = useMemo(() => slots.filter(s => s.isCompleted).length, [slots]);
  const progress = slots.length > 0 ? Math.round((completedCount / slots.length) * 100) : 0;
  
  const handleSlotAction = (day: string, slotId: string, isCompleted: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) playOrbitSound('success_chord');
    onToggleSlot(day, slotId);
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
    setTimeTab('start');
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
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-6 sm:space-y-10 pb-10"
    >
      {/* --- ISOLATED TRACKER --- */}
      <OrbitalDayTracker progress={progress} dayName={dayName} slots={slots} />

      {/* --- COMMAND BAR --- */}
      <div className="flex justify-between items-center px-1 relative z-20">
          <div className="flex items-center gap-3 opacity-80">
             <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
             <h4 className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-[0.3em]">
                 Schedule Sequence
             </h4>
          </div>
          
          <button 
             onClick={() => openModal()} 
             className="group relative flex items-center gap-3 bg-white hover:bg-cyan-400 border border-white/10 px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
             <div className="flex flex-col items-end mr-1">
                <span className="text-[10px] font-black text-black uppercase tracking-wider group-hover:text-black">New Task</span>
             </div>
             <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
             </div>
          </button>
      </div>

      {/* --- INLINE COMMAND CARD (Accordion Style) --- */}
      <AnimatePresence>
        {modalMode !== 'closed' && (
             <motion.div
                key="command-card"
                ref={formRef}
                initial={{ height: 0, opacity: 0, y: -20, scale: 0.98 }}
                animate={{ height: "auto", opacity: 1, y: 0, scale: 1 }}
                exit={{ height: 0, opacity: 0, y: -20, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="overflow-hidden relative z-10"
             >
                 <div className={`w-full bg-[#0B1120] border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col mt-4 mb-6 ${THEME_CONFIG[formCategory].glow}`}>
                     <div className="p-6 sm:p-8 flex flex-col gap-6 relative z-10 bg-gradient-to-b from-white/5 to-transparent">
                         <div className="flex justify-between items-start">
                             <div className="w-full">
                                <div className="flex items-center gap-2 mb-1">
                                    <Terminal className="w-4 h-4 text-slate-400" />
                                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.3em]">
                                        {editingId ? 'Modify Protocol' : 'New Directive'}
                                    </span>
                                </div>
                                <input 
                                    className="w-full bg-transparent border-none p-0 text-3xl sm:text-5xl font-black italic text-white placeholder:text-white/20 focus:outline-none focus:ring-0 uppercase tracking-tight leading-tight"
                                    placeholder="ENTER TITLE..."
                                    value={formTitle}
                                    onChange={e => setFormTitle(e.target.value)}
                                />
                             </div>
                             <button onClick={() => setModalMode('closed')} className="p-2 -mr-2 -mt-2 rounded-full hover:bg-white/10 transition-colors">
                                <X className="w-6 h-6 text-slate-500 hover:text-white" />
                             </button>
                         </div>
                     </div>

                     <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-8">
                         <div>
                            <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">Protocol Category</div>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mask-linear-fade">
                                {CATEGORIES.map(cat => {
                                    const theme = THEME_CONFIG[cat];
                                    const Icon = theme.icon;
                                    const isSelected = formCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => { setFormCategory(cat); playOrbitSound('click'); }}
                                            className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl border transition-all duration-300 ${isSelected ? `bg-gradient-to-br ${theme.gradient} ${theme.border} ${theme.text} scale-105 shadow-[0_0_20px_rgba(0,0,0,0.5)]` : 'bg-black/40 border-white/5 text-slate-500 hover:bg-white/5'}`}
                                        >
                                            <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'animate-bounce' : ''}`} />
                                            <span className="text-[9px] font-bold uppercase tracking-wider">{cat}</span>
                                        </button>
                                    );
                                })}
                            </div>
                         </div>

                         <div className="bg-black/30 rounded-[2rem] border border-white/5 p-2">
                             <div className="flex p-1 bg-white/5 rounded-2xl mb-6">
                                <button onClick={() => { setTimeTab('start'); playOrbitSound('click'); }} className={`flex-1 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${timeTab === 'start' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Start Time</button>
                                <button onClick={() => { setTimeTab('end'); playOrbitSound('click'); }} className={`flex-1 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${timeTab === 'end' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>End Time</button>
                             </div>

                             <div className="px-4 pb-4">
                                {timeTab === 'start' ? (
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key="start">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Meridiem</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => setSAmpm(0)} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${sAmpm === 0 ? 'bg-cyan-500 text-black shadow-[0_0_15px_cyan]' : 'bg-white/5 text-slate-400 border border-white/5'}`}>AM</button>
                                                <button onClick={() => setSAmpm(1)} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${sAmpm === 1 ? 'bg-cyan-500 text-black shadow-[0_0_15px_cyan]' : 'bg-white/5 text-slate-400 border border-white/5'}`}>PM</button>
                                            </div>
                                        </div>
                                        <LiquidSlider value={sHour === 0 ? 12 : sHour} onChange={(v) => setSHour(v === 12 ? 0 : v)} min={1} max={12} unit="HR" label="HOUR" />
                                        <LiquidSlider value={sMin} onChange={setSMin} min={0} max={59} unit="MIN" label="MINUTE" />
                                    </motion.div>
                                ) : (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key="end">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <span className="text-[10px] font-mono text-purple-500 uppercase tracking-widest">Meridiem</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => setEAmpm(0)} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${eAmpm === 0 ? 'bg-purple-500 text-black shadow-[0_0_15px_purple]' : 'bg-white/5 text-slate-400 border border-white/5'}`}>AM</button>
                                                <button onClick={() => setEAmpm(1)} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${eAmpm === 1 ? 'bg-purple-500 text-black shadow-[0_0_15px_purple]' : 'bg-white/5 text-slate-400 border border-white/5'}`}>PM</button>
                                            </div>
                                        </div>
                                        <LiquidSlider value={eHour === 0 ? 12 : eHour} onChange={(v) => setEHour(v === 12 ? 0 : v)} min={1} max={12} unit="HR" label="HOUR" />
                                        <LiquidSlider value={eMin} onChange={setEMin} min={0} max={59} unit="MIN" label="MINUTE" />
                                    </motion.div>
                                )}
                             </div>
                         </div>

                         <button 
                            onClick={handleSave} 
                            className={`w-full py-5 rounded-2xl font-black italic uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 group ${THEME_CONFIG[formCategory].accent} text-white`}
                         >
                             <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/40 transition-colors">
                                 {editingId ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                             </div>
                             {editingId ? 'Update Protocol' : 'Initiate Task'}
                         </button>
                     </div>
                     
                     <div className={`absolute top-0 right-0 w-96 h-96 ${THEME_CONFIG[formCategory].accent} blur-[150px] opacity-20 pointer-events-none`} />
                 </div>
             </motion.div>
        )}
      </AnimatePresence>

      <div className={`grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 ${slots.length === 0 ? 'block' : ''} ${modalMode !== 'closed' ? 'opacity-40 pointer-events-none filter blur-sm transition-all duration-500' : 'transition-all duration-500'}`}>
        {slots.length === 0 ? (
          <div className="py-24 text-center glass-panel rounded-[2.5rem] border-dashed border-white/10 col-span-2 flex flex-col items-center justify-center">
             <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                 <Terminal className="w-8 h-8 text-slate-600" />
             </div>
             <p className="font-mono text-sm font-bold uppercase tracking-[0.3em] text-slate-500">No Data Stream</p>
             <button onClick={() => openModal()} className="mt-4 text-cyan-500 text-xs font-bold uppercase hover:underline">Initialize First Task</button>
          </div>
        ) : (
          slots.map((slot) => (
            <MemoizedSlotCard 
                key={slot.id} 
                slot={slot} 
                dayName={dayName} 
                onAction={handleSlotAction} 
                onRemove={onRemoveSlot}
                onEdit={openModal}
                currentMinutes={currentMinutes}
            />
          ))
        )}
      </div>
    </motion.div>
  );
};
