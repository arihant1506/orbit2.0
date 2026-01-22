
import React, { useState, useEffect, useRef } from 'react';
import { ScheduleSlot, UniversitySchedule, WeekSchedule, WaterConfig, OrbitNotification } from '../types';
import { Bell, Clock, Droplet, GraduationCap, ArrowRight, Zap, X } from 'lucide-react';

interface NotificationSystemProps {
  schedule: WeekSchedule;
  academicSchedule: UniversitySchedule;
  waterConfig?: WaterConfig;
  dayName: string;
}

// --- UTILS ---
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

const getWaterSlots = (dailyGoal: number) => {
    const glassSize = 0.5; 
    const totalSlotsNeeded = Math.ceil(dailyGoal / glassSize);
    const slots = [];
    slots.push({ id: 'water-wake', time: '07:30 AM', label: 'Morning Flush' });
    
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
       slots.push({ id: `water-${i}`, time: timeStr, label: 'Hydration Cycle' });
    }
    return slots;
};

// --- SYSTEM NOTIFICATION TRIGGER ---
const sendSystemNotification = async (title: string, body: string, tag: string) => {
    if (Notification.permission === 'granted') {
        try {
            // Try Service Worker first (Best for Mobile Background)
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                if (reg && reg.showNotification) {
                    await reg.showNotification(title, {
                        body,
                        icon: 'https://cdn-icons-png.flaticon.com/512/3665/3665939.png', // Generic Planet Icon
                        badge: 'https://cdn-icons-png.flaticon.com/512/3665/3665939.png',
                        vibrate: [200, 100, 200, 100, 200],
                        tag: tag,
                        renotify: true,
                        requireInteraction: true // Keeps it in system tray until interaction
                    } as any);
                    return;
                }
            }
            // Fallback for Desktop/Non-SW
            new Notification(title, { 
                body, 
                icon: 'https://cdn-icons-png.flaticon.com/512/3665/3665939.png',
                tag 
            });
        } catch (e) {
            console.error("Notification failed", e);
        }
    }
};

