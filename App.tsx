import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { DailyView } from './components/DailyView';
import { WeeklyReport } from './components/WeeklyReport';
import { AdminView } from './components/AdminView';
import { AcademicView } from './components/AcademicView';
import { WaterTracker } from './components/WaterTracker';
import { NotificationSystem } from './components/NotificationSystem'; 
import { Auth } from './components/Auth';
import { ProfileView } from './components/ProfileView'; // Import Profile View
import { INITIAL_SCHEDULE, UNI_SCHEDULE } from './constants';
import { WeekSchedule, ThemeMode, Category, UserProfile, ScheduleSlot, WeeklyStats, WaterConfig, UniversitySchedule, ClassSession } from './types';
import { Radio, Sun, Moon, Monitor, LogOut, ShieldAlert, Clock, Loader2, GraduationCap, Zap, Battery, Wifi, Activity, Droplet, Bell, BellRing, BellOff, Quote, Globe, Command, UserCircle } from 'lucide-react';
import { LiquidTabs } from './components/LiquidTabs';
import { getUserFromCloud, syncUserToCloud, loginUser, registerUser, getGlobalUsers, deleteGlobalUser } from './utils/db';
import { playOrbitSound } from './utils/audio';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getMondayOfCurrentWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
};

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

// --- CREATIVE COMPONENTS ---

