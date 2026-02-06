
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleSlot, NoteItem, WaterConfig } from '../types';
import { Maximize2, Check, Clock, ChevronRight, Activity, Calendar, Droplet, FileText, X, Zap, Moon } from 'lucide-react';
import { playOrbitSound } from '../utils/audio';

interface CompactWidgetProps {
  currentSlot?: ScheduleSlot;
  nextSlot?: ScheduleSlot;
  waterConfig?: WaterConfig;
  activeNote?: NoteItem;
  onExit: () => void;
  onToggleSlot: (id: string) => void;
  onToggleWater: (id: string) => void;
}

export const CompactWidget: React.FC<CompactWidgetProps> = ({ 
  currentSlot, 
  nextSlot, 
  waterConfig, 
  activeNote, 
  onExit, 
  onToggleSlot,
  onToggleWater
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // --- DERIVE NEXT WATER SLOT ---
  const getNextWaterSlot = () => {
      if (!waterConfig) return null;
      
      const glassSize = 0.5;
      const totalSlots = Math.ceil(waterConfig.dailyGoal / glassSize);
      // Safe array access for legacy data
      const currentProgress = waterConfig.progress || [];
      
      // Re-generate basic slots logic to find next ID (matching WaterTracker logic)
      const startMin = 9 * 60; 
      const endMin = 21 * 60;
      const interval = (endMin - startMin) / Math.max(1, totalSlots - 1);

      // Morning Flush
      if (!currentProgress.includes('water-wake')) {
          return { id: 'water-wake', time: '07:30 AM' };
      }

      for (let i = 0; i < totalSlots - 1; i++) {
          const id = `water-${i}`;
          if (!currentProgress.includes(id)) {
              const minutes = Math.floor(startMin + (i * interval));
              const h = Math.floor(minutes / 60);
              const m = minutes % 60;
              const ampm = h >= 12 ? 'PM' : 'AM';
              const dispH = h > 12 ? h - 12 : (h === 0 || h === 24 ? 12 : h);
              return { id, time: `${dispH}:${m.toString().padStart(2, '0')} ${ampm}` };
          }
      }
      return null;
  };

  const nextWater = getNextWaterSlot();

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] text-white overflow-hidden flex flex-col font-sans">
       {/* Ambient Light Effects */}
       <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />
       <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

       {/* --- HEADER: CLOCK & CONTROLS --- */}
       <div className="relative z-10 flex justify-between items-start p-6 pt-8">
          <div>
             <motion.h1 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="text-6xl sm:text-7xl font-black italic tracking-tighter leading-none tabular-nums text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 pr-4"
             >
                {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
             </motion.h1>
             <div className="flex items-center gap-3 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.3em]">
                    {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
             </div>
          </div>
          
          <button 
            onClick={onExit}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          >
             <X className="w-6 h-6" />
          </button>
       </div>

       {/* --- MAIN CONTENT --- */}
       <div className="flex-1 relative flex flex-col px-6 pb-6 gap-6 overflow-y-auto custom-scrollbar z-10">
          
          {/* 1. UPCOMING DARK (Next Task) */}
          <motion.div 
             initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
             className="w-full bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group shadow-2xl"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-slate-800/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Moon className="w-3 h-3 text-indigo-400" /> Upcoming Dark
                </span>
                {nextSlot && <span className="text-[10px] font-mono text-slate-400">{nextSlot.timeRange.split('-')[0]}</span>}
             </div>
             
             {nextSlot ? (
                <div>
                   <h3 className="text-2xl font-black italic uppercase text-slate-200 tracking-tight leading-none mb-1 group-hover:text-white transition-colors">
                      {nextSlot.title}
                   </h3>
                   <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{nextSlot.category}</p>
                </div>
             ) : (
                <p className="text-xs text-slate-600 font-mono italic">No upcoming directives found.</p>
             )}
          </motion.div>

          {/* 2. CURRENT ACTIVE (Main Focus) */}
          {currentSlot ? (
             <motion.div 
               key={currentSlot.id}
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
               className="flex-1 min-h-[200px] flex flex-col justify-center items-center text-center p-6 border-y border-white/5 bg-white/[0.02]"
             >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold uppercase tracking-widest mb-6">
                   <Activity className="w-3 h-3 animate-pulse" /> Current Protocol
                </div>
                
                <h2 className={`text-4xl sm:text-5xl font-black uppercase italic leading-none tracking-tight mb-4 pr-2 ${currentSlot.isCompleted ? 'text-slate-600 line-through decoration-slate-700' : 'text-white'}`}>
                   {currentSlot.title}
                </h2>
                
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-8">
                   {currentSlot.timeRange}
                </p>

                <button 
                   onClick={() => { playOrbitSound(currentSlot.isCompleted ? 'liquid_deactivate' : 'success_chord'); onToggleSlot(currentSlot.id); }}
                   className={`px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all active:scale-95 ${currentSlot.isCompleted ? 'bg-slate-900 border border-slate-800 text-slate-500' : 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-cyan-400'}`}
                >
                   {currentSlot.isCompleted ? 'Complete' : 'Mark Done'} <Check className="w-4 h-4 stroke-[3]" />
                </button>
             </motion.div>
          ) : (
             <div className="flex-1 flex flex-col justify-center items-center opacity-40">
                <Zap className="w-12 h-12 text-slate-600 mb-4" />
                <h2 className="text-xl font-black uppercase tracking-widest text-slate-500">System Idle</h2>
             </div>
          )}

          {/* 3. BOTTOM ROW: WATER & ARCHIVE */}
          <div className="grid grid-cols-2 gap-4">
             
             {/* Next Water */}
             <div className="p-5 rounded-3xl bg-[#0f0f11] border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Droplet className="w-12 h-12 text-blue-500" />
                </div>
                <div className="relative z-10">
                   <span className="text-[8px] font-mono text-blue-400 uppercase tracking-widest block mb-1">Hydration</span>
                   {nextWater ? (
                      <>
                         <div className="text-2xl font-black italic text-white">{nextWater.time}</div>
                         <button 
                            onClick={() => { playOrbitSound('water_splash'); onToggleWater(nextWater.id); }}
                            className="mt-3 w-full py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-[9px] font-bold uppercase tracking-widest transition-all border border-blue-600/30 flex items-center justify-center gap-1"
                         >
                            Drink <Check className="w-3 h-3" />
                         </button>
                      </>
                   ) : (
                      <div className="text-emerald-500 font-bold text-xs mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> Goal Met</div>
                   )}
                </div>
             </div>

             {/* Current Archive */}
             <div className="p-5 rounded-3xl bg-[#0f0f11] border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <FileText className="w-12 h-12 text-purple-500" />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                   <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest block">Current Archive</span>
                   {activeNote ? (
                      <div className="mt-1">
                         <div className="text-sm font-bold text-white leading-tight line-clamp-2 mb-1">
                            {activeNote.title}
                         </div>
                         <div className="text-[8px] text-slate-500 font-mono truncate">
                            {new Date(activeNote.createdAt).toLocaleDateString()}
                         </div>
                      </div>
                   ) : (
                      <div className="text-xs italic text-slate-600 mt-2">No active shards</div>
                   )}
                </div>
             </div>

          </div>
       </div>
    </div>
  );
};