// --- SOUND FX ---
const playAlert = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    
    // Sci-fi "Ping"
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.3);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.start(t);
    osc.stop(t + 0.3);
};

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ schedule, academicSchedule, waterConfig, dayName }) => {
  const [activeNotifications, setActiveNotifications] = useState<OrbitNotification[]>([]);
  const notifiedRef = useRef<Set<string>>(new Set());
  
  // Logic Loop
  useEffect(() => {
    const checkEvents = () => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const LOOKAHEAD_MINUTES = 20; // Show notification 20 mins before
        
        const newNotifications: OrbitNotification[] = [];

        // 1. CHECK DAILY TASKS
        const todaysTasks = schedule[dayName] || [];
        todaysTasks.forEach(task => {
            if (task.isCompleted) return;
            const startMin = parseTime(task.timeRange);
            if (startMin === -1) return;

            const diff = startMin - currentMinutes;

            // Trigger window: 0 to 20 mins before
            if (diff > 0 && diff <= LOOKAHEAD_MINUTES) {
                const uniqueId = `task-${dayName}-${task.id}`;
                const progress = Math.min(100, Math.max(0, ((LOOKAHEAD_MINUTES - diff) / LOOKAHEAD_MINUTES) * 100));
                
                newNotifications.push({
                    id: uniqueId,
                    type: 'task',
                    title: task.title,
                    subtitle: `Routine Protocol • ${diff}m to start`,
                    startTimeStr: task.timeRange.split('-')[0].trim(),
                    minutesUntil: diff,
                    progress: progress,
                    accentColor: 'text-amber-500 border-amber-500/50 bg-amber-500/10'
                });
                
                // Sound logic (play once when it first enters the window)
                if (!notifiedRef.current.has(uniqueId)) {
                    playAlert();
                    sendSystemNotification(
                        `PROTOCOL: ${task.title}`, 
                        `Time: ${task.timeRange.split('-')[0].trim()} | Starting in ${diff} minutes`,
                        uniqueId
                    );
                    notifiedRef.current.add(uniqueId);
                }
            }
        });

        // 2. CHECK ACADEMIC CLASSES
        const todaysClasses = academicSchedule[dayName] || [];
        todaysClasses.forEach(cls => {
            const startMin = parseTime(cls.startTime);
            if (startMin === -1) return;
            const diff = startMin - currentMinutes;

            if (diff > 0 && diff <= LOOKAHEAD_MINUTES) {
                const uniqueId = `class-${dayName}-${cls.id}`;
                const progress = Math.min(100, Math.max(0, ((LOOKAHEAD_MINUTES - diff) / LOOKAHEAD_MINUTES) * 100));

                newNotifications.push({
                    id: uniqueId,
                    type: 'class',
                    title: cls.subject,
                    subtitle: `${cls.type} @ ${cls.venue} • ${diff}m to start`,
                    startTimeStr: cls.startTime,
                    minutesUntil: diff,
                    progress: progress,
                    accentColor: 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10'
                });

                if (!notifiedRef.current.has(uniqueId)) {
                    playAlert();
                    sendSystemNotification(
                        `ACADEMIC ALERT: ${cls.subject}`, 
                        `Venue: ${cls.venue} | Starting in ${diff} minutes`,
                        uniqueId
                    );
                    notifiedRef.current.add(uniqueId);
                }
            }
        });

        // 3. CHECK WATER
        if (waterConfig) {
            const slots = getWaterSlots(waterConfig.dailyGoal);
            slots.forEach((slot, idx) => {
                const targetMin = parseTime(slot.time);
                const diff = targetMin - currentMinutes;
                
                // Water is simpler: 10 min warning
                if (diff > 0 && diff <= 10) {
                     // Check if already done? (Simplified: check config progress)
                     if (!waterConfig.progress.includes(slot.id)) {
                         const uniqueId = `water-${dayName}-${slot.id}`;
                         const progress = Math.min(100, Math.max(0, ((10 - diff) / 10) * 100));

                         newNotifications.push({
                            id: uniqueId,
                            type: 'water',
                            title: slot.label,
                            subtitle: `Hydration Required • ${diff}m`,
                            startTimeStr: slot.time,
                            minutesUntil: diff,
                            progress: progress,
                            accentColor: 'text-blue-500 border-blue-500/50 bg-blue-500/10'
                         });

                         if (!notifiedRef.current.has(uniqueId)) {
                             playAlert();
                             sendSystemNotification(
                                 `HYDRATION REMINDER`, 
                                 `${slot.label} due at ${slot.time}`,
                                 uniqueId
                             );
                             notifiedRef.current.add(uniqueId);
                         }
                     }
                }
            });
        }

        // Sort by urgency (lowest minutesUntil first)
        setActiveNotifications(newNotifications.sort((a, b) => a.minutesUntil - b.minutesUntil));
    };

    const interval = setInterval(checkEvents, 10000); // Check every 10s
    checkEvents(); // Initial check

    return () => clearInterval(interval);
  }, [schedule, academicSchedule, waterConfig, dayName]);


  if (activeNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-[60] flex flex-col gap-3 w-full max-w-[320px] sm:max-w-sm pointer-events-none">
       {activeNotifications.map((notif) => (
           <div 
             key={notif.id}
             className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-tech-reveal pointer-events-auto group transition-all hover:scale-105 ${notif.type === 'class' ? 'bg-slate-900/90 border-cyan-500/30' : notif.type === 'task' ? 'bg-slate-900/90 border-amber-500/30' : 'bg-slate-900/90 border-blue-500/30'}`}
           >
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
              <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
              
              <div className="flex items-start gap-3 relative z-10">
                  {/* Icon Box */}
                  <div className={`p-3 rounded-xl border ${notif.accentColor} shadow-[0_0_15px_rgba(0,0,0,0.2)] flex-shrink-0 relative`}>
                      {notif.type === 'class' && <GraduationCap className="w-5 h-5 animate-pulse" />}
                      {notif.type === 'task' && <Clock className="w-5 h-5 animate-pulse" />}
                      {notif.type === 'water' && <Droplet className="w-5 h-5 animate-pulse" />}
                      
                      {/* Spinner for urgency */}
                      <div className="absolute inset-0 border-t-2 border-current rounded-xl animate-spin-slow opacity-50" />
                  </div>

                  <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <h4 className="text-sm font-black italic text-white uppercase tracking-tight truncate leading-tight">{notif.title}</h4>
                         <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">{notif.startTimeStr}</span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1 truncate">{notif.subtitle}</p>
                      
                      {/* Live Timer Text */}
                      <div className="mt-2 flex items-center gap-1.5">
                          <Zap className={`w-3 h-3 ${notif.type === 'class' ? 'text-cyan-500' : 'text-amber-500'}`} />
                          <span className="text-[9px] font-bold uppercase text-white">Starting in <span className="font-mono text-lg mx-1">{notif.minutesUntil}</span> min</span>
                      </div>
                  </div>
                  
                  <button 
                    onClick={() => setActiveNotifications(prev => prev.filter(n => n.id !== notif.id))}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                     <X className="w-4 h-4" />
                  </button>
              </div>

              {/* Progress Bar Container */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                  <div 
                    className={`h-full transition-all duration-1000 ease-linear ${notif.type === 'class' ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : notif.type === 'task' ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'}`}
                    style={{ width: `${notif.progress}%` }}
                  >
                      {/* Shimmer on bar */}
                      <div className="absolute inset-0 bg-white/50 w-full h-full animate-[shimmer_1s_infinite]" />
                  </div>
              </div>
           </div>
       ))}
    </div>
  );
};