const ScrambleText = ({ text, className, speed = 35 }: { text: string; className?: string; speed?: number }) => {
  const [displayed, setDisplayed] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\-[]#";
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(prev => 
        text.split("").map((char, index) => {
          if (index < i) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join("")
      );
      if (i >= text.length) clearInterval(timer);
      i += 1/2; // Resolve speed
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span className={className}>{displayed}</span>;
};

// --- WELCOME SEQUENCE COMPONENT ---
const WelcomeSequence = ({ onComplete }: { onComplete: () => void }) => {
  const [textIndex, setTextIndex] = useState(0);
  const greetings = [
    "SYSTEM_INIT", 
    "LINKING...", 
    "HI",
    "HELLO",
    "BONJOUR", 
    "HOLA", 
    "GUTEN TAG",
    "NAMASTE",
    "WELCOME PILOT"
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex(prev => {
        if (prev < greetings.length - 1) return prev + 1;
        return prev;
      });
    }, 450); 

    const timer = setTimeout(() => {
      onComplete();
    }, 4200); 

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[9999] bg-[#030014] flex items-center justify-center overflow-hidden"
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center mb-12">
           <motion.div 
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="absolute w-24 h-24 bg-cyan-500 rounded-full blur-[50px] opacity-40 animate-pulse"
           />
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" } }}
             className="absolute w-32 h-32 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 border-l-transparent"
           />
           <motion.div 
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
             className="relative z-10 p-4 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"
           >
              <Command className="w-10 h-10 text-white" />
           </motion.div>
        </div>
        <div className="h-10 flex items-center justify-center overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={textIndex}
              initial={{ y: 20, opacity: 0, filter: 'blur(5px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -20, opacity: 0, filter: 'blur(5px)' }}
              className="text-2xl sm:text-3xl font-black italic tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400 uppercase font-mono whitespace-nowrap"
            >
              {greetings[textIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// --- MOBILE HUD COMPONENT ---
const MobileHUD = ({ username, avatar }: { username: string, avatar?: string }) => {
  const [time, setTime] = useState(new Date());
  const [quoteData, setQuoteData] = useState({ content: "Initializing neural link...", author: "SYSTEM" });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch('https://dummyjson.com/quotes/random');
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        setQuoteData({ content: data.quote, author: data.author });
      } catch (e) {
        setQuoteData({ content: "Discipline is freedom.", author: "Jocko Willink" });
      }
    };
    fetchQuote(); 
  }, []);

  const hours = time.getHours();
  let icon = <Zap className="w-3 h-3 text-yellow-400" />;
  let greeting = "GOOD MORNING";
  
  if (hours < 5) { greeting = "NIGHT OWL PROTOCOL"; icon = <Moon className="w-3 h-3 text-indigo-400" />; }
  else if (hours < 12) { greeting = "GOOD MORNING"; icon = <Sun className="w-3 h-3 text-orange-400" />; }
  else if (hours < 17) { greeting = "GOOD AFTERNOON"; icon = <Sun className="w-3 h-3 text-yellow-400" />; }
  else if (hours < 22) { greeting = "GOOD EVENING"; icon = <Moon className="w-3 h-3 text-purple-400" />; }
  else { greeting = "LATE NIGHT OPS"; icon = <Battery className="w-3 h-3 text-red-400" />; }

  return (
    <div className="px-1 mb-8 mt-2 animate-tech-reveal animate-float-medium float-delay-1">
      <div className="relative w-full rounded-[2.5rem] overflow-hidden floating-glass group">
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:gap-10 justify-between">
            <div className="flex flex-col justify-between flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2 opacity-80">
                            <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">{icon}</div>
                            <ScrambleText text={greeting} className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em]" />
                        </div>
                        <div className="flex items-center gap-3">
                           {avatar && (
                              <div className="relative group cursor-pointer">
                                 {/* Tech Ring 1 */}
                                 <motion.div 
                                     animate={{ rotate: 360 }}
                                     transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                     className="absolute -inset-[6px] rounded-full border border-dashed border-cyan-500/20 pointer-events-none"
                                 />
                                 {/* Tech Ring 2 */}
                                 <motion.div 
                                     animate={{ rotate: -360 }}
                                     transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                     className="absolute -inset-[6px] rounded-full border-t-2 border-transparent border-r-cyan-500/40 pointer-events-none"
                                 />
                                 
                                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/10 overflow-hidden relative shadow-[0_0_20px_rgba(6,182,212,0.4)] bg-slate-950 z-10">
                                    <img src={avatar} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="HUD Avatar" />
                                    
                                    {/* Scanline */}
                                    <motion.div 
                                        animate={{ top: ['-100%', '200%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                                        className="absolute left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent pointer-events-none"
                                    />
                                 </div>
                              </div>
                           )}
                           <h2 className="text-2xl sm:text-3xl font-black italic text-white uppercase tracking-tighter drop-shadow-md">
                              {username}
                           </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" />
                        <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-widest">Online</span>
                    </div>
                </div>

                <div className="relative pt-4 border-t border-white/5 mt-4 md:mt-auto">
                    <div className="absolute left-0 top-4 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full" />
                    <div className="pl-4">
                        <p className="text-[10px] font-medium text-slate-300 italic leading-relaxed line-clamp-2 opacity-80">
                            "{quoteData.content}"
                        </p>
                        <p className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest mt-1.5 text-right">
                            — {quoteData.author}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between md:justify-end md:gap-8">
                <div className="flex items-baseline -ml-1 md:ml-0">
                    <span className="text-[4.5rem] md:text-[5.5rem] leading-none font-black font-mono text-white tracking-tighter drop-shadow-2xl">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span className="text-xl font-mono text-slate-500 font-bold ml-1 mb-2">
                        :{time.getSeconds().toString().padStart(2, '0')}
                    </span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const LogoutSequence = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
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

type TimePhase = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'sunset' | 'evening' | 'midnight';

const ViscousFluidBackground = ({ phase }: { phase: TimePhase }) => {
    // Theme Configuration for 7 Time Slots
    const theme = {
        dawn: { // 05:00 - 08:00 (Soft, Pastel, Hopeful)
            base: 'from-indigo-200 via-rose-100 to-amber-50',
            blob1: 'bg-orange-300/40 mix-blend-multiply',
            blob2: 'bg-pink-300/40 mix-blend-multiply',
            blob3: 'bg-sky-300/40 mix-blend-multiply',
            blob4: 'bg-purple-200/50 mix-blend-multiply',
            vignette: 'from-white/30 via-transparent to-indigo-900/10'
        },
        morning: { // 08:00 - 12:00 (Bright, Arctic, Crisp)
            base: 'from-cyan-50 via-white to-blue-50',
            blob1: 'bg-cyan-400/30 mix-blend-multiply',
            blob2: 'bg-blue-400/30 mix-blend-multiply',
            blob3: 'bg-emerald-300/30 mix-blend-multiply',
            blob4: 'bg-teal-300/40 mix-blend-multiply',
            vignette: 'from-white/60 via-transparent to-cyan-900/5'
        },
        noon: { // 12:00 - 15:00 (Intense, Gold, Azure)
            base: 'from-blue-400 via-blue-200 to-yellow-100',
            blob1: 'bg-yellow-300/50 mix-blend-overlay',
            blob2: 'bg-blue-600/30 mix-blend-overlay',
            blob3: 'bg-white/60 mix-blend-overlay',
            blob4: 'bg-amber-400/40 mix-blend-overlay',
            vignette: 'from-white/20 via-transparent to-blue-900/10'
        },
        afternoon: { // 15:00 - 18:00 (Warm, Golden Hour, Deep)
            base: 'from-amber-100 via-orange-100 to-rose-100',
            blob1: 'bg-orange-500/30 mix-blend-multiply',
            blob2: 'bg-amber-400/30 mix-blend-multiply',
            blob3: 'bg-red-300/30 mix-blend-multiply',
            blob4: 'bg-violet-300/30 mix-blend-multiply',
            vignette: 'from-white/10 via-transparent to-orange-900/10'
        },
        sunset: { // 18:00 - 20:00 (Vaporwave, Purple, Neon)
            base: 'from-[#2e022d] via-[#701a75] to-[#db2777]',
            blob1: 'bg-pink-500/40 mix-blend-screen',
            blob2: 'bg-orange-500/40 mix-blend-screen',
            blob3: 'bg-purple-600/40 mix-blend-overlay',
            blob4: 'bg-indigo-800/50 mix-blend-overlay',
            vignette: 'from-black/20 via-transparent to-black/40'
        },
        evening: { // 20:00 - 23:00 (Cyberpunk, Deep Indigo, Neon)
            base: 'from-[#0a0a2e] via-[#050515] to-[#020010]',
            blob1: 'bg-cyan-600/40 mix-blend-screen',
            blob2: 'bg-indigo-700/40 mix-blend-screen',
            blob3: 'bg-emerald-600/30 mix-blend-overlay',
            blob4: 'bg-fuchsia-600/30 mix-blend-color-dodge',
            vignette: 'from-black/60 via-transparent to-black/40'
        },
        midnight: { // 23:00 - 05:00 (Void, Minimal, Dark)
            base: 'from-[#000000] via-[#020617] to-[#0f172a]',
            blob1: 'bg-slate-800/20 mix-blend-screen',
            blob2: 'bg-violet-900/20 mix-blend-screen',
            blob3: 'bg-indigo-950/30 mix-blend-overlay',
            blob4: 'bg-black/80 mix-blend-normal',
            vignette: 'from-black/80 via-transparent to-black/90'
        }
    }[phase];

    return (
        <div className={`fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-[3000ms] ease-in-out`}>
            {/* Dynamic Base Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-b transition-all duration-[3000ms] ${theme.base}`} />

            {/* FLUID BLOB 1 (Top Left) */}
            <motion.div 
                className={`absolute top-[-20%] left-[-20%] w-[100vw] h-[100vw] rounded-full blur-[100px] transition-all duration-[3000ms] ${theme.blob1}`}
                animate={{ 
                    x: [0, 100, -50, 0], 
                    y: [0, 80, -30, 0], 
                    scale: [1, 1.2, 0.9, 1],
                    rotate: [0, 20, -10, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* FLUID BLOB 2 (Bottom Right) */}
            <motion.div 
                className={`absolute bottom-[-20%] right-[-20%] w-[120vw] h-[120vw] rounded-full blur-[120px] transition-all duration-[3000ms] ${theme.blob2}`}
                animate={{ 
                    x: [0, -120, 50, 0], 
                    y: [0, -80, 40, 0], 
                    scale: [1, 1.1, 0.9, 1],
                    rotate: [0, -15, 10, 0]
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* FLUID BLOB 3 (Center Accent) */}
            <motion.div 
                className={`absolute top-[30%] left-[20%] w-[70vw] h-[70vw] rounded-full blur-[90px] transition-all duration-[3000ms] ${theme.blob3}`}
                animate={{ 
                    scale: [1, 1.4, 1], 
                    opacity: [0.3, 0.6, 0.3],
                    x: [0, 40, 0]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* FLUID BLOB 4 (Random Pulse) */}
            <motion.div 
                className={`absolute bottom-[20%] left-[10%] w-[60vw] h-[60vw] rounded-full blur-[80px] transition-all duration-[3000ms] ${theme.blob4}`}
                animate={{ 
                    x: [0, 150, -50, 0], 
                    y: [0, -100, 50, 0]
                }}
                transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            />

            {/* Surface Texture: Noise Overlay (Critical for realism) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] mix-blend-overlay" />
            
            {/* Vignette - Adapts to time for readability */}
            <div className={`absolute inset-0 bg-radial-gradient-to-t transition-all duration-[3000ms] ${theme.vignette}`} />
        </div>
    );
};

export const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('orbit_active_user'));
  // Local users cache
  const [users, setUsers] = useState<Record<string, UserProfile>>(() => {
    const saved = localStorage.getItem('orbit_users');
    return saved ? JSON.parse(saved) : {};
  });
  // Global users (fetched from cloud for Admin)
  const [globalUsers, setGlobalUsers] = useState<UserProfile[]>([]);

  const [currentDayIndex, setCurrentDayIndex] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; 
  });

  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'academic' | 'admin' | 'hydration' | 'profile'>('daily');
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('orbit_theme') as ThemeMode) || 'dark');
  const [isClient, setIsClient] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  
  // Real-time Phase State
  const [timePhase, setTimePhase] = useState<TimePhase>('midnight');

  useEffect(() => { setIsClient(true); }, []);

  // Detailed Time Phase Logic (7 Slots)
  useEffect(() => {
    const updatePhase = () => {
       const h = new Date().getHours();
       if (h >= 5 && h < 8) setTimePhase('dawn');             // 5 AM - 8 AM
       else if (h >= 8 && h < 12) setTimePhase('morning');    // 8 AM - 12 PM
       else if (h >= 12 && h < 16) setTimePhase('noon');      // 12 PM - 4 PM
       else if (h >= 16 && h < 18) setTimePhase('afternoon'); // 4 PM - 6 PM
       else if (h >= 18 && h < 20) setTimePhase('sunset');    // 6 PM - 8 PM
       else if (h >= 20 && h < 23) setTimePhase('evening');   // 8 PM - 11 PM
       else setTimePhase('midnight');                         // 11 PM - 5 AM
    };
    updatePhase();
    const interval = setInterval(updatePhase, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Initialize Theme from User Profile if available
  useEffect(() => {
    if (currentUser && users[currentUser]?.preferences?.theme) {
      setTheme(users[currentUser].preferences.theme);
    }
  }, [currentUser, users]);

  // AUTO SYNC TO CLOUD ON CHANGE
  useEffect(() => {
      const sync = async () => {
        if (currentUser && users[currentUser]) {
            await syncUserToCloud(users[currentUser]);
            setLastSyncTime(new Date());
        }
      };
      // Debounce sync to avoid spamming API
      const t = setTimeout(sync, 2000);
      return () => clearTimeout(t);
  }, [users, currentUser]);

  // FETCH GLOBAL USERS IF ADMIN
  useEffect(() => {
      if (currentUser === 'arihant' && viewMode === 'admin') {
          getGlobalUsers().then(fetchedUsers => {
              if (fetchedUsers.length > 0) {
                  setGlobalUsers(fetchedUsers);
              } else {
                  // Fallback to local users if offline
                  setGlobalUsers(Object.values(users));
              }
          });
      }
  }, [currentUser, viewMode, users]);

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

  const handleAuthSuccess = async (username: string, password?: string) => {
    const normalizedUsername = username.toLowerCase();
    setIsSyncing(true);

    try {
        let success = false;
        
        // 1. Try to Login
        success = await loginUser(normalizedUsername, password);
        
        // 2. If fail, Try to Register
        if (!success && password) {
             success = await registerUser(normalizedUsername, password);
        }

        if (success) {
             // 3. Pull data from Cloud
             const cloudProfile = await getUserFromCloud(normalizedUsername);
             
             if (cloudProfile) {
                 setUsers(prev => ({ ...prev, [normalizedUsername]: cloudProfile }));
             } else {
                 setUsers(prev => {
                     // Check if local data exists for this user. If so, preserve it (Offline Mode safety)
                     if (prev[normalizedUsername]) {
                         return prev;
                     }

                     // Initialize new local profile only if cloud empty AND local empty
                     const emptySchedule: WeekSchedule = {};
                     DAYS_OF_WEEK.forEach(day => emptySchedule[day] = []);
                     const initialAcademic = normalizedUsername === 'arihant' ? JSON.parse(JSON.stringify(UNI_SCHEDULE)) : { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
                     const newProfile: UserProfile = {
                        username: normalizedUsername,
                        password: password, // Note: We only store pass locally for auto-fill visual, real auth is JWT
                        joinedDate: new Date().toISOString(),
                        schedule: normalizedUsername === 'arihant' ? JSON.parse(JSON.stringify(INITIAL_SCHEDULE)) : emptySchedule,
                        academicSchedule: initialAcademic,
                        lastResetDate: getMondayOfCurrentWeek(),
                        preferences: { theme: 'system', startOfWeek: 'Monday', timeFormat: '12h', notifications: { dailyReminder: true, taskAlerts: true }}
                     };
                     return { ...prev, [normalizedUsername]: newProfile };
                 });
             }

             setCurrentUser(normalizedUsername);
             localStorage.setItem('orbit_active_user', normalizedUsername);
             setViewMode('daily');
             setLastSyncTime(new Date());
        } else {
            alert("Authentication Failed. Check password or connection.");
        }
    } catch (e) {
        console.error("Auth flow error", e);
    } finally {
        setIsSyncing(false);
    }
  };

  const handleLogout = () => { setIsLoggingOut(true); };
  const performLogout = async () => {
    if (currentUser && users[currentUser]) {
      // Force final sync before destroying session
      await syncUserToCloud(users[currentUser]);
    }
    setCurrentUser(null);
    localStorage.removeItem('orbit_active_user');
    localStorage.removeItem('orbit_jwt');
    setIsLoggingOut(false);
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    const newUsers = { ...users };
    delete newUsers[currentUser];
    setUsers(newUsers);
    performLogout();
    playOrbitSound('delete');
  };

  const handleAdminDeleteUser = async (targetUsername: string) => {
      // Optimistic Update
      setGlobalUsers(prev => prev.filter(u => u.username !== targetUsername));
      // API Call
      const success = await deleteGlobalUser(targetUsername);
      if (success) {
          playOrbitSound('delete');
      } else {
          alert("Failed to delete user. Check permissions or connectivity.");
          // Revert if failed (simplistic fetch)
          getGlobalUsers().then(setGlobalUsers);
      }
  };

  const handleExportData = () => {
    if (!currentUser || !users[currentUser]) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(users[currentUser], null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `orbit_backup_${currentUser}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    playOrbitSound('success_chord');
  };

  const handleForceSync = async () => {
    if (!currentUser || !users[currentUser]) return;
    setIsSyncing(true);
    try {
      await syncUserToCloud(users[currentUser]);
      setLastSyncTime(new Date());
      playOrbitSound('power_up'); 
    } catch (e) {
      console.error("Sync failed", e);
      playOrbitSound('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateUser = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    setUsers(prev => {
      const updatedProfile = { ...prev[currentUser], ...updates };
      // If theme changed in preferences, update global app theme immediately
      if (updates.preferences?.theme && updates.preferences.theme !== theme) {
        setTheme(updates.preferences.theme);
      }
      return { ...prev, [currentUser]: updatedProfile };
    });
  };

  // ... (Slot/Class handlers remain unchanged)
  const handleToggleSlot = (day: string, slotId: string) => {
    if (!currentUser) return;
    setUsers(prev => {
      const userProfile = prev[currentUser];
      const newDaySlots = userProfile.schedule[day].map(slot => slot.id === slotId ? { ...slot, isCompleted: !slot.isCompleted } : slot);
      return { ...prev, [currentUser]: { ...userProfile, schedule: { ...userProfile.schedule, [day]: newDaySlots } } };
    });
  };
  
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

  const userProfile = currentUser ? users[currentUser] : undefined;
  const currentAcademicSchedule = userProfile?.academicSchedule || {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
  };
  const currentDayName = DAYS_OF_WEEK[currentDayIndex];
  const currentSlots = userProfile?.schedule[currentDayName] || [];

  const viewTabs = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Report' },
    { id: 'academic', label: 'Academic' },
    { id: 'hydration', label: 'Hydration' },
    { id: 'profile', label: 'Profile' },
    // Only show Admin if Arihant
    ...(currentUser === 'arihant' ? [{ id: 'admin', label: 'Admin' }] : [])
  ];

  const dayTabs = DAYS_OF_WEEK.map((d, i) => ({ id: i.toString(), label: d.substring(0, 3) }));

  if (!isClient) return null;

  return (
    <div key="main-app" className="relative min-h-screen font-sans text-slate-200 overflow-x-hidden selection:bg-cyan-500/30">
      
      {/* WELCOME SEQUENCE */}
      <AnimatePresence>
        {showWelcome && <WelcomeSequence onComplete={() => setShowWelcome(false)} />}
      </AnimatePresence>

      {/* --- REBUILT VISCOUS FLUID BACKGROUND (7 Time Slots) --- */}
      <ViscousFluidBackground phase={timePhase} />

      {!currentUser ? (
        <div className="relative min-h-screen flex items-center justify-center p-4 transition-colors duration-500 overflow-hidden z-10 animate-float-slow">
          <Auth onAuthSuccess={handleAuthSuccess} isSyncing={isSyncing} />
        </div>
      ) : (
        <>
            {userProfile && (
              <NotificationSystem 
              schedule={userProfile.schedule} 
              academicSchedule={currentAcademicSchedule} 
              waterConfig={userProfile.waterConfig} 
              dayName={new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              />
            )}

            {/* NAVBAR (Floating Glass) */}
            <motion.nav 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="fixed top-4 left-2 right-2 sm:left-4 sm:right-4 z-50 animate-float-slow"
            >
                <div className="max-w-5xl mx-auto">
                    <div className="relative floating-glass rounded-[2rem] p-4 overflow-hidden group">
                        {/* Shimmer Effect on Navbar */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" style={{ animationDuration: '6s' }} />

                        <div className="flex items-center justify-between mb-5 relative z-10 px-1">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-white/20 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-white/20 animate-pulse-slow rounded-full" />
                                    <Radio className="w-4 h-4 text-white relative z-10" />
                                </div>
                                <span className="text-xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">ORBIT</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={requestNotificationPermission}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${notificationPermission === 'granted' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                >
                                    {notificationPermission === 'granted' ? <BellRing className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                                </button>
                                
                                <div className="h-8 px-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-0.5">
                                    <button onClick={() => setTheme('light')} className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${theme === 'light' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><Sun className="w-3 h-3" /></button>
                                    <button onClick={() => setTheme('dark')} className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-slate-700 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><Moon className="w-3 h-3" /></button>
                                    <button onClick={() => setTheme('system')} className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${theme === 'system' ? 'bg-slate-700 text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><Monitor className="w-3 h-3" /></button>
                                </div>

                                <button onClick={() => setViewMode('profile')} className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center hover:bg-cyan-500 hover:text-white transition-all overflow-hidden relative p-0">
                                    {userProfile?.avatar ? (
                                        <img src={userProfile.avatar} alt="User" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="relative z-10 flex justify-center">
                            <LiquidTabs 
                                tabs={viewTabs} 
                                activeId={viewMode} 
                                onChange={(id) => setViewMode(id as any)} 
                                layoutIdPrefix="main-nav"
                                variant="pill"
                            />
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* MAIN CONTENT */}
            <motion.main 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="max-w-5xl mx-auto px-4 relative z-10 pt-48 pb-24"
            >
                <MobileHUD username={currentUser} avatar={userProfile?.avatar} />

                {viewMode === 'daily' && (
                <div className="mb-10 flex justify-center animate-float-medium float-delay-2">
                    <LiquidTabs 
                        tabs={dayTabs} 
                        activeId={currentDayIndex.toString()} 
                        onChange={(id) => setCurrentDayIndex(parseInt(id))} 
                        layoutIdPrefix="day-selector" 
                        variant="scrollable"
                    />
                </div>
                )}

                <div className="animate-float-fast float-delay-3">
                    {viewMode === 'daily' && userProfile ? (
                    <DailyView 
                        dayName={currentDayName} 
                        slots={currentSlots} 
                        username={currentUser}
                        onToggleSlot={handleToggleSlot}
                        onAddSlot={(slot) => handleAddOrEditSlot(currentDayName, slot)}
                        onRemoveSlot={(id) => handleRemoveSlot(currentDayName, id)}
                    />
                    ) : viewMode === 'weekly' && userProfile ? (
                    <WeeklyReport schedule={userProfile.schedule} lastWeekStats={userProfile.lastWeekStats} />
                    ) : viewMode === 'academic' && userProfile ? (
                    <AcademicView 
                        schedule={currentAcademicSchedule}
                        onAddClass={handleAddClass}
                        onEditClass={handleEditClass}
                        onDeleteClass={handleDeleteClass}
                    />
                    ) : viewMode === 'hydration' && userProfile ? (
                    <WaterTracker 
                        username={currentUser} 
                        userConfig={userProfile.waterConfig} 
                        onSaveConfig={handleSaveWaterConfig} 
                    />
                    ) : viewMode === 'profile' && userProfile ? (
                    <ProfileView 
                      user={userProfile}
                      onUpdateUser={handleUpdateUser}
                      onLogout={handleLogout}
                      onDeleteAccount={handleDeleteAccount}
                      onExportData={handleExportData}
                      onForceSync={handleForceSync}
                      lastSyncTime={lastSyncTime}
                      isSyncing={isSyncing}
                    />
                    ) : (
                    <AdminView 
                        users={globalUsers} 
                        onResetUser={handleResetUser} 
                        onDeleteUser={handleAdminDeleteUser}
                    />
                    )}
                </div>
            </motion.main>
        </>
      )}
      
      {isLoggingOut && <LogoutSequence onComplete={performLogout} />}
    </div>
  );
};