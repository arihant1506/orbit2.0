
import React, { useState, useEffect } from 'react';
import { DailyView } from './components/DailyView';
import { WeeklyReport } from './components/WeeklyReport';
import { AdminView } from './components/AdminView';
import { Auth } from './components/Auth';
import { INITIAL_SCHEDULE } from './constants';
import { WeekSchedule, ThemeMode, Category, UserProfile, ScheduleSlot, WeeklyStats } from './types';
import { Radio, Sun, Moon, Monitor, LogOut, ShieldAlert, Clock } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getMondayOfCurrentWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
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
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('orbit_active_user'));
  const [users, setUsers] = useState<Record<string, UserProfile>>(() => {
    const saved = localStorage.getItem('orbit_users');
    return saved ? JSON.parse(saved) : {};
  });

  const [currentDayIndex, setCurrentDayIndex] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; 
  });

  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'admin'>('daily');
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('orbit_theme') as ThemeMode) || 'dark');
  const [isClient, setIsClient] = useState(false);

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

  const handleAuthSuccess = (username: string, password?: string) => {
    const normalizedUsername = username.toLowerCase();
    const existingUser = users[normalizedUsername];

    if (!existingUser) {
        // IMPORTANT: Ordinary users start with EMPTY schedule. Only 'arihant' gets the template.
        const emptySchedule: WeekSchedule = {};
        DAYS_OF_WEEK.forEach(day => emptySchedule[day] = []);
        
        const newProfile: UserProfile = {
            username: normalizedUsername,
            password: password,
            joinedDate: new Date().toISOString(),
            schedule: normalizedUsername === 'arihant' ? JSON.parse(JSON.stringify(INITIAL_SCHEDULE)) : emptySchedule,
            lastResetDate: getMondayOfCurrentWeek()
        };
        setUsers(prev => ({ ...prev, [normalizedUsername]: newProfile }));
    }
    
    setCurrentUser(normalizedUsername);
    localStorage.setItem('orbit_active_user', normalizedUsername);
    setViewMode('daily');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('orbit_active_user');
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
           const getMins = (str: string) => {
             const match = str.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);
             if (!match) return 0;
             let [_, h, m, p] = match;
             let hours = parseInt(h);
             if (p.toUpperCase() === 'PM' && hours !== 12) hours += 12;
             if (p.toUpperCase() === 'AM' && hours === 12) hours = 0;
             return hours * 60 + parseInt(m);
           };
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

  if (!isClient) return null;

  if (!currentUser) {
    return (
      <div className="relative min-h-screen bg-orbit-lightBg dark:bg-orbit-bg flex items-center justify-center p-4 transition-colors duration-500">
        <Auth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  const userProfile = users[currentUser];
  const isOwner = currentUser.toLowerCase() === 'arihant';
  const currentDayName = DAYS_OF_WEEK[currentDayIndex];
  const currentSlots = userProfile.schedule[currentDayName] || [];

  return (
    <div className="relative min-h-screen bg-orbit-lightBg dark:bg-orbit-bg font-sans text-slate-800 dark:text-slate-200 transition-colors duration-500 overflow-x-hidden">
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

            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-full border border-slate-200 dark:border-white/10">
              <button onClick={() => setViewMode('daily')} className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase tracking-widest transition-all ${viewMode === 'daily' ? 'bg-white dark:bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Daily</button>
              <button onClick={() => setViewMode('weekly')} className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase tracking-widest transition-all ${viewMode === 'weekly' ? 'bg-white dark:bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Report</button>
              {isOwner && <button onClick={() => setViewMode('admin')} className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase tracking-widest transition-all ${viewMode === 'admin' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Admin</button>}
            </div>
            
            <button onClick={handleLogout} className="p-2 sm:p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all">
               <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-3 sm:px-4">
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
        ) : (
          <AdminView users={users} />
        )}
      </main>
    </div>
  );
};

export default App;
