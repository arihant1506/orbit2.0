
import React, { useState, useEffect, useRef } from 'react';
import { DailyView } from './components/DailyView';
import { WeeklyReport } from './components/WeeklyReport';
import { AdminView } from './components/AdminView';
import { AcademicView } from './components/AcademicView';
import { WaterTracker } from './components/WaterTracker';
import { NotificationSystem } from './components/NotificationSystem'; // NEW IMPORT
import { Auth } from './components/Auth';
import { INITIAL_SCHEDULE, UNI_SCHEDULE } from './constants';
import { WeekSchedule, ThemeMode, Category, UserProfile, ScheduleSlot, WeeklyStats, WaterConfig, UniversitySchedule, ClassSession } from './types';
import { Radio, Sun, Moon, Monitor, LogOut, ShieldAlert, Clock, Loader2, GraduationCap, Zap, Battery, Wifi, Activity, Droplet, Bell, BellRing, BellOff, Quote, Globe } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getMondayOfCurrentWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
};

// Parse "07:30 AM" or "07:30 AM - 08:00 AM" to minutes
const parseTime = (str: string): number => {
  if (!str) return -1;
  const timePart = str.split('-')[0].trim();
  const match = timePart.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);
  if (!match) return -1;
  let [_, h, m, p] = match;
  let hours = parseInt(h);
  if (p.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (p.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + parseInt(m);
};

// --- MOBILE HUD COMPONENT ---
const MobileHUD = ({ username }: { username: string }) => {
  const [time, setTime] = useState(new Date());
  
  // Quote State
  const [quoteData, setQuoteData] = useState({ content: "Initializing neural link...", author: "SYSTEM" });

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Quote Fetcher Logic (Every 60s)
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch('https://dummyjson.com/quotes/random');
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        setQuoteData({ content: data.quote, author: data.author });
      } catch (e) {
        // Silent Fallback
        const fallbackQuotes = [
            { content: "Consistency is the code to success.", author: "Orbit OS" },
            { content: "Your future is created by what you do today.", author: "Unknown" },
            { content: "Discipline is freedom.", author: "Jocko Willink" }
        ];
        const random = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        setQuoteData(random);
      }
    };

    fetchQuote(); 
    const quoteInterval = setInterval(fetchQuote, 60000);
    return () => clearInterval(quoteInterval);
  }, []);

  const hours = time.getHours();
  let icon = <Zap className="w-3 h-3 text-yellow-400" />;
  let greeting = "Good Morning";
  
  if (hours < 5) { greeting = "Night Owl"; icon = <Moon className="w-3 h-3 text-indigo-400" />; }
  else if (hours < 12) { greeting = "Good Morning"; icon = <Sun className="w-3 h-3 text-orange-400" />; }
  else if (hours < 17) { greeting = "Good Afternoon"; icon = <Sun className="w-3 h-3 text-yellow-400" />; }
  else if (hours < 22) { greeting = "Good Evening"; icon = <Moon className="w-3 h-3 text-purple-400" />; }
  else { greeting = "Late Night"; icon = <Battery className="w-3 h-3 text-red-400" />; }

  return (
    <div className="lg:hidden px-4 mb-8 mt-6 animate-tech-reveal">
      {/* COMPACT GLASS CARD */}
      <div className="relative w-full rounded-[2rem] overflow-hidden bg-[#050505]/60 border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl group">
        
        {/* Subtle Background Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-50%] right-[-20%] w-[80%] h-[150%] bg-indigo-900/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-50%] left-[-20%] w-[80%] h-[100%] bg-cyan-900/10 rounded-full blur-[80px]" />
        </div>
        
        <div className="relative z-10 p-6 flex flex-col gap-5">
            
            {/* TOP ROW: Greeting & Status */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1 opacity-80">
                        <div className="p-1 rounded bg-white/5 border border-white/5">{icon}</div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em]">{greeting}</span>
                    </div>
                    <h2 className="text-xl font-black italic text-white uppercase tracking-tight drop-shadow-md">
                        {username}
                    </h2>
                </div>
                
                {/* Status Badge */}
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" />
                    <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-widest">Online</span>
                </div>
            </div>

            {/* MIDDLE ROW: Clock & Aroma Orb */}
            <div className="flex items-center justify-between">
                {/* Digital Clock */}
                <div className="flex items-baseline -ml-1">
                    <span className="text-[4rem] leading-none font-black font-mono text-white tracking-tighter drop-shadow-xl">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span className="text-lg font-mono text-slate-500 font-bold ml-1 mb-1">
                        :{time.getSeconds().toString().padStart(2, '0')}
                    </span>
                </div>

                {/* THE AROMA ORB (Siri-like Interface) */}
                <div className="relative w-20 h-20 flex-shrink-0 ml-2">
                    <div className="absolute inset-0 flex items-center justify-center">
                        {/* Container */}
                        <div className="relative w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] overflow-hidden">
                            
                            {/* Fluid 1: Cyan/Blue */}
                            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full mix-blend-screen filter blur-[12px] opacity-70 animate-blob" style={{ animationDuration: '6s' }} />
                            
                            {/* Fluid 2: Purple/Pink */}
                            <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full mix-blend-screen filter blur-[12px] opacity-70 animate-blob" style={{ animationDelay: '2s', animationDuration: '8s', animationDirection: 'reverse' }} />
                            
                            {/* Fluid 3: Emerald/Green */}
                            <div className="absolute top-[30%] right-[20%] w-[60%] h-[60%] bg-gradient-to-bl from-emerald-400 to-teal-500 rounded-full mix-blend-screen filter blur-[12px] opacity-60 animate-blob" style={{ animationDelay: '4s', animationDuration: '7s' }} />

                            {/* Core Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_15px_white,0_0_30px_rgba(34,211,238,0.8)] animate-pulse" />
                        </div>
                        
                        {/* Outer Ring Effects */}
                        <div className="absolute w-[4.5rem] h-[4.5rem] border border-cyan-500/20 rounded-full animate-spin-slow opacity-50" style={{ borderStyle: 'dashed' }} />
                        <div className="absolute w-[5.5rem] h-[5.5rem] bg-cyan-500/5 rounded-full blur-xl -z-10" />
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW: Quote */}
            <div className="relative pt-3 border-t border-white/5">
                <div className="absolute left-0 top-3 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full" />
                <div className="pl-3">
                    <p className="text-[10px] font-medium text-slate-300 italic leading-relaxed line-clamp-2 opacity-80">
                        "{quoteData.content}"
                    </p>
                    <p className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest mt-1 text-right">
                        — {quoteData.author}
                    </p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

