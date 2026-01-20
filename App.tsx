
import React, { useState, useEffect, useRef } from 'react';
import { DailyView } from './components/DailyView';
import { WeeklyReport } from './components/WeeklyReport';
import { AdminView } from './components/AdminView';
import { AcademicView } from './components/AcademicView';
import { WaterTracker } from './components/WaterTracker';
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

// --- HELPERS FOR NOTIFICATIONS ---

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

// Generate ASCII Progress Bar
const getProgressBar = (percentage: number) => {
  const bars = Math.floor(percentage / 10);
  return '▓'.repeat(bars) + '░'.repeat(10 - bars);
};

// Replicate Water Tracker Logic for background checks
const generateWaterSlots = (dailyGoal: number) => {
    const glassSize = 0.5; 
    const totalSlotsNeeded = Math.ceil(dailyGoal / glassSize);
    const slots = [];
    
    // Slot 1: Fixed
    slots.push({ time: '07:30 AM', label: 'CORTISOL FLUSH', amount: 0.5 });
    
    const remaining = totalSlotsNeeded - 1;
    if (remaining <= 0) return slots;

    const startMin = 9 * 60; // 9 AM
    const endMin = 21 * 60;  // 9 PM
    const interval = (endMin - startMin) / remaining;

    for (let i = 0; i < remaining; i++) {
       const minutes = Math.floor(startMin + (i * interval));
       const h = Math.floor(minutes / 60);
       const m = minutes % 60;
       const ampm = h >= 12 ? 'PM' : 'AM';
       const dispH = h > 12 ? h - 12 : (h === 0 || h === 24 ? 12 : h);
       const timeStr = `${dispH}:${m.toString().padStart(2, '0')} ${ampm}`;
       slots.push({ time: timeStr, label: 'HYDRATE', amount: 0.5 });
    }
    return slots;
};

