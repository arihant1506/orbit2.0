
import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { DailyView } from './components/DailyView';
import { Auth } from './components/Auth';
import { NotificationSystem } from './components/NotificationSystem'; 
import { NotificationControl } from './components/NotificationControl'; 
import { WelcomeLoader } from './components/WelcomeLoader'; 
import { CompactWidget } from './components/CompactWidget'; 
import { INITIAL_SCHEDULE, UNI_SCHEDULE, BLANK_SCHEDULE, BLANK_UNI_SCHEDULE } from './constants';
import { WeekSchedule, ThemeMode, UserProfile, ScheduleSlot, WaterConfig, ClassSession, NoteItem, WeeklyStats, DailyStat } from './types';
import { Radio, Sun, Moon, Monitor, UserCircle, Loader2, LogOut, Save, CheckCircle2, ShieldCheck, Cloud, AlertTriangle } from 'lucide-react'; 
import { LiquidTabs } from './components/LiquidTabs';
import { getUserFromCloud, syncUserToCloud, loginUser, registerUser, getGlobalUsers, deleteGlobalUser, deleteCurrentUser } from './utils/db';
import { playOrbitSound } from './utils/audio';
import { useRealtimeSync } from './hooks/useRealtimeSync';

// --- LAZY LOAD HEAVY COMPONENTS ---
const WeeklyReport = React.lazy(() => import('./components/WeeklyReport').then(m => ({ default: m.WeeklyReport })));
const AdminView = React.lazy(() => import('./components/AdminView').then(m => ({ default: m.AdminView })));
const AcademicView = React.lazy(() => import('./components/AcademicView').then(m => ({ default: m.AcademicView })));
const WaterTracker = React.lazy(() => import('./components/WaterTracker').then(m => ({ default: m.WaterTracker })));
const ProfileView = React.lazy(() => import('./components/ProfileView').then(m => ({ default: m.ProfileView })));
const NotesView = React.lazy(() => import('./components/NotesView').then(m => ({ default: m.NotesView })));

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper: Get the ISO string for the Monday of the current real-world week
const getMondayOfCurrentWeek = () => {
  const d = new Date();
  const day = d.getDay();
  // Adjust so Sunday (0) is treated as the last day of the week, not the first
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
};

