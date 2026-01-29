import React, { useState, useEffect } from 'react';
import { ClassSession, ClassType, UniversitySchedule } from '../types';
import { User, MapPin, Users, Zap, Coffee, GraduationCap, ChevronRight, Plus, X, Edit3, Trash2, ShieldCheck, Terminal, Calendar as CalendarIcon } from 'lucide-react';
import { LiquidSlider } from './LiquidSlider';

interface AcademicViewProps {
    schedule: UniversitySchedule;
    onAddClass: (day: string, classData: ClassSession) => void;
    onEditClass: (day: string, classData: ClassSession) => void;
    onDeleteClass: (day: string, classId: string) => void;
}

const TYPE_CONFIG: Record<ClassType, { color: string, border: string, bg: string, badge: string }> = {
  Lecture: { color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-950/20', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  Lab: { color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-950/20', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  Tutorial: { color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-950/20', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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

  const openModal = (cls?: ClassSession) => {
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
      setModalOpen(true);
  };

  const handleSave = () => {
      if (!subject) return;
      const startStr = `${sHour === 0 ? 12 : sHour}:${sMin.toString().padStart(2, '0')} ${sAmpm}`;
      const endStr = `${eHour === 0 ? 12 : eHour}:${eMin.toString().padStart(2, '0')} ${eAmpm}`;
      const payload: ClassSession = { id: editingId || `class-${Date.now()}`, subject, type, professor, venue, batch, startTime: startStr, endTime: endStr };
      if (editingId) { onEditClass(selectedDay, payload); } else { onAddClass(selectedDay, payload); }
      setModalOpen(false);
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

  return (
    <div className="animate-fade-in-up space-y-6 sm:space-y-8 pb-20">
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

      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
        {Object.keys(schedule).filter(d => d !== 'Sunday').map((day) => (
          <button key={day} onClick={() => setSelectedDay(day)} className={`flex-shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-mono text-[9px] sm:text-[10px] sm:text-xs uppercase tracking-[0.2em] border transition-all duration-300 ${selectedDay === day ? 'bg-cyan-950/50 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-cyan-500/50'}`}>
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center px-1">
         <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> {classes.length} Sessions detected
         </div>
         <button onClick={() => openModal()} className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-xl bg-white text-slate-950 font-bold uppercase text-[9px] sm:text-[10px] tracking-wider hover:bg-cyan-400 transition-all shadow-lg active:scale-95">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Add Class
         </button>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${classes.length === 0 ? 'block' : ''}`}>
        {classes.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-3xl bg-slate-900/50 col-span-2">
             <Coffee className="w-12 h-12 text-slate-600 mb-4" />
             <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">No Academic Obligations Detected</p>
             <button onClick={() => openModal()} className="mt-4 text-cyan-500 text-xs font-bold uppercase hover:underline">Create Entry</button>
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
                               <div className="flex gap-1 z-20 pointer-events-auto">
                                   <button onClick={(e) => { e.stopPropagation(); openModal(cls); }} className="p-1.5 rounded bg-white/5 hover:text-cyan-500 transition-colors"><Edit3 className="w-3 h-3" /></button>
                                   <button onClick={(e) => { e.stopPropagation(); onDeleteClass(selectedDay, cls.id); }} className="p-1.5 rounded bg-white/5 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
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

      {modalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in">
             <div className="w-full max-w-lg liquid-glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" /><span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.3em]">{editingId ? 'Modify Session' : 'New Entry'}</span></div>
                        <h3 className="text-2xl sm:text-3xl font-black italic text-white uppercase tracking-tighter">Class Details</h3>
                    </div>
                    <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" /></button>
                </div>
                <div className="space-y-4">
                    <div className="bg-black/50 border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
                        <div className="space-y-2">
                           <div className="flex justify-between items-center px-1"><span className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-widest">Start Time</span><div className="flex gap-2"><button onClick={() => setSAmpm('AM')} className={`text-[9px] font-bold px-2 py-0.5 rounded ${sAmpm === 'AM' ? 'bg-cyan-500 text-black' : 'text-slate-500 bg-white/5'}`}>AM</button><button onClick={() => setSAmpm('PM')} className={`text-[9px] font-bold px-2 py-0.5 rounded ${sAmpm === 'PM' ? 'bg-cyan-500 text-black' : 'text-slate-500 bg-white/5'}`}>PM</button></div></div>
                           <LiquidSlider value={sHour === 0 ? 12 : sHour} onChange={(v) => setSHour(v === 12 ? 0 : v)} min={1} max={12} unit="HR" label="HOUR" />
                           <LiquidSlider value={sMin} onChange={setSMin} min={0} max={59} unit="MIN" label="MINUTE" />
                        </div>
                        <div className="h-px bg-white/10 w-full" />
                        <div className="space-y-2">
                           <div className="flex justify-between items-center px-1"><span className="text-[10px] font-mono font-bold text-purple-500 uppercase tracking-widest">End Time</span><div className="flex gap-2"><button onClick={() => setEAmpm('AM')} className={`text-[9px] font-bold px-2 py-0.5 rounded ${eAmpm === 'AM' ? 'bg-purple-500 text-black' : 'text-slate-500 bg-white/5'}`}>AM</button><button onClick={() => setEAmpm('PM')} className={`text-[9px] font-bold px-2 py-0.5 rounded ${eAmpm === 'PM' ? 'bg-purple-500 text-black' : 'text-slate-500 bg-white/5'}`}>PM</button></div></div>
                           <LiquidSlider value={eHour === 0 ? 12 : eHour} onChange={(v) => setEHour(v === 12 ? 0 : v)} min={1} max={12} unit="HR" label="HOUR" />
                           <LiquidSlider value={eMin} onChange={setEMin} min={0} max={59} unit="MIN" label="MINUTE" />
                        </div>
                    </div>
                    <div className="space-y-1"><label className="text-[8px] sm:text-[9px] font-bold font-mono text-slate-500 uppercase ml-2">Subject Name</label><input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono text-xs sm:text-sm outline-none focus:border-purple-500" placeholder="e.g. Data Structures" /></div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1"><label className="text-[8px] sm:text-[9px] font-bold font-mono text-slate-500 uppercase ml-2">Type</label><select value={type} onChange={e => setType(e.target.value as ClassType)} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-purple-500"><option value="Lecture">Lecture</option><option value="Lab">Lab</option><option value="Tutorial">Tutorial</option></select></div>
                         <div className="space-y-1"><label className="text-[8px] sm:text-[9px] font-bold font-mono text-slate-500 uppercase ml-2">Professor</label><input value={professor} onChange={e => setProfessor(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-purple-500" placeholder="Dr. Name" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1"><label className="text-[8px] sm:text-[9px] font-bold font-mono text-slate-500 uppercase ml-2">Venue</label><input value={venue} onChange={e => setVenue(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-purple-500" placeholder="Room 101" /></div>
                         <div className="space-y-1"><label className="text-[8px] sm:text-[9px] font-bold font-mono text-slate-500 uppercase ml-2">Batch</label><input value={batch} onChange={e => setBatch(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-purple-500" placeholder="A1, B2..." /></div>
                    </div>
                    <button onClick={handleSave} className="w-full py-3 sm:py-4 mt-2 bg-white hover:bg-purple-400 text-slate-950 font-black italic uppercase rounded-2xl transition-all shadow-lg hover:shadow-purple-500/25 active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm">
                        <Terminal className="w-4 h-4" /> {editingId ? 'Update Session' : 'Commit Entry'}
                    </button>
                </div>
             </div>
         </div>
      )}
    </div>
  );
};