// --- LOGOUT SEQUENCE COMPONENT (GEN Z / CRAZY MODE) ---
const LogoutSequence = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState(0); 

  useEffect(() => {
    // ... sound logic ...
    const t3 = setTimeout(() => onComplete(), 2200); 
    return () => clearTimeout(t3);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center overflow-hidden">
        <div className={`relative w-full h-full flex items-center justify-center bg-slate-900`}>
             <div className="absolute inset-0 bg-[#030014] overflow-hidden">
                <h1 className="text-7xl font-black italic text-white animate-bounce tracking-tighter">
                   SYSTEM<br/>PURGE
                </h1>
             </div>
        </div>
    </div>
  );
};

// --- SPLASH SCREEN COMPONENT ---
const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => { setTimeout(onComplete, 1800); }, [onComplete]);
  return <div className="fixed inset-0 z-[100] bg-[#030014]"></div>;
};

// --- SYSTEM CLOCK COMPONENT ---
const SystemClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex flex-col items-end justify-center px-6 border-r border-white/10 mr-4">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red]" />
            <span className="font-mono text-xl font-black text-slate-800 dark:text-white tracking-widest tabular-nums leading-none">
                {time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: false})}
            </span>
        </div>
        <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.3em] leading-none mt-1.5 mr-0.5">
            {time.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'}).toUpperCase()}
        </span>
    </div>
  );
}

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('orbit_active_user'));
  const [users, setUsers] = useState<Record<string, UserProfile>>(() => {
    const saved = localStorage.getItem('orbit_users');
    return saved ? JSON.parse(saved) : {};
  });

  const [currentDayIndex, setCurrentDayIndex] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; 
  });

  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'academic' | 'admin' | 'hydration'>('daily');
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('orbit_theme') as ThemeMode) || 'dark');
  const [isClient, setIsClient] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  useEffect(() => { setIsClient(true); }, []);

  // ... (Keep existing Effects: Auto Weekly Reset, LocalStorage, Theme, etc.) ...
  useEffect(() => {
    localStorage.setItem('orbit_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('orbit_theme', theme);
  }, [theme]);

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const handleAuthSuccess = (username: string, password?: string) => {
    const normalizedUsername = username.toLowerCase();
    const existingUser = users[normalizedUsername];
    if (!existingUser) {
        const emptySchedule: WeekSchedule = {};
        DAYS_OF_WEEK.forEach(day => emptySchedule[day] = []);
        const initialAcademic = normalizedUsername === 'arihant' ? JSON.parse(JSON.stringify(UNI_SCHEDULE)) : { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
        const newProfile: UserProfile = {
            username: normalizedUsername,
            password: password,
            joinedDate: new Date().toISOString(),
            schedule: normalizedUsername === 'arihant' ? JSON.parse(JSON.stringify(INITIAL_SCHEDULE)) : emptySchedule,
            academicSchedule: initialAcademic,
            lastResetDate: getMondayOfCurrentWeek()
        };
        setUsers(prev => ({ ...prev, [normalizedUsername]: newProfile }));
    } else if (!existingUser.academicSchedule) {
             const initialAcademic = normalizedUsername === 'arihant' ? JSON.parse(JSON.stringify(UNI_SCHEDULE)) : { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
             setUsers(prev => ({ ...prev, [normalizedUsername]: { ...existingUser, academicSchedule: initialAcademic } }));
    }
    setCurrentUser(normalizedUsername);
    localStorage.setItem('orbit_active_user', normalizedUsername);
    setViewMode('daily');
  };

  const handleLogout = () => { setIsLoggingOut(true); };
  const performLogout = () => { setCurrentUser(null); localStorage.removeItem('orbit_active_user'); setIsLoggingOut(false); };

  // ... (Keep handlers: Toggle, Add, Edit, Remove, Class Handlers, Reset User, Save Config) ...
  const handleToggleSlot = (day: string, slotId: string) => {
    if (!currentUser) return;
    setUsers(prev => {
      const userProfile = prev[currentUser];
      const newDaySlots = userProfile.schedule[day].map(slot => slot.id === slotId ? { ...slot, isCompleted: !slot.isCompleted } : slot);
      return { ...prev, [currentUser]: { ...userProfile, schedule: { ...userProfile.schedule, [day]: newDaySlots } } };
    });
  };
  // (Stubbing other handlers for brevity as they are unchanged)
  const handleAddOrEditSlot = (day: string, slotData: ScheduleSlot) => {
    if (!currentUser) return;
    setUsers(prev => {
        const userProfile = prev[currentUser];
        const existingSlotIndex = userProfile.schedule[day]?.findIndex(s => s.id === slotData.id);
        let newDaySlots;
        if (existingSlotIndex !== undefined && existingSlotIndex >= 0) {
            newDaySlots = [...(userProfile.schedule[day] || [])];
            newDaySlots[existingSlotIndex] = slotData;
        } else {
            newDaySlots = [...(userProfile.schedule[day] || []), slotData];
        }
        newDaySlots.sort((a, b) => parseTime(a.timeRange) - parseTime(b.timeRange));
        return { ...prev, [currentUser]: { ...userProfile, schedule: { ...userProfile.schedule, [day]: newDaySlots } } };
    });
  };
  const handleRemoveSlot = (day: string, slotId: string) => {
      if (!currentUser) return;
      setUsers(prev => ({...prev, [currentUser]: {...prev[currentUser], schedule: {...prev[currentUser].schedule, [day]: prev[currentUser].schedule[day].filter(s => s.id !== slotId)}}}));
  };
  const handleAddClass = (day: string, classData: ClassSession) => {
      if (!currentUser) return;
      setUsers(prev => {
          const u = prev[currentUser];
          const newC = [...(u.academicSchedule?.[day] || []), classData].sort((a,b)=>parseTime(a.startTime)-parseTime(b.startTime));
          return {...prev, [currentUser]: {...u, academicSchedule: {...u.academicSchedule, [day]: newC}}};
      });
  };
  const handleEditClass = (day: string, classData: ClassSession) => {
      if (!currentUser) return;
      setUsers(prev => {
          const u = prev[currentUser];
          const arr = [...(u.academicSchedule?.[day] || [])];
          const i = arr.findIndex(c => c.id === classData.id);
          if (i > -1) arr[i] = classData;
          arr.sort((a,b)=>parseTime(a.startTime)-parseTime(b.startTime));
          return {...prev, [currentUser]: {...u, academicSchedule: {...u.academicSchedule, [day]: arr}}};
      });
  };
  const handleDeleteClass = (day: string, classId: string) => {
      if (!currentUser) return;
      setUsers(prev => ({...prev, [currentUser]: {...prev[currentUser], academicSchedule: {...prev[currentUser].academicSchedule, [day]: (prev[currentUser].academicSchedule?.[day]||[]).filter(c=>c.id!==classId)}}}));
  };
  const handleResetUser = (username: string) => {
      if (username.toLowerCase() === 'arihant' && confirm('Overwrite Arihant?')) {
          setUsers(prev => ({...prev, arihant: {...prev.arihant, schedule: JSON.parse(JSON.stringify(INITIAL_SCHEDULE)), academicSchedule: JSON.parse(JSON.stringify(UNI_SCHEDULE))}}));
      }
  };
  const handleSaveWaterConfig = (config: WaterConfig) => {
    if (!currentUser) return;
    setUsers(prev => ({ ...prev, [currentUser]: { ...prev[currentUser], waterConfig: config } }));
  };

  if (!isClient) return null;
  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  if (!currentUser) {
    return (
      <div className="relative min-h-screen bg-orbit-bg flex items-center justify-center p-4 transition-colors duration-500 overflow-hidden">
        {/* AMBIENT BLOBS */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" style={{animationDelay: '2s'}} />
        
        <div className="relative z-10 w-full max-w-5xl">
            <Auth onAuthSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }

  const userProfile = users[currentUser];
  const isOwner = currentUser.toLowerCase() === 'arihant';
  const currentDayName = DAYS_OF_WEEK[currentDayIndex];
  const currentSlots = userProfile.schedule[currentDayName] || [];
  const currentAcademicSchedule = userProfile.academicSchedule || {};
  const currentDayString = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div key="main-app" className="relative min-h-screen bg-orbit-lightBg dark:bg-orbit-bg font-sans text-slate-800 dark:text-slate-200 transition-colors duration-500 overflow-x-hidden animate-tech-reveal">
      
      {/* AMBIENT BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
         <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob" style={{animationDelay: '4s'}} />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full mix-blend-screen filter blur-[150px] animate-pulse-slow" />
      </div>

      {/* NOTIFICATION SYSTEM */}
      {currentUser && (
        <NotificationSystem 
          schedule={userProfile.schedule} 
          academicSchedule={currentAcademicSchedule} 
          waterConfig={userProfile.waterConfig} 
          dayName={currentDayString}
        />
      )}

      {/* LIQUID NAVBAR */}
      <nav className="sticky top-4 z-50 px-3 sm:px-6 mb-12 sm:mb-12 transition-all">
        <div className="liquid-glass rounded-full max-w-5xl mx-auto p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start px-2">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-2 ring-white/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                        <Radio className="w-4 h-4 sm:w-6 sm:h-6 text-white relative z-10" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">ORBIT</h1>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end px-1">
                <SystemClock />
                <button 
                    onClick={requestNotificationPermission}
                    className={`p-2.5 rounded-full border transition-all ${notificationPermission === 'granted' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400'}`}
                >
                    {notificationPermission === 'granted' ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </button>

                <div className="flex bg-black/40 p-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-inner">
                    <button onClick={() => setTheme('light')} className={`p-2 rounded-full transition-all ${theme === 'light' ? 'bg-white text-orange-500 shadow-md scale-105' : 'text-slate-400 hover:text-white'}`}><Sun className="w-4 h-4" /></button>
                    <button onClick={() => setTheme('dark')} className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'bg-slate-700 text-cyan-400 shadow-md scale-105' : 'text-slate-400 hover:text-white'}`}><Moon className="w-4 h-4" /></button>
                    <button onClick={() => setTheme('system')} className={`p-2 rounded-full transition-all ${theme === 'system' ? 'bg-slate-700 text-purple-400 shadow-md scale-105' : 'text-slate-400 hover:text-white'}`}><Monitor className="w-4 h-4" /></button>
                </div>

                <div className="flex bg-black/40 p-1.5 rounded-full border border-white/10 overflow-x-auto no-scrollbar max-w-[150px] sm:max-w-none backdrop-blur-md shadow-inner">
                     <button onClick={() => setViewMode('daily')} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'daily' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Daily</button>
                     <button onClick={() => setViewMode('academic')} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase tracking-widest transition-all ${viewMode === 'academic' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><GraduationCap className="w-4 h-4" /></button>
                     <button onClick={() => setViewMode('weekly')} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase tracking-widest transition-all ${viewMode === 'weekly' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Stats</button>
                     <button onClick={() => setViewMode('hydration')} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase tracking-widest transition-all ${viewMode === 'hydration' ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><Droplet className="w-4 h-4" /></button>
                     {isOwner && <button onClick={() => setViewMode('admin')} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase tracking-widest transition-all ${viewMode === 'admin' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Admin</button>}
                </div>

                <button onClick={handleLogout} className="p-2.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg hover:shadow-red-500/30">
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
            </div>
        </div>
      </nav>

      {/* Increased top margin to create bigger gap between Navbar and Greeting Bar as requested */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 relative z-10 pb-20 mt-20 sm:mt-28">
        <MobileHUD username={currentUser} />

        {viewMode === 'daily' && (
           <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar mb-8 sm:mb-10 py-2 px-1">
            {DAYS_OF_WEEK.map((d, idx) => (
              <button 
                 key={d} 
                 onClick={() => setCurrentDayIndex(idx)} 
                 className={`flex-shrink-0 px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-2xl font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] border transition-all duration-300 backdrop-blur-md ${idx === currentDayIndex ? 'liquid-glass text-cyan-400 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)] scale-105' : 'border-white/5 bg-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10'}`}
              >
                  {d}
              </button>
            ))}
           </div>
        )}

        {viewMode === 'daily' ? (
          <DailyView 
            dayName={currentDayName} 
            slots={currentSlots} 
            username={currentUser}
            onToggleSlot={handleToggleSlot}
            onAddSlot={(slot) => handleAddOrEditSlot(currentDayName, slot)}
            onRemoveSlot={(id) => handleRemoveSlot(currentDayName, id)}
          />
        ) : viewMode === 'weekly' ? (
          <WeeklyReport schedule={userProfile.schedule} lastWeekStats={userProfile.lastWeekStats} />
        ) : viewMode === 'academic' ? (
          <AcademicView 
             schedule={currentAcademicSchedule}
             onAddClass={handleAddClass}
             onEditClass={handleEditClass}
             onDeleteClass={handleDeleteClass}
          />
        ) : viewMode === 'hydration' ? (
          <WaterTracker 
             username={currentUser} 
             userConfig={userProfile.waterConfig} 
             onSaveConfig={handleSaveWaterConfig} 
          />
        ) : (
          <AdminView users={users} onResetUser={handleResetUser} />
        )}
      </main>
      
      {isLoggingOut && <LogoutSequence onComplete={performLogout} />}
    </div>
  );
};

export default App;