// Helper: Get YYYY-MM-DD from a Date object
const getLocalISODate = (d: Date) => {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
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

// --- MOBILE HUD COMPONENT ---
const MobileHUD = React.memo(({ username, avatar }: { username: string, avatar?: string }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  let icon = <Moon className="w-3 h-3 text-cyan-400" />;
  let greeting = "SYSTEM ONLINE";
  
  if (hours < 5) { greeting = "NIGHT OWL PROTOCOL"; icon = <Moon className="w-3 h-3 text-indigo-400" />; }
  else if (hours < 12) { greeting = "GOOD MORNING"; icon = <Sun className="w-3 h-3 text-orange-400" />; }
  else if (hours < 17) { greeting = "GOOD AFTERNOON"; icon = <Sun className="w-3 h-3 text-yellow-400" />; }
  else if (hours < 22) { greeting = "GOOD EVENING"; icon = <Moon className="w-3 h-3 text-purple-400" />; }
  else { greeting = "LATE NIGHT OPS"; icon = <Radio className="w-3 h-3 text-red-400" />; }

  return (
    <div className="px-1 mb-6 sm:mb-8 mt-2 animate-tech-reveal animate-float-medium float-delay-1 will-change-transform">
      <div className="relative w-full rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden floating-glass group transform-gpu">
        <div className="relative z-10 p-5 sm:p-8 flex flex-row gap-4 sm:gap-6 md:gap-10 justify-between items-center">
            <div className="flex flex-col justify-between flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2 opacity-80">
                            <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">{icon}</div>
                            <ScrambleText text={greeting} className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em]" />
                        </div>
                        <div className="flex items-center gap-3">
                           {avatar && (
                              <div className="relative group cursor-pointer hidden xs:block">
                                 <motion.div 
                                     animate={{ rotate: 360 }}
                                     transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                     className="absolute -inset-[6px] rounded-full border border-dashed border-cyan-500/20 pointer-events-none will-change-transform"
                                 />
                                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/10 overflow-hidden relative shadow-[0_0_20px_rgba(6,182,212,0.4)] bg-slate-950 z-10">
                                    <img src={avatar} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="HUD Avatar" />
                                 </div>
                              </div>
                           )}
                           <h2 className="text-2xl sm:text-3xl font-black italic text-white uppercase tracking-tighter drop-shadow-md">
                              {username}
                           </h2>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-end justify-center">
                <div className="text-5xl sm:text-7xl font-black italic text-white tracking-tighter leading-none drop-shadow-2xl tabular-nums">
                    {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">
                        System Time
                    </span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
});

// --- GLOSSY BACKGROUND ENGINE (OBSIDIAN GLASS) ---
const GlossyBackground = React.memo(() => {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#000000]">
            <div className="absolute inset-0 bg-[#000000]" />
            <motion.div 
                animate={{ scale: [1, 1.2, 1], x: ["-10%", "10%", "-10%"], opacity: [0.15, 0.25, 0.15] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-20%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-[radial-gradient(circle,rgba(56,11,219,0.3)_0%,transparent_70%)] blur-[100px]" 
            />
            <motion.div 
                animate={{ scale: [1.1, 1, 1.1], x: ["5%", "-5%", "5%"], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.25)_0%,transparent_70%)] blur-[120px]" 
            />
            <motion.div 
                animate={{ scale: [1, 1.3, 1], y: ["-10%", "10%", "-10%"], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[-20%] left-[-10%] w-[90vw] h-[90vw] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.2)_0%,transparent_70%)] blur-[130px]" 
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/40 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
        </div>
    );
});

const LoadingFallback = () => (
  <div className="w-full h-64 flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
  </div>
);

// --- LOGOUT LOADER OVERLAY ---
const LogoutLoader = () => (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center"
    >
        <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-red-500 animate-pulse" />
            </div>
        </div>
        <h2 className="mt-8 text-2xl font-black italic text-white uppercase tracking-tighter">Securing Data</h2>
        <p className="mt-2 text-[10px] font-mono text-red-500 uppercase tracking-[0.3em] animate-pulse">Do not close window</p>
    </motion.div>
);

export const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true); 
  const [isWidgetMode, setIsWidgetMode] = useState(false); 
  
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('orbit_active_user'));
  const [users, setUsers] = useState<Record<string, UserProfile>>(() => {
    const saved = localStorage.getItem('orbit_users');
    return saved ? JSON.parse(saved) : {};
  });
  const [globalUsers, setGlobalUsers] = useState<UserProfile[]>([]);
  const [currentDayIndex, setCurrentDayIndex] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; 
  });
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'academic' | 'notes' | 'hydration' | 'profile' | 'admin'>('daily');
  const [isClient, setIsClient] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Initialize Realtime Sync Hook
  useRealtimeSync(currentUser, setUsers);

  // --- LOGIC: HISTORY SYNC (HEATMAP) ---
  useEffect(() => {
    if (!currentUser || !users[currentUser]) return;
    
    const profile = users[currentUser];
    const schedule = profile.schedule;
    const mondayDate = new Date(getMondayOfCurrentWeek());
    
    const newDailyStats: Record<string, DailyStat> = { ...(profile.dailyStats || {}) };
    let hasChanges = false;

    DAYS_OF_WEEK.forEach((dayName, idx) => {
       const dayDate = new Date(mondayDate);
       dayDate.setDate(mondayDate.getDate() + idx);
       const dateStr = getLocalISODate(dayDate);
       
       const slots = schedule[dayName] || [];
       if (slots.length > 0) {
           const completed = slots.filter(s => s.isCompleted).length;
           const total = slots.length;
           
           if (!newDailyStats[dateStr] || newDailyStats[dateStr].c !== completed || newDailyStats[dateStr].t !== total) {
               newDailyStats[dateStr] = { c: completed, t: total };
               hasChanges = true;
           }
       }
    });

    if (hasChanges) {
        setUsers(prev => ({
            ...prev,
            [currentUser]: {
                ...prev[currentUser],
                dailyStats: newDailyStats
            }
        }));
    }
  }, [users, currentUser]);

  // --- LOGIC: WEEKLY RESET ---
  useEffect(() => {
    if (!currentUser || !users[currentUser]) return;

    const profile = users[currentUser];
    const currentMonday = getMondayOfCurrentWeek();
    
    if (profile.lastResetDate && new Date(currentMonday) > new Date(profile.lastResetDate)) {
        console.log(`[Chronicle] New week detected. Current: ${currentMonday}, Last: ${profile.lastResetDate}`);
        
        let grandTotal = 0;
        let grandCompleted = 0;
        const categoryCounts: Record<string, number> = {};

        Object.values(profile.schedule).flat().forEach((slot: ScheduleSlot) => {
            grandTotal++;
            if (slot.isCompleted) grandCompleted++;
            if (!categoryCounts[slot.category]) categoryCounts[slot.category] = 0;
            if (slot.isCompleted) categoryCounts[slot.category]++;
        });

        let dominant = "General";
        let maxCount = 0;
        Object.entries(categoryCounts).forEach(([cat, count]) => {
            if (count > maxCount) { maxCount = count; dominant = cat; }
        });

        const percentage = grandTotal === 0 ? 0 : Math.round((grandCompleted / grandTotal) * 100);
        const lastDateObj = new Date(profile.lastResetDate);
        const monthName = lastDateObj.toLocaleString('default', { month: 'long' });

        const newStat: WeeklyStats = {
            id: `${lastDateObj.getFullYear()}-W${Math.ceil((lastDateObj.getDate() + 6 - lastDateObj.getDay()) / 7)}`,
            weekStart: profile.lastResetDate,
            month: monthName,
            year: lastDateObj.getFullYear(),
            completed: grandCompleted,
            total: grandTotal,
            percentage: percentage,
            dominantCategory: dominant
        };

        setUsers(prev => {
            const user = prev[currentUser];
            const freshSchedule = { ...user.schedule };
            Object.keys(freshSchedule).forEach(day => {
                freshSchedule[day] = freshSchedule[day].map(slot => ({ ...slot, isCompleted: false }));
            });

            return {
                ...prev,
                [currentUser]: {
                    ...user,
                    schedule: freshSchedule,
                    lastResetDate: currentMonday,
                    reportArchive: [...(user.reportArchive || []), newStat],
                    lastWeekStats: newStat
                }
            };
        });
        playOrbitSound('power_up');
    }
  }, [currentUser, users]);

  useEffect(() => { 
    setIsClient(true); 
    const root = window.document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'widget') {
        setIsWidgetMode(true);
        setShowWelcome(false); 
    }

    const handler = (e: any) => {
        e.preventDefault();
        setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = useCallback(() => {
      if (!installPrompt) return;
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
              setInstallPrompt(null);
          }
      });
  }, [installPrompt]);

  // Sync Logic (Auto-Save on Change)
  useEffect(() => {
      const sync = async () => {
        if (currentUser && users[currentUser] && !isLoggingOut) {
            const result = await syncUserToCloud(users[currentUser]);
            if (result.success) {
                setLastSyncTime(new Date());
                setSyncError(false);
            } else {
                setSyncError(true);
            }
        }
      };
      
      const t = setTimeout(sync, 1000); 
      return () => clearTimeout(t);
  }, [users, currentUser, isLoggingOut]);

  useEffect(() => {
    if (currentUser === 'arihant') {
        const fetchGlobal = async () => {
            try {
                const data = await getGlobalUsers();
                setGlobalUsers(data);
            } catch (e) {
                console.error("Failed to sync global users", e);
            }
        };
        fetchGlobal();
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('orbit_users', JSON.stringify(users));
  }, [users]);

  // -- HANDLERS --
  const handleAuthSuccess = useCallback(async (username: string, password?: string, isRegistering: boolean = false) => {
    const normalizedUsername = username.toLowerCase();
    setIsSyncing(true);
    try {
        let authResponse: { success: boolean; error?: string };
        let finalIsRegistering = isRegistering;

        if (normalizedUsername === 'arihant' && !isRegistering) {
            authResponse = await loginUser(normalizedUsername, password);
            if (!authResponse.success && (authResponse.error?.includes('Invalid') || authResponse.error?.includes('not found'))) {
                 console.log("Owner account missing. Auto-registering...");
                 finalIsRegistering = true; 
            }
        } else {
             authResponse = await loginUser(normalizedUsername, password);
        }
        
        if (!authResponse.success && finalIsRegistering) {
            authResponse = await registerUser(normalizedUsername, password);
            if (authResponse.success) {
                authResponse = await loginUser(normalizedUsername, password);
            }
        }

        if (authResponse.success) {
             const cloudProfile = await getUserFromCloud(normalizedUsername);
             if (cloudProfile) {
                 // CRITICAL: Ensure we use the cloud profile if it exists
                 setUsers(prev => ({ ...prev, [normalizedUsername]: cloudProfile }));
             } else {
                 // Create new profile only if not found in cloud
                 setUsers(prev => {
                     if (prev[normalizedUsername]) return prev;
                     const isOwner = normalizedUsername === 'arihant';
                     const initialSchedule = isOwner ? JSON.parse(JSON.stringify(INITIAL_SCHEDULE)) : JSON.parse(JSON.stringify(BLANK_SCHEDULE));
                     const initialAcademic = isOwner ? JSON.parse(JSON.stringify(UNI_SCHEDULE)) : JSON.parse(JSON.stringify(BLANK_UNI_SCHEDULE));

                     const newProfile: UserProfile = {
                        username: normalizedUsername,
                        password: password,
                        joinedDate: new Date().toISOString(),
                        schedule: initialSchedule,
                        academicSchedule: initialAcademic,
                        notes: [],
                        lastResetDate: getMondayOfCurrentWeek(),
                        reportArchive: [],
                        dailyStats: {}, 
                        preferences: { theme: 'dark', startOfWeek: 'Monday', timeFormat: '12h', notifications: { water: true, schedule: true, academic: true } }
                     };
                     return { ...prev, [normalizedUsername]: newProfile };
                 });
             }
             
             if (normalizedUsername === 'arihant') {
                 try { const globalData = await getGlobalUsers(); setGlobalUsers(globalData); } catch (err) { console.error(err); }
             }

             setCurrentUser(normalizedUsername);
             localStorage.setItem('orbit_active_user', normalizedUsername);
             setViewMode(normalizedUsername === 'arihant' ? 'admin' : 'daily');
             setLastSyncTime(new Date());
             return null;
        } else {
             return authResponse.error || (isRegistering ? "Registration failed." : "Login failed.");
        }
    } catch (e) {
        return "An unexpected network error occurred.";
    } finally {
        setIsSyncing(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (currentUser && users[currentUser]) {
        setIsLoggingOut(true);
        try {
            await syncUserToCloud(users[currentUser]);
        } catch (e) {
            console.error('Logout sync warning:', e);
        }
    }
    setCurrentUser(null);
    localStorage.removeItem('orbit_active_user');
    localStorage.removeItem('orbit_jwt');
    setIsLoggingOut(false);
    setViewMode('daily');
  }, [currentUser, users]);

  const handleDeleteAccount = useCallback(async () => {
    if (!currentUser) return;
    playOrbitSound('delete');
    setIsLoggingOut(true); 
    await deleteCurrentUser();
    setUsers(prev => { const next = { ...prev }; delete next[currentUser]; return next; });
    setCurrentUser(null);
    localStorage.removeItem('orbit_active_user');
    localStorage.removeItem('orbit_jwt');
    setViewMode('daily');
    setIsLoggingOut(false);
  }, [currentUser]);

  const handleToggleSlot = useCallback((day: string, slotId: string) => {
    if (!currentUser) return;
    setUsers(prev => {
      const userProfile = prev[currentUser];
      const newDaySlots = userProfile.schedule[day].map(slot => slot.id === slotId ? { ...slot, isCompleted: !slot.isCompleted } : slot);
      return { ...prev, [currentUser]: { ...userProfile, schedule: { ...userProfile.schedule, [day]: newDaySlots } } };
    });
  }, [currentUser]);

  const handleAddOrEditSlot = useCallback((day: string, slotData: ScheduleSlot) => {
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
  }, [currentUser]);

  const handleRemoveSlot = useCallback((day: string, slotId: string) => {
      if (!currentUser) return;
      setUsers(prev => ({...prev, [currentUser]: {...prev[currentUser], schedule: {...prev[currentUser].schedule, [day]: prev[currentUser].schedule[day].filter(s => s.id !== slotId)}}}));
  }, [currentUser]);

  const handleSaveWaterConfig = useCallback((config: WaterConfig) => {
    if (!currentUser) return;
    setUsers(prev => ({ ...prev, [currentUser]: { ...prev[currentUser], waterConfig: config } }));
  }, [currentUser]);

  const handleToggleWater = useCallback((id: string) => {
      if (!currentUser) return;
      setUsers(prev => {
          const profile = prev[currentUser];
          if (!profile.waterConfig) return prev;
          const currentProgress = profile.waterConfig.progress || [];
          let newProgress = [...currentProgress];
          if (newProgress.includes(id)) {
              newProgress = newProgress.filter(pid => pid !== id);
          } else {
              newProgress.push(id);
          }
          return {
              ...prev,
              [currentUser]: {
                  ...profile,
                  waterConfig: { ...profile.waterConfig, progress: newProgress }
              }
          }
      });
  }, [currentUser]);

  const handleUpdateUser = useCallback((updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    setUsers(prev => {
      const updatedProfile = { 
          ...prev[currentUser], 
          ...updates,
          preferences: updates.preferences 
            ? { ...prev[currentUser].preferences, ...updates.preferences } 
            : prev[currentUser].preferences
      };
      return { ...prev, [currentUser]: updatedProfile };
    });
  }, [currentUser]);

  const handleUpdateNotes = useCallback((newNotes: NoteItem[]) => {
    if (!currentUser) return;
    setUsers(prev => ({ ...prev, [currentUser]: { ...prev[currentUser], notes: newNotes } }));
  }, [currentUser]);

  const handleRefreshAdmin = useCallback(async () => {
      if (currentUser === 'arihant') {
          const data = await getGlobalUsers();
          setGlobalUsers(data);
      }
  }, [currentUser]);

  // --- DERIVED DATA ---
  const userProfile = currentUser ? users[currentUser] : undefined;
  const currentAcademicSchedule = userProfile?.academicSchedule || { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
  const currentDayName = DAYS_OF_WEEK[currentDayIndex];
  const currentSlots = userProfile?.schedule?.[currentDayName] || [];

  // Helper for Widget Mode Data
  const getWidgetData = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const active = currentSlots.find(s => {
          if (!s?.timeRange) return false;
          const match = s.timeRange.match(/(\d{1,2}):(\d{2})\s?([AP]M)\s?-\s?(\d{1,2}):(\d{2})\s?([AP]M)/i);
          if (!match) return false;
          const start = parseTime(match[0].split('-')[0]);
          const end = parseTime(match[0].split('-')[1]);
          return currentMinutes >= start && currentMinutes < end;
      });

      const next = currentSlots.find(s => {
          if (!s?.timeRange) return false;
          const parts = s.timeRange.split('-');
          if (parts.length === 0) return false;
          const start = parseTime(parts[0]);
          return start > currentMinutes;
      });

      const notes = Array.isArray(userProfile?.notes) ? userProfile.notes : [];
      const activeNote = notes.filter(n => !n.isCompleted).sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0];

      return { active, next, activeNote };
  };

  const viewTabs = useMemo(() => [
    { id: 'daily', label: 'Daily' },
    { id: 'notes', label: 'Archive' },
    { id: 'weekly', label: 'Chronicle' },
    { id: 'academic', label: 'Classes' },
    { id: 'hydration', label: 'Hydration' },
    { id: 'profile', label: 'Profile' },
    ...(currentUser === 'arihant' ? [{ id: 'admin', label: 'Admin' }] : [])
  ], [currentUser]);

  const dayTabs = useMemo(() => DAYS_OF_WEEK.map((d, i) => ({ id: i.toString(), label: d.substring(0, 3) })), []);

  if (!isClient) return null;

  return (
    <div key="main-app" className="relative min-h-screen font-sans text-slate-200 overflow-x-hidden selection:bg-cyan-500/30">
      
      <GlossyBackground />

      <AnimatePresence>
        {isLoggingOut && <LogoutLoader />}
      </AnimatePresence>

      <AnimatePresence>
        {isWidgetMode && userProfile && (
            <CompactWidget 
                currentSlot={getWidgetData().active}
                nextSlot={getWidgetData().next}
                activeNote={getWidgetData().activeNote}
                waterConfig={userProfile.waterConfig}
                onExit={() => {
                    if (window.opener) { window.close(); } else { setIsWidgetMode(false); }
                }}
                onToggleSlot={(id) => handleToggleSlot(currentDayName, id)}
                onToggleWater={handleToggleWater}
            />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showWelcome ? (
            <WelcomeLoader key="welcome-loader" onComplete={() => setShowWelcome(false)} />
        ) : (
            <motion.div 
               key="main-content"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: "easeOut" }}
               className={isWidgetMode ? 'hidden' : 'block'}
            >
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
                            preferences={userProfile.preferences}
                        />
                        )}

                        <motion.nav 
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="fixed top-4 left-2 right-2 sm:left-4 sm:right-4 z-50 animate-float-slow will-change-transform"
                        >
                            <div className="max-w-5xl mx-auto">
                                <div className="relative floating-glass rounded-[2rem] p-3 sm:p-4 group">
                                    <div className="flex items-center justify-between mb-4 sm:mb-5 relative z-50 px-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-white/20 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-white/20 animate-pulse-slow rounded-full" />
                                                <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white relative z-10" />
                                            </div>
                                            <span className="text-lg sm:text-xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">ORBIT</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/5 mr-2">
                                                {isSyncing ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 text-cyan-500 animate-spin" />
                                                        <span className="text-[9px] font-mono text-cyan-500 uppercase">Syncing</span>
                                                    </>
                                                ) : syncError ? (
                                                    <>
                                                        <AlertTriangle className="w-3 h-3 text-red-500" />
                                                        <span className="text-[9px] font-mono text-red-500 uppercase">Offline</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Cloud className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-[9px] font-mono text-emerald-500 uppercase">Online</span>
                                                    </>
                                                )}
                                            </div>

                                            {userProfile?.preferences && (
                                                <NotificationControl 
                                                    preferences={userProfile.preferences} 
                                                    onUpdate={(prefs) => handleUpdateUser({ preferences: prefs as any })} 
                                                />
                                            )}
                                            
                                            <button 
                                                onClick={() => { playOrbitSound('delete'); handleLogout(); }}
                                                className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95 group relative"
                                                title="Disconnect"
                                            >
                                                <LogOut className="w-4 h-4 relative z-10" />
                                                <div className="absolute inset-0 bg-red-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>

                                            <button onClick={() => setViewMode('profile')} className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center hover:bg-cyan-500 hover:text-white transition-all overflow-hidden relative p-0">
                                                {userProfile?.avatar ? (
                                                    <img src={userProfile.avatar} alt="User" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserCircle className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative z-0 flex justify-center">
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

                        <motion.main 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 0.8 }}
                            className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 pt-40 sm:pt-48 pb-24 transform-gpu"
                        >
                            <MobileHUD username={currentUser} avatar={userProfile?.avatar} />

                            {viewMode === 'daily' && (
                            <div className="mb-8 sm:mb-10 flex justify-center animate-float-medium float-delay-2 will-change-transform">
                                <LiquidTabs 
                                    tabs={dayTabs} 
                                    activeId={currentDayIndex.toString()} 
                                    onChange={(id) => setCurrentDayIndex(parseInt(id))} 
                                    layoutIdPrefix="day-selector" 
                                    variant="scrollable"
                                />
                            </div>
                            )}

                            <div className="animate-float-fast float-delay-3 will-change-transform">
                                <Suspense fallback={<LoadingFallback />}>
                                {viewMode === 'daily' && userProfile ? (
                                    <DailyView 
                                        dayName={currentDayName} 
                                        slots={currentSlots} 
                                        username={currentUser}
                                        onToggleSlot={handleToggleSlot}
                                        onAddSlot={(slot) => handleAddOrEditSlot(currentDayName, slot)}
                                        onRemoveSlot={(id) => handleRemoveSlot(currentDayName, id)}
                                    />
                                ) : viewMode === 'notes' && userProfile ? (
                                    <NotesView 
                                        notes={userProfile.notes || []}
                                        onUpdateNotes={handleUpdateNotes}
                                    />
                                ) : viewMode === 'weekly' && userProfile ? (
                                    <WeeklyReport 
                                        schedule={userProfile.schedule} 
                                        lastWeekStats={userProfile.lastWeekStats}
                                        reportArchive={userProfile.reportArchive || []}
                                        dailyStats={userProfile.dailyStats || {}} // Pass history
                                    />
                                ) : viewMode === 'academic' && userProfile ? (
                                    <AcademicView 
                                        schedule={currentAcademicSchedule}
                                        onAddClass={() => {}} 
                                        onEditClass={() => {}}
                                        onDeleteClass={() => {}}
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
                                    onExportData={() => {}}
                                    onForceSync={() => {}}
                                    lastSyncTime={lastSyncTime}
                                    isSyncing={isSyncing}
                                    onInstallApp={handleInstallApp}
                                    canInstall={!!installPrompt}
                                    onToggleWidgetMode={() => setIsWidgetMode(true)}
                                    />
                                ) : (
                                    <AdminView 
                                        users={globalUsers} 
                                        onRefresh={handleRefreshAdmin}
                                    />
                                )}
                                </Suspense>
                            </div>
                        </motion.main>
                    </>
                )}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