// --- MOBILE HUD COMPONENT ---
const MobileHUD = ({ username }: { username: string }) => {
  const [time, setTime] = useState(new Date());
  
  // Quote State
  const [quoteData, setQuoteData] = useState({ content: "Establishing Uplink...", author: "SYSTEM" });
  const [quoteProgress, setQuoteProgress] = useState(0);

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Quote Fetcher Logic (Every 30s)
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setQuoteProgress(0); // Reset bar
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

    fetchQuote(); // Initial fetch

    const quoteInterval = setInterval(() => {
        fetchQuote();
    }, 30000);

    // Smooth Progress Bar for the 30s timer (update every 100ms)
    const progressInterval = setInterval(() => {
        setQuoteProgress(prev => {
            if (prev >= 100) return 0;
            return prev + (100 / 300); // 100% divided by (30000ms / 100ms steps) = 0.333% per tick
        });
    }, 100);

    return () => { 
        clearInterval(quoteInterval); 
        clearInterval(progressInterval);
    };
  }, []);

  const hours = time.getHours();

  let greeting = "SYSTEM ONLINE";
  let icon = <Zap className="w-3 h-3 text-yellow-400" />;
  
  if (hours < 5) { greeting = "NIGHT OWL MODE"; icon = <Moon className="w-3 h-3 text-indigo-400" />; }
  else if (hours < 12) { greeting = "DAWN PROTOCOL"; icon = <Sun className="w-3 h-3 text-orange-400" />; }
  else if (hours < 17) { greeting = "ZENITH FOCUS"; icon = <Sun className="w-3 h-3 text-yellow-400" />; }
  else if (hours < 22) { greeting = "TWILIGHT GRIND"; icon = <Moon className="w-3 h-3 text-purple-400" />; }
  else { greeting = "MIDNIGHT OIL"; icon = <Battery className="w-3 h-3 text-red-400" />; }

  return (
    <div className="lg:hidden px-4 mb-6 animate-tech-reveal">
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-700/50 shadow-xl backdrop-blur-xl">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
        <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
        
        <div className="p-4 relative z-10">
          {/* Top Row: Greeting & Status */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-white/5 border border-white/10">{icon}</div>
              <div>
                 <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none mb-0.5">Good {hours < 12 ? 'Morning' : hours < 18 ? 'Afternoon' : 'Evening'}</div>
                 <div className="text-xs font-black italic text-cyan-400 uppercase tracking-tighter">{username}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" />
               <div className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">ONLINE</div>
            </div>
          </div>

          {/* Middle Row: Big Clock & Seconds */}
          <div className="flex items-center justify-between mb-4 bg-black/20 rounded-xl p-3 border border-white/5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-mono text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
                <span className="text-sm font-mono text-slate-500 font-bold">
                    :{time.getSeconds().toString().padStart(2, '0')}
                </span>
              </div>
              
              {/* Seconds Circular Indicator */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                 <svg className="w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="18" className="fill-none stroke-slate-800 stroke-2" />
                    <circle cx="50%" cy="50%" r="18" className="fill-none stroke-cyan-500 stroke-2 transition-all duration-300 ease-linear" strokeDasharray="113" strokeDashoffset={113 - (113 * time.getSeconds()) / 60} />
                 </svg>
                 <div className="absolute w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
          </div>

          {/* Bottom Row: Dynamic Quote Engine */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-800/50 to-black/50 border border-slate-700/50">
             <div className="px-3 py-3 relative z-10">
                 <div className="flex items-start gap-2">
                    <Quote className="w-3 h-3 text-cyan-500/50 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p key={quoteData.content} className="text-xs font-medium text-slate-300 leading-relaxed animate-fade-in">
                            "{quoteData.content}"
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1.5">
                            <span className="w-4 h-px bg-slate-600"></span>
                            <span className="text-[9px] font-mono font-bold text-cyan-500 uppercase tracking-wider truncate max-w-[120px]">
                                {quoteData.author}
                            </span>
                        </div>
                    </div>
                 </div>
             </div>
             {/* Quote Timer Progress Bar */}
             <div className="absolute bottom-0 left-0 h-[2px] bg-cyan-500/50 shadow-[0_0_5px_rgba(6,182,212,0.8)] transition-all duration-100 ease-linear" style={{ width: `${quoteProgress}%` }} />
          </div>
          
          <div className="flex justify-between items-center mt-1 px-1">
             <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" /> Uplink Active
             </span>
             <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">
                Refresh: 30s
             </span>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- LOGOUT SEQUENCE COMPONENT (GEN Z / CRAZY MODE) ---
const LogoutSequence = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState(0); // 0: Chaos, 1: Collapse Y, 2: Collapse X

  useEffect(() => {
    // Audio Synthesis for "Power Down"
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 2);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.5);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

      osc.start();
      osc.stop(ctx.currentTime + 2);
    }

    // Sequence Timing
    const t1 = setTimeout(() => setStage(1), 1500); // Start Collapse Y
    const t2 = setTimeout(() => setStage(2), 1800); // Start Collapse X
    const t3 = setTimeout(() => onComplete(), 2200); // Finish

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  const phrases = [
    "YEET THE SYSTEM",
    "TOUCH GRASS",
    "NO CAP FR",
    "GHOSTING...",
    "VIBE CHECK: FAILED",
    "SERVER: CRINGE",
    "LOGGING OFF",
    "MAIN CHARACTER EXIT",
    "IT'S GIVING... OFFLINE",
    "BET.",
    "L + RATIO + LOGOUT",
    "SKIBIDI SHUTDOWN"
  ];

  return (
    <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center overflow-hidden">
        {/* CRT CONTAINER */}
        <div 
          className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ease-in-out origin-center ${stage === 1 ? 'scale-y-[0.005] scale-x-100 bg-white' : ''} ${stage === 2 ? 'scale-y-[0.002] scale-x-0 bg-white' : 'bg-slate-900'}`}
        >
             {/* CHAOS CONTENT */}
             {stage === 0 && (
                <div className="absolute inset-0 bg-[#030014] overflow-hidden">
                   {/* Background Glitch */}
                   <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
                   <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay" />
                   
                   {/* Random Floating Text */}
                   {phrases.map((txt, i) => (
                      <div 
                        key={i}
                        className="absolute font-black font-mono text-cyan-400 uppercase tracking-tighter mix-blend-screen"
                        style={{
                           top: `${Math.random() * 90}%`,
                           left: `${Math.random() * 90}%`,
                           fontSize: `${Math.random() * 4 + 1}rem`,
                           transform: `rotate(${Math.random() * 60 - 30}deg)`,
                           animation: `glitch 0.${Math.floor(Math.random() * 5 + 1)}s infinite alternate`,
                           textShadow: '2px 2px 0px #ff0000, -2px -2px 0px #0000ff'
                        }}
                      >
                         {txt}
                      </div>
                   ))}

                   <div className="absolute inset-0 flex items-center justify-center z-50">
                      <div className="relative">
                         <h1 className="text-7xl sm:text-9xl font-black italic text-white animate-bounce tracking-tighter drop-shadow-[0_0_35px_rgba(255,0,0,1)] mix-blend-difference">
                            SYSTEM<br/>PURGE
                         </h1>
                         <div className="absolute inset-0 text-red-500 animate-cyber-glitch opacity-70">
                            SYSTEM<br/>PURGE
                         </div>
                      </div>
                   </div>
                </div>
             )}
             
             {/* White flash bar for CRT closing */}
             {(stage === 1 || stage === 2) && (
                <div className="absolute inset-0 bg-white shadow-[0_0_100px_white,0_0_50px_cyan]" />
             )}
        </div>
    </div>
  );
};

// --- SPLASH SCREEN COMPONENT ---
const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [text, setText] = useState('INITIALIZING...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Accelerated boot sequence for snappier feel
    const steps = [
      { t: 'LOADING KERNEL...', p: 30, d: 300 },
      { t: 'SYNCING DATA...', p: 60, d: 800 },
      { t: 'READY', p: 100, d: 1400 },
    ];

    let timeouts: ReturnType<typeof setTimeout>[] = [];

    steps.forEach(({ t, p, d }) => {
      const timeout = setTimeout(() => {
        setText(t);
        setProgress(p);
      }, d);
      timeouts.push(timeout);
    });

    const finalTimeout = setTimeout(onComplete, 1800);
    timeouts.push(finalTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#030014] flex flex-col items-center justify-center overflow-hidden">
       {/* Ambient Background */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)] animate-pulse-slow" />
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
       
       <div className="relative z-10 flex flex-col items-center animate-tech-reveal">
          {/* Logo Animation */}
          <div className="relative w-32 h-32 mb-10">
             {/* Spinning Rings */}
             <div className="absolute inset-0 border-t-2 border-l-2 border-cyan-500/50 rounded-full animate-[spin_1.5s_linear_infinite]" />
             <div className="absolute inset-2 border-b-2 border-r-2 border-purple-500/50 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
             
             {/* Center Icon */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                   <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse" />
                   <Radio className="w-12 h-12 text-white animate-pulse" />
                </div>
             </div>
          </div>

          {/* Glitchy Text */}
          <div className="h-8 flex items-center justify-center overflow-hidden mb-2">
             <h1 className="text-xl font-black italic tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500">
                {text}
             </h1>
          </div>

          {/* Loading Bar */}
          <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden relative">
             <div 
               className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300 ease-out relative"
               style={{ width: `${progress}%` }}
             >
                <div className="absolute inset-0 bg-white/50 animate-[shimmer_1s_infinite]" />
             </div>
          </div>

          {/* Footer Code */}
          <div className="mt-4 font-mono text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
             System Integrity: 100%
          </div>
       </div>
    </div>
  );
};

// --- SYSTEM CLOCK COMPONENT ---
const SystemClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex flex-col items-end justify-center px-5 border-r border-slate-200 dark:border-white/10 mr-2">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xl font-black text-slate-800 dark:text-white tracking-widest tabular-nums leading-none">
                {time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: false})}
            </span>
        </div>
        <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.2em] leading-none mt-1 mr-0.5">
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
  
  // Notification State
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => { setIsClient(true); }, []);

  // AUTO WEEKLY RESET LOGIC
  useEffect(() => {
    if (!currentUser || !users[currentUser]) return;

    const currentMonday = getMondayOfCurrentWeek();
    const userProfile = users[currentUser];

    // Check if we need to reset for a new week
    if (!userProfile.lastResetDate || userProfile.lastResetDate !== currentMonday) {
      console.log("WEEK ENDED: Initializing Reset for", currentUser);
      
      // Archive current week performance
      const allSlots = Object.values(userProfile.schedule).flat() as ScheduleSlot[];
      const completed = allSlots.filter(s => s.isCompleted).length;
      const total = allSlots.length;
      const lastWeekStats: WeeklyStats = {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        dateRange: `Week ending ${new Date().toLocaleDateString()}`
      };

      // Un-right all tasks (reset completion)
      const resetSchedule: WeekSchedule = {};
      Object.keys(userProfile.schedule).forEach(day => {
        resetSchedule[day] = userProfile.schedule[day].map(slot => ({
          ...slot,
          isCompleted: false
        }));
      });

      setUsers(prev => ({
        ...prev,
        [currentUser]: {
          ...userProfile,
          schedule: resetSchedule,
          lastResetDate: currentMonday,
          lastWeekStats: lastWeekStats
        }
      }));
    }
  }, [currentUser, users]);

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

  // --- NOTIFICATION ENGINE ---
  useEffect(() => {
    if (notificationPermission !== 'granted' || !currentUser || !users[currentUser]) return;

    const checkNotifications = () => {
       const now = new Date();
       const currentMinutes = now.getHours() * 60 + now.getMinutes();
       
       // Real-time day derivation
       const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
       const todayName = days[now.getDay()];
       
       const user = users[currentUser];
       if (!user) return;

       // 1. SCHEDULE ALERTS & PROGRESS
       const todaySlots = user.schedule[todayName] || [];
       const completed = todaySlots.filter(s => s.isCompleted).length;
       const total = todaySlots.length;
       const percent = total > 0 ? Math.round((completed/total)*100) : 0;
       
       todaySlots.forEach(slot => {
           if (slot.isCompleted) return;
           const startMin = parseTime(slot.timeRange);
           if (startMin === -1) return;

           const diff = startMin - currentMinutes;
           // Notify 10 minutes before, or exactly at time
           if ((diff === 10 || diff === 0) && !notifiedRef.current.has(`${todayName}-${slot.id}-${diff}`)) {
               const progressBar = getProgressBar(percent);
               new Notification(`ORBIT: ${slot.title}`, {
                  body: `Starts in ${diff} min.\nProgress: [${progressBar}] ${percent}%`,
                  icon: '/icon.png' // Fallback
               });
               notifiedRef.current.add(`${todayName}-${slot.id}-${diff}`);
           }
       });

       // 2. WATER REMINDERS
       if (user.waterConfig) {
          const waterSlots = generateWaterSlots(user.waterConfig.dailyGoal);
          waterSlots.forEach((ws, idx) => {
              const wsMin = parseTime(ws.time);
              // Notify if within 1 minute of target time and not completed (simple check since we don't track completion in this hook easily, we assume reminder is helpful regardless)
              const diff = Math.abs(wsMin - currentMinutes);
              const notificationKey = `water-${todayName}-${idx}`;
              
              if (diff <= 1 && !notifiedRef.current.has(notificationKey)) {
                  // Check if already done? 
                  // For now, simpler to just remind if it's the time.
                  const isDone = user.waterConfig?.progress.includes(`water-${idx}`) || (idx === 0 && user.waterConfig?.progress.includes('water-wake'));
                  
                  if (!isDone) {
                     new Notification(`HYDRATION ALERT`, {
                        body: `Time for ${ws.label} (${ws.amount}L)\nStay optimized.`,
                     });
                     notifiedRef.current.add(notificationKey);
                  }
              }
          });
       }
    };

    const interval = setInterval(checkNotifications, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [notificationPermission, currentUser, users]);

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const handleAuthSuccess = (username: string, password?: string) => {
    const normalizedUsername = username.toLowerCase();
    const existingUser = users[normalizedUsername];

    if (!existingUser) {
        // IMPORTANT: Ordinary users start with EMPTY schedule. Only 'arihant' gets the template.
        const emptySchedule: WeekSchedule = {};
        DAYS_OF_WEEK.forEach(day => emptySchedule[day] = []);
        
        // Initialize Academic Schedule: Arihant gets the template, others get empty
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
    } else {
        // Migration support for existing users who might lack academicSchedule
        if (!existingUser.academicSchedule) {
             const initialAcademic = normalizedUsername === 'arihant' ? JSON.parse(JSON.stringify(UNI_SCHEDULE)) : { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
             setUsers(prev => ({
                 ...prev,
                 [normalizedUsername]: { ...existingUser, academicSchedule: initialAcademic }
             }));
        }
    }
    
    setCurrentUser(normalizedUsername);
    localStorage.setItem('orbit_active_user', normalizedUsername);
    setViewMode('daily');
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
  };

  const performLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('orbit_active_user');
    setIsLoggingOut(false);
  };

  const handleToggleSlot = (day: string, slotId: string) => {
    if (!currentUser) return;
    setUsers(prev => {
      const userProfile = prev[currentUser];
      const newDaySlots = userProfile.schedule[day].map(slot => 
        slot.id === slotId ? { ...slot, isCompleted: !slot.isCompleted } : slot
      );
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
            // Edit existing
            newDaySlots = [...(userProfile.schedule[day] || [])];
            newDaySlots[existingSlotIndex] = slotData;
        } else {
            // Add new
            newDaySlots = [...(userProfile.schedule[day] || []), slotData];
        }

        // Sort slots by time
        newDaySlots.sort((a, b) => {
           const getMins = (str: string) => parseTime(str);
           return getMins(a.timeRange) - getMins(b.timeRange);
        });

        return { ...prev, [currentUser]: { ...userProfile, schedule: { ...userProfile.schedule, [day]: newDaySlots } } };
    });
  };

  const handleRemoveSlot = (day: string, slotId: string) => {
    if (!currentUser) return;
    setUsers(prev => {
        const userProfile = prev[currentUser];
        const newDaySlots = userProfile.schedule[day].filter(s => s.id !== slotId);
        return { ...prev, [currentUser]: { ...userProfile, schedule: { ...userProfile.schedule, [day]: newDaySlots } } };
    });
  };

  // --- ACADEMIC CRUD HANDLERS ---
  const handleAddClass = (day: string, classData: ClassSession) => {
    if (!currentUser) return;
    setUsers(prev => {
        const userProfile = prev[currentUser];
        const currentSchedule = userProfile.academicSchedule || {};
        const dayClasses = currentSchedule[day] || [];
        
        // Add new class
        const newClasses = [...dayClasses, classData];
        
        // Sort by start time
        newClasses.sort((a, b) => {
            const getMins = (str: string) => parseTime(str);
            return getMins(a.startTime) - getMins(b.startTime);
        });

        return {
            ...prev,
            [currentUser]: {
                ...userProfile,
                academicSchedule: { ...currentSchedule, [day]: newClasses }
            }
        };
    });
  };

  const handleEditClass = (day: string, classData: ClassSession) => {
     if (!currentUser) return;
     setUsers(prev => {
        const userProfile = prev[currentUser];
        const currentSchedule = userProfile.academicSchedule || {};
        const dayClasses = currentSchedule[day] || [];
        
        const index = dayClasses.findIndex(c => c.id === classData.id);
        if (index === -1) return prev;

        const newClasses = [...dayClasses];
        newClasses[index] = classData;

        // Sort again in case time changed
        newClasses.sort((a, b) => {
            const getMins = (str: string) => parseTime(str);
            return getMins(a.startTime) - getMins(b.startTime);
        });

        return {
            ...prev,
            [currentUser]: {
                ...userProfile,
                academicSchedule: { ...currentSchedule, [day]: newClasses }
            }
        };
     });
  };

  const handleDeleteClass = (day: string, classId: string) => {
     if (!currentUser) return;
     setUsers(prev => {
        const userProfile = prev[currentUser];
        const currentSchedule = userProfile.academicSchedule || {};
        const dayClasses = currentSchedule[day] || [];
        
        const newClasses = dayClasses.filter(c => c.id !== classId);

        return {
            ...prev,
            [currentUser]: {
                ...userProfile,
                academicSchedule: { ...currentSchedule, [day]: newClasses }
            }
        };
     });
  };


  // NEW: Allow Admin to reset user schedule to template
  const handleResetUser = (username: string) => {
    if (username.toLowerCase() === 'arihant') {
       if (confirm('SYSTEM WARNING: This will overwrite Arihant\'s schedule with the new default template. Continue?')) {
          setUsers(prev => ({
             ...prev,
             arihant: {
                ...prev.arihant,
                schedule: JSON.parse(JSON.stringify(INITIAL_SCHEDULE)),
                academicSchedule: JSON.parse(JSON.stringify(UNI_SCHEDULE))
             }
          }));
       }
    }
  };

  const handleSaveWaterConfig = (config: WaterConfig) => {
    if (!currentUser) return;
    setUsers(prev => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        waterConfig: config
      }
    }));
  };

  if (!isClient) return null;

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!currentUser) {
    return (
      <div key="auth" className="relative min-h-screen bg-orbit-lightBg dark:bg-orbit-bg flex items-center justify-center p-4 transition-colors duration-500 animate-tech-reveal">
        <Auth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  const userProfile = users[currentUser];
  const isOwner = currentUser.toLowerCase() === 'arihant';
  const currentDayName = DAYS_OF_WEEK[currentDayIndex];
  const currentSlots = userProfile.schedule[currentDayName] || [];
  const currentAcademicSchedule = userProfile.academicSchedule || {};

  return (
    <div key="main-app" className="relative min-h-screen bg-orbit-lightBg dark:bg-orbit-bg font-sans text-slate-800 dark:text-slate-200 transition-colors duration-500 overflow-x-hidden animate-tech-reveal">
      {/* COMPACT MOBILE NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur-3xl border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 px-4 py-3 sm:px-6 sm:py-5 mb-4 sm:mb-8 transition-all">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                <Radio className="w-4 h-4 sm:w-6 sm:h-6 text-white animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">ORBIT</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
             {/* REAL TIME CLOCK */}
             <SystemClock />

             {/* NOTIFICATION TOGGLE */}
             <button 
                onClick={requestNotificationPermission}
                className={`p-1.5 sm:p-2 rounded-full border transition-all ${
                   notificationPermission === 'granted' 
                   ? 'bg-slate-100 dark:bg-slate-900 border-emerald-500/30 text-emerald-500' 
                   : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-400'
                }`}
                title={notificationPermission === 'granted' ? 'Notifications Active' : 'Enable Notifications'}
             >
                {notificationPermission === 'granted' ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
             </button>

             {/* THEME SWITCHER */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-full border border-slate-200 dark:border-white/10">
              <button 
                onClick={() => setTheme('light')} 
                className={`p-1.5 sm:p-2 rounded-full transition-all ${theme === 'light' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="Light Mode"
              >
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button 
                onClick={() => setTheme('dark')} 
                className={`p-1.5 sm:p-2 rounded-full transition-all ${theme === 'dark' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="Dark Mode"
              >
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button 
                onClick={() => setTheme('system')} 
                className={`p-1.5 sm:p-2 rounded-full transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-800 text-purple-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="System Theme"
              >
                <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-full border border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none">
              <button onClick={() => setViewMode('daily')} className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase tracking-widest transition-all ${viewMode === 'daily' ? 'bg-white dark:bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Daily</button>
              
              <button onClick={() => setViewMode('academic')} className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase tracking-widest transition-all flex items-center gap-1.5 ${viewMode === 'academic' ? 'bg-white dark:bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                   <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Classes</span>
              </button>

              <button onClick={() => setViewMode('weekly')} className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase tracking-widest transition-all ${viewMode === 'weekly' ? 'bg-white dark:bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Report</button>

              <button onClick={() => setViewMode('hydration')} className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase tracking-widest transition-all flex items-center gap-1.5 ${viewMode === 'hydration' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                 <Droplet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
              
              {isOwner && <button onClick={() => setViewMode('admin')} className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase tracking-widest transition-all ${viewMode === 'admin' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Admin</button>}
            </div>
            
            <button onClick={handleLogout} className="p-2 sm:p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all">
               <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-3 sm:px-4">
        {/* MOBILE HUD - ONLY VISIBLE ON SMALL SCREENS */}
        <MobileHUD username={currentUser} />

        {viewMode === 'daily' && (
           <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 sm:mb-10 py-2">
            {DAYS_OF_WEEK.map((d, idx) => (
              <button key={d} onClick={() => setCurrentDayIndex(idx)} className={`flex-shrink-0 px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] border transition-all ${idx === currentDayIndex ? 'border-cyan-500 bg-cyan-100 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 scale-105 shadow-md' : 'border-slate-200 dark:border-white/5 bg-white dark:bg-transparent text-slate-400 dark:text-slate-500'}`}>{d}</button>
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
      
      {/* RENDER LOGOUT SEQUENCE OVERLAY */}
      {isLoggingOut && <LogoutSequence onComplete={performLogout} />}
    </div>
  );
};

export default App;
