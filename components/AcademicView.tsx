
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClassSession, ClassType, UniversitySchedule } from '../types';
import { User, MapPin, Users, Zap, Coffee, GraduationCap, ChevronRight, Plus, X, Edit3, Trash2, ShieldCheck, Terminal, Calendar as CalendarIcon, Check, ArrowRight } from 'lucide-react';
import { LiquidSlider } from './LiquidSlider';
import { LiquidTabs } from './LiquidTabs';
import { playOrbitSound } from '../utils/audio';

interface AcademicViewProps {
    schedule: UniversitySchedule;
    onAddClass: (day: string, classData: ClassSession) => void;
    onEditClass: (day: string, classData: ClassSession) => void;
    onDeleteClass: (day: string, classId: string) => void;
}

const TYPE_CONFIG: Record<ClassType, { color: string, border: string, bg: string, badge: string, accent: string }> = {
  Lecture: { color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-950/20', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', accent: 'bg-cyan-500' },
  Lab: { color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-950/20', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', accent: 'bg-purple-500' },
  Tutorial: { color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-950/20', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', accent: 'bg-amber-500' }
};

const getMinutes = (timeStr: string) => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);
  if (!match) return 0;
  let [_, h, m, p] = match;
  let hours = parseInt(h);
  if (p.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (p.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + parseInt(m);
};

export const AcademicView: React.FC<AcademicViewProps> = ({ schedule, onAddClass, onEditClass, onDeleteClass }) => {
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()] === 'Sunday' ? 'Monday' : days[new Date().getDay()];
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // INLINE FORM STATE
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<ClassType>('Lecture');
  const [professor, setProfessor] = useState('');
  const [venue, setVenue] = useState('');
  const [batch, setBatch] = useState('');
  const [sHour, setSHour] = useState(9);
  const [sMin, setSMin] = useState(0);
  const [sAmpm, setSAmpm] = useState<'AM'|'PM'>('AM');
  const [eHour, setEHour] = useState(10);
  const [eMin, setEMin] = useState(0);
  const [eAmpm, setEAmpm] = useState<'AM'|'PM'>('AM');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to form on open
  useEffect(() => {
      if (isFormOpen && formRef.current) {
          setTimeout(() => {
              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
      }
  }, [isFormOpen]);

  const openForm = (cls?: ClassSession) => {
      playOrbitSound('click');
      if (cls) {
          setEditingId(cls.id);
          setSubject(cls.subject);
          setType(cls.type);
          setProfessor(cls.professor);
          setVenue(cls.venue);
          setBatch(cls.batch);
          const parseTime = (str: string) => {
              const m = str.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);
              if (m) return { h: parseInt(m[1]) === 12 ? 0 : parseInt(m[1]), m: parseInt(m[2]), p: m[3].toUpperCase() as 'AM'|'PM' };
              return { h: 9, m: 0, p: 'AM' as 'AM'|'PM' };
          }
          const start = parseTime(cls.startTime); const end = parseTime(cls.endTime);
          setSHour(start.h); setSMin(start.m); setSAmpm(start.p);
          setEHour(end.h); setEMin(end.m); setEAmpm(end.p);
      } else {
          setEditingId(null); setSubject(''); setType('Lecture'); setProfessor(''); setVenue(''); setBatch('');
          setSHour(9); setSMin(0); setSAmpm('AM'); setEHour(10); setEMin(0); setEAmpm('AM');
      }
      setIsFormOpen(true);
  };

  const handleSave = () => {
      if (!subject) return;
      playOrbitSound('success_chord');
      const startStr = `${sHour === 0 ? 12 : sHour}:${sMin.toString().padStart(2, '0')} ${sAmpm}`;
      const endStr = `${eHour === 0 ? 12 : eHour}:${eMin.toString().padStart(2, '0')} ${eAmpm}`;
      const payload: ClassSession = { id: editingId || `class-${Date.now()}`, subject, type, professor, venue, batch, startTime: startStr, endTime: endStr };
      if (editingId) { onEditClass(selectedDay, payload); } else { onAddClass(selectedDay, payload); }
      setIsFormOpen(false);
  };

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const classes = schedule[selectedDay] || [];

  const getClassStatus = (cls: ClassSession, day: string) => {
    if (day !== todayName) return 'upcoming';
    const start = getMinutes(cls.startTime);
    const end = getMinutes(cls.endTime);
    if (currentMinutes >= start && currentMinutes < end) return 'live';
    if (currentMinutes < start) return 'upcoming';
    return 'past';
  };

  // Convert days to LiquidTabs format
  const dayTabs = useMemo(() => {
      const days = Object.keys(schedule);
      // Ensure specific order if needed, or default
      const ordered = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return ordered.filter(d => days.includes(d)).map(d => ({ id: d, label: d.slice(0, 3) }));
  }, [schedule]);

  return (
    <div className="animate-fade-in-up space-y-6 sm:space-y-8 pb-20">
      
      {/* HEADER CARD */}
      <div className="relative p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] liquid-glass overflow-hidden shadow-2xl group">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-10">
           <GraduationCap className="w-24 h-24 sm:w-32 sm:h-32 text-cyan-500" />
        </div>
        <div className="relative z-10">
           <div className="flex items-center gap-2 text-cyan-500 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.4em] mb-2">
              <Zap className="w-3 h-3" /> Academic Uplink Established
           </div>
           <h2 className="text-3xl sm:text-6xl font-black italic tracking-tighter text-white uppercase font-sans">
             University <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Manifest</span>
           </h2>
        </div>
      </div>

      {/* CONTROLS ROW */}
      <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
             <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> {classes.length} Sessions detected
             </div>
             
             <button 
                onClick={() => openForm()} 
                className="group relative flex items-center gap-2 bg-white hover:bg-cyan-400 border border-white/10 px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg"
             >
                <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Plus className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="text-[10px] font-black text-black uppercase tracking-wider">Add Class</span>
             </button>
          </div>

          {/* LIQUID TABS FOR DAYS */}
          <LiquidTabs 
              tabs={dayTabs} 
              activeId={selectedDay} 
              onChange={setSelectedDay} 
              layoutIdPrefix="academic-days" 
              variant="scrollable"
          />
      </div>

      {/* --- INLINE OPERATION DECK (FORM) --- */}
      <AnimatePresence>
        {isFormOpen && (
             <motion.div
                key="class-form"
                ref={formRef}
                initial={{ height: 0, opacity: 0, y: -20 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="overflow-hidden relative z-10"
             >
                 <div className="w-full bg-[#0B1120] border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col mb-6">
                     <div className={`absolute top-0 left-0 w-1 h-full ${TYPE_CONFIG[type].accent}`} />
                     
                     {/* Header */}
                     <div className="p-6 border-b border-white/5 flex justify-between items-center">
                         <div>
                             <div className="flex items-center gap-2 mb-1">
                                <ShieldCheck className="w-4 h-4 text-slate-400" />
                                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.3em]">
                                    {editingId ? 'Modify Session' : 'New Entry'}
                                </span>
                             </div>
                             <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Class Details</h3>
                         </div>
                         <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <X className="w-5 h-5 text-slate-500 hover:text-white" />
                         </button>
                     </div>

                     {/* Body */}
                     <div className="p-6 space-y-6">
                         
                         {/* Subject Input */}
                         <div className="space-y-2">
                             <label className="text-[9px] font-mono font-bold text-slate-500 uppercase ml-1">Subject Name</label>
                             <input 
                                value={subject} onChange={e => setSubject(e.target.value)} 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-mono text-sm outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-700" 
                                placeholder="E.G. QUANTUM MECHANICS" 
                                autoFocus
                             />
                         </div>

                         {/* Type & Professor Grid */}
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[9px] font-mono font-bold text-slate-500 uppercase ml-1">Type</label>
                                <div className="flex gap-2">
                                    {(['Lecture', 'Lab', 'Tutorial'] as ClassType[]).map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all ${type === t ? `${TYPE_CONFIG[t].bg} ${TYPE_CONFIG[t].border} ${TYPE_CONFIG[t].color}` : 'bg-black/20 border-white/5 text-slate-600 hover:bg-white/5'}`}
                                        >
                                            {t.slice(0,3)}
                                        </button>
                                    ))}
                                </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-mono font-bold text-slate-500 uppercase ml-1">Professor</label>
                                <input value={professor} onChange={e => setProfessor(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-cyan-500" placeholder="DR. NAME" />
                             </div>
                         </div>

                         {/* Venue & Batch Grid */}
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[9px] font-mono font-bold text-slate-500 uppercase ml-1">Venue</label>
                                <input value={venue} onChange={e => setVenue(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-cyan-500" placeholder="ROOM 101" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-mono font-bold text-slate-500 uppercase ml-1">Batch</label>
                                <input value={batch} onChange={e => setBatch(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-cyan-500" placeholder="A1, B2..." />
                             </div>
                         </div>

                         {/* Time Controls */}
                         <div className="bg-black/30 rounded-2xl border border-white/5 p-4">
                             <div className="grid grid-cols-2 gap-8">
                                 {/* Start */}
                                 <div className="space-y-4">
                                     <div className="flex justify-between items-center"><span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Start</span><div className="flex gap-1"><button onClick={() => setSAmpm('AM')} className={`px-2 py-0.5 rounded text-[8px] font-bold ${sAmpm === 'AM' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-500'}`}>AM</button><button onClick={() => setSAmpm('PM')} className={`px-2 py-0.5 rounded text-[8px] font-bold ${sAmpm === 'PM' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-500'}`}>PM</button></div></div>
                                     <LiquidSlider value={sHour === 0 ? 12 : sHour} onChange={(v) => setSHour(v === 12 ? 0 : v)} min={1} max={12} unit="H" />
                                     <LiquidSlider value={sMin} onChange={setSMin} min={0} max={59} unit="M" />
                                 </div>
                                 {/* End */}
                                 <div className="space-y-4">
                                     <div className="flex justify-between items-center"><span className="text-[10px] font-mono text-purple-500 uppercase tracking-widest">End</span><div className="flex gap-1"><button onClick={() => setEAmpm('AM')} className={`px-2 py-0.5 rounded text-[8px] font-bold ${eAmpm === 'AM' ? 'bg-purple-500 text-black' : 'bg-white/5 text-slate-500'}`}>AM</button><button onClick={() => setEAmpm('PM')} className={`px-2 py-0.5 rounded text-[8px] font-bold ${eAmpm === 'PM' ? 'bg-purple-500 text-black' : 'bg-white/5 text-slate-500'}`}>PM</button></div></div>
                                     <LiquidSlider value={eHour === 0 ? 12 : eHour} onChange={(v) => setEHour(v === 12 ? 0 : v)} min={1} max={12} unit="H" />
                                     <LiquidSlider value={eMin} onChange={setEMin} min={0} max={59} unit="M" />
                                 </div>
                             </div>
                         </div>

                         <button onClick={handleSave} className="w-full py-4 mt-2 bg-white hover:bg-cyan-400 text-slate-950 font-black italic uppercase rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-95 flex items-center justify-center gap-2 text-sm">
                            {editingId ? 'Update Session' : 'Commit Entry'} <ArrowRight className="w-4 h-4" />
                         </button>
                     </div>
                 </div>
             </motion.div>
        )}
      </AnimatePresence>

      {/* CLASS GRID */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${classes.length === 0 ? 'block' : ''}`}>
        {classes.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-3xl bg-slate-900/50 col-span-2">
             <Coffee className="w-12 h-12 text-slate-600 mb-4" />
             <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">No Academic Obligations Detected</p>
             <button onClick={() => openForm()} className="mt-4 text-cyan-500 text-xs font-bold uppercase hover:underline">Create Entry</button>
          </div>
        ) : (
          classes.map((cls, idx) => {
            const theme = TYPE_CONFIG[cls.type];
            const status = getClassStatus(cls, selectedDay);
            const nextClass = classes[idx + 1];
            let breakDuration = 0;
            if (nextClass) {
              const endCurr = getMinutes(cls.endTime);
              const startNext = getMinutes(nextClass.startTime);
              breakDuration = startNext - endCurr;
            }

            return (
              <React.Fragment key={cls.id}>
                {/* Updated background to be explicitly dark */}
                <div className={`relative group rounded-3xl border transition-all duration-500 overflow-hidden flex flex-col h-full ${status === 'live' ? 'bg-slate-900/80 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.15)] scale-[1.02]' : 'bg-[#0B1120]/90 border-white/5 hover:border-white/20'}`}>
                  {status === 'live' && <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 animate-pulse" />}
                  {status === 'past' && <div className="absolute inset-0 bg-slate-950/50 z-10 pointer-events-none grayscale" />}
                  
                  <div className="p-5 sm:p-8 flex flex-col md:flex-row gap-5 md:gap-8 relative z-0 h-full">
                     <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start md:min-w-[100px] border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-8">
                        <div className="flex items-baseline gap-2 md:block">
                            <div className={`text-xl sm:text-2xl font-black font-mono tracking-tighter ${status === 'live' ? 'text-cyan-400' : 'text-white'}`}>{cls.startTime}</div>
                            <div className="text-[10px] sm:text-xs font-mono text-slate-400 mt-0 md:mt-1 flex items-center gap-1"><ChevronRight className="w-3 h-3" /> {cls.endTime}</div>
                        </div>
                        {status === 'live' && <div className="px-2 py-0.5 bg-cyan-500 text-slate-950 text-[8px] sm:text-[9px] font-bold font-mono uppercase tracking-widest w-fit rounded animate-pulse">LIVE NOW</div>}
                     </div>

                     <div className="flex-1 space-y-4 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-4">
                           <h3 className="text-lg sm:text-2xl font-bold text-white uppercase leading-tight tracking-tight line-clamp-2">{cls.subject}</h3>
                           <div className="flex flex-col items-end gap-2 shrink-0">
                               <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest border ${theme.badge}`}>{cls.type}</span>
                               <div className="flex gap-1 z-20 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={(e) => { e.stopPropagation(); openForm(cls); }} className="p-1.5 rounded bg-white/5 hover:text-cyan-500 transition-colors"><Edit3 className="w-3 h-3" /></button>
                                   <button onClick={(e) => { e.stopPropagation(); playOrbitSound('delete'); onDeleteClass(selectedDay, cls.id); }} className="p-1.5 rounded bg-white/5 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                               </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
                           <div className="flex items-center gap-2 sm:gap-3">
                              <div className={`p-1.5 sm:p-2 rounded-lg ${theme.bg} ${theme.color}`}><User className="w-3 h-3 sm:w-4 sm:h-4" /></div>
                              <div className="min-w-0"><p className="text-[8px] sm:text-[9px] text-slate-500 font-mono uppercase tracking-wider truncate">Professor</p><p className="text-[10px] sm:text-xs font-bold text-slate-300 truncate">{cls.professor || 'N/A'}</p></div>
                           </div>
                           <div className="flex items-center gap-2 sm:gap-3">
                              <div className={`p-1.5 sm:p-2 rounded-lg ${theme.bg} ${theme.color}`}><MapPin className="w-3 h-3 sm:w-4 sm:h-4" /></div>
                              <div className="min-w-0"><p className="text-[8px] sm:text-[9px] text-slate-500 font-mono uppercase tracking-wider truncate">Venue</p><p className="text-[10px] sm:text-xs font-bold text-slate-300 font-mono truncate">{cls.venue || 'N/A'}</p></div>
                           </div>
                           <div className="flex items-center gap-2 sm:gap-3 col-span-2 sm:col-span-1">
                              <div className={`p-1.5 sm:p-2 rounded-lg ${theme.bg} ${theme.color}`}><Users className="w-3 h-3 sm:w-4 sm:h-4" /></div>
                              <div className="min-w-0"><p className="text-[8px] sm:text-[9px] text-slate-500 font-mono uppercase tracking-wider truncate">Batch</p><p className="text-[10px] sm:text-xs font-bold text-slate-300 truncate">{cls.batch || 'N/A'}</p></div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                {breakDuration > 10 && (
                   <div className="flex items-center gap-4 px-4 opacity-60 col-span-1 lg:col-span-2">
                      <div className="h-full w-px bg-dashed border-l border-slate-700 mx-auto h-8"></div>
                      <div className="flex-1 h-px bg-slate-800"></div>
                      <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                         <Coffee className="w-3 h-3" /> Break: {Math.floor(breakDuration / 60) > 0 ? `${Math.floor(breakDuration / 60)} hr ` : ''}{breakDuration % 60} min
                      </div>
                      <div className="flex-1 h-px bg-slate-800"></div>
                   </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};
