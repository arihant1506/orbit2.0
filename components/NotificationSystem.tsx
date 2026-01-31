
import React, { useState, useEffect, useRef } from 'react';
import { ScheduleSlot, UniversitySchedule, WeekSchedule, WaterConfig, OrbitNotification, UserPreferences } from '../types';
import { Bell, Clock, Droplet, GraduationCap, Zap, X, AlertTriangle, Activity, ChevronRight, Timer } from 'lucide-react';
import { playOrbitSound } from '../utils/audio';

interface NotificationSystemProps {
  schedule: WeekSchedule;
  academicSchedule: UniversitySchedule;
  waterConfig?: WaterConfig;
  dayName: string;
  preferences?: UserPreferences;
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
const sendSystemNotification = async (title: string, body: string, tag: string, urgent: boolean = false) => {
    // Safety check for Environment
    if (typeof Notification === 'undefined') return;

    if (Notification.permission !== 'granted') {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;
        } catch (e) {
            return;
        }
    }

    try {
        // Service Worker (Mobile Background Support)
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
                await reg.showNotification(title, {
                    body,
                    icon: 'https://cdn-icons-png.flaticon.com/512/3665/3665939.png', // Fallback icon
                    badge: 'https://cdn-icons-png.flaticon.com/512/3665/3665939.png',
                    vibrate: urgent ? [500, 100, 500, 100, 500] : [200, 100, 200],
                    tag: tag, // Prevents duplicate stacking
                    renotify: true,
                    requireInteraction: urgent,
                    data: { url: window.location.href }
                } as any);
                return;
            }
        }
        
        // Desktop Fallback - Enforce try/catch strongly to avoid "Illegal constructor"
        try {
            new Notification(title, { 
                body, 
                icon: 'https://cdn-icons-png.flaticon.com/512/3665/3665939.png',
                tag,
                requireInteraction: urgent 
            });
        } catch (innerError) {
            console.warn("Desktop notification constructor failed:", innerError);
        }
    } catch (e) {
        console.error("Notification failed", e);
    }
};

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ schedule, academicSchedule, waterConfig, dayName, preferences }) => {
  const [activeNotifications, setActiveNotifications] = useState<OrbitNotification[]>([]);
  
  // Track triggered alerts to prevent duplicate sound/system-notifs
  // Format: "TYPE-ID-THRESHOLD" (e.g. "class-math101-15")
  const alertHistory = useRef<Set<string>>(new Set());

  // Track dismissed visual notifications to prevent reappearance in app
  const dismissedNotifications = useRef<Set<string>>(new Set());
  
  // Logic Loop
  useEffect(() => {
    // Safety check before requesting permission
    if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    }

    const checkEvents = () => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const VISUAL_WINDOW = 20; // Show in app 20 minutes before
        const newNotifications: OrbitNotification[] = [];

        // Check if preferences exist, otherwise default to true
        const enableWater = preferences?.notifications?.water ?? true;
        const enableSchedule = preferences?.notifications?.schedule ?? true;
        const enableAcademic = preferences?.notifications?.academic ?? true;

        const processEvent = (
            id: string, 
            title: string, 
            subtitle: string, 
            startTime: string, 
            type: 'task' | 'class' | 'water'
        ) => {
            const startMin = parseTime(startTime);
            if (startMin === -1) return;
            
            const diff = startMin - currentMinutes;
            const uniqueId = `${type}-${dayName}-${id}`;

            // --- 1. ACADEMIC SPECIFIC LOGIC (15m and 5m) ---
            if (type === 'class' && enableAcademic) {
                // 15 Minute Warning
                if (diff <= 15 && diff > 5 && !alertHistory.current.has(`${uniqueId}-15`)) {
                    playOrbitSound('bell_normal');
                    sendSystemNotification(
                        `ACADEMIC WARNING: ${title}`, 
                        `T-Minus 15 Minutes. Venue: ${subtitle}. Prepare visuals.`,
                        `${uniqueId}-15`,
                        false
                    );
                    alertHistory.current.add(`${uniqueId}-15`);
                }
                
                // 5 Minute CRITICAL Warning
                if (diff <= 5 && diff > 0 && !alertHistory.current.has(`${uniqueId}-5`)) {
                    playOrbitSound('alarm_critical');
                    sendSystemNotification(
                        `CRITICAL START: ${title}`, 
                        `T-Minus 5 Minutes! Movement required immediately.`,
                        `${uniqueId}-5`,
                        true
                    );
                    alertHistory.current.add(`${uniqueId}-5`);
                    // Mark 15 as done to avoid race conditions
                    alertHistory.current.add(`${uniqueId}-15`);
                }
            }

            // --- 2. GENERAL SCHEDULE & WATER LOGIC ---
            // Trigger once at 10 minutes for tasks/water
            if (type !== 'class') {
                if (diff <= 10 && diff > 0 && !alertHistory.current.has(`${uniqueId}-10`)) {
                    // Check granular preference
                    const shouldNotify = (type === 'water' && enableWater) || (type === 'task' && enableSchedule);
                    
                    if (shouldNotify) {
                        playOrbitSound('bell_normal');
                        sendSystemNotification(
                            type === 'water' ? `HYDRATION: ${title}` : `PROTOCOL: ${title}`, 
                            type === 'water' ? 'Bio-rhythm requires intake.' : `Upcoming: ${subtitle}`,
                            `${uniqueId}-10`,
                            false
                        );
                        alertHistory.current.add(`${uniqueId}-10`);
                    }
                }
            }

            // --- 3. IN-APP VISUAL NOTIFICATION (ALL TYPES) ---
            // Only show if within visual window and not dismissed
            if (diff <= VISUAL_WINDOW && diff > -5 && !dismissedNotifications.current.has(uniqueId)) {
                
                // Colors based on Type & Urgency
                let accent = '';
                if (type === 'class') accent = diff <= 5 ? 'red' : 'cyan';
                else if (type === 'task') accent = diff <= 5 ? 'pink' : 'amber';
                else accent = 'blue';

                const progress = Math.min(100, Math.max(0, ((VISUAL_WINDOW - diff) / VISUAL_WINDOW) * 100));

                newNotifications.push({
                    id: uniqueId,
                    type,
                    title,
                    subtitle,
                    startTimeStr: startTime,
                    minutesUntil: diff,
                    progress,
                    accentColor: accent
                });
            }
        };

        // LOOP: DAILY TASKS
        (schedule[dayName] || []).forEach(task => {
            if (!task.isCompleted) {
                processEvent(task.id, task.title, task.category, task.timeRange.split('-')[0].trim(), 'task');
            }
        });

        // LOOP: ACADEMIC CLASSES
        (academicSchedule[dayName] || []).forEach(cls => {
            processEvent(cls.id, cls.subject, cls.venue, cls.startTime, 'class');
        });

        // LOOP: WATER
        if (waterConfig) {
            getWaterSlots(waterConfig.dailyGoal).forEach(slot => {
                if (!waterConfig.progress.includes(slot.id)) {
                    processEvent(slot.id, slot.label, 'Bio-Maintenance', slot.time, 'water');
                }
            });
        }

        // Sort: Critical (low time) first
        setActiveNotifications(newNotifications.sort((a, b) => a.minutesUntil - b.minutesUntil));
    };

    const interval = setInterval(checkEvents, 10000); // Check every 10s
    checkEvents(); // Initial check

    return () => clearInterval(interval);
  }, [schedule, academicSchedule, waterConfig, dayName, preferences]);


  if (activeNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] flex flex-col gap-4 w-full max-w-[340px] pointer-events-none perspective-1000">
       {activeNotifications.map((notif, idx) => {
           const isCritical = notif.minutesUntil <= 5 && notif.minutesUntil > 0;
           
           // Style Config based on type & urgency
           let colors = {
               bg: 'bg-slate-900/90',
               border: 'border-slate-700',
               glow: 'shadow-none',
               text: 'text-slate-100',
               iconBg: 'bg-slate-800',
               iconColor: 'text-slate-400',
               bar: 'bg-slate-600'
           };

           if (notif.accentColor === 'red') { // Critical Class
               colors = { bg: 'bg-red-950/90', border: 'border-red-500/50', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.4)]', text: 'text-red-100', iconBg: 'bg-red-500/20', iconColor: 'text-red-500', bar: 'bg-red-500' };
           } else if (notif.accentColor === 'pink') { // Critical Task
               colors = { bg: 'bg-pink-950/90', border: 'border-pink-500/50', glow: 'shadow-[0_0_30px_rgba(236,72,153,0.4)]', text: 'text-pink-100', iconBg: 'bg-pink-500/20', iconColor: 'text-pink-500', bar: 'bg-pink-500' };
           } else if (notif.accentColor === 'cyan') { // Normal Class
               colors = { bg: 'bg-slate-900/90', border: 'border-cyan-500/30', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]', text: 'text-cyan-50', iconBg: 'bg-cyan-500/10', iconColor: 'text-cyan-400', bar: 'bg-cyan-500' };
           } else if (notif.accentColor === 'amber') { // Normal Task
               colors = { bg: 'bg-slate-900/90', border: 'border-amber-500/30', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]', text: 'text-amber-50', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500', bar: 'bg-amber-500' };
           } else { // Water/Other
               colors = { bg: 'bg-slate-900/90', border: 'border-blue-500/30', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]', text: 'text-blue-50', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500', bar: 'bg-blue-500' };
           }

           return (
             <div 
               key={notif.id}
               className={`relative pointer-events-auto transform transition-all duration-500 animate-tech-reveal hover:scale-[1.02] active:scale-95 group ${isCritical ? 'translate-x-[-10px]' : ''}`}
               style={{ zIndex: 100 - idx }}
             >
                 {/* HOLOGRAPHIC CARD CONTAINER */}
                 <div className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border ${colors.bg} ${colors.border} ${colors.glow} p-0`}>
                     
                     {/* 1. Animated Gradient Border Overlay */}
                     <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer" />
                     {isCritical && <div className="absolute inset-0 z-0 bg-red-500/10 animate-pulse" />}

                     <div className="relative z-10 p-4">
                         <div className="flex items-start gap-3">
                             {/* ICON MODULE */}
                             <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 ${colors.iconBg} ${colors.iconColor}`}>
                                 {isCritical ? <AlertTriangle className="w-6 h-6 animate-ping absolute opacity-30" /> : null}
                                 {notif.type === 'class' && <GraduationCap className={`w-6 h-6 ${isCritical ? 'animate-bounce' : ''}`} />}
                                 {notif.type === 'task' && <Clock className={`w-6 h-6 ${isCritical ? 'animate-spin-slow' : ''}`} />}
                                 {notif.type === 'water' && <Droplet className={`w-6 h-6 ${isCritical ? 'animate-bounce' : ''}`} />}
                                 
                                 {/* Tech Ring */}
                                 <svg className="absolute inset-0 w-full h-full p-0.5 animate-spin-slow opacity-50">
                                     <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                                 </svg>
                             </div>

                             {/* CONTENT MODULE */}
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start mb-0.5">
                                     <h4 className={`text-sm font-black italic uppercase tracking-wider truncate leading-tight ${colors.text} ${isCritical ? 'animate-pulse' : ''}`}>
                                         {notif.title}
                                     </h4>
                                     {isCritical && <span className="flex-shrink-0 text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded animate-pulse">CRITICAL</span>}
                                 </div>
                                 
                                 <div className="flex items-center gap-2 mb-2">
                                     <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest truncate max-w-[140px]">{notif.subtitle}</span>
                                     <div className="h-px flex-1 bg-white/10" />
                                     <span className={`text-xs font-mono font-bold ${colors.iconColor}`}>{notif.startTimeStr}</span>
                                 </div>

                                 {/* COUNTDOWN MODULE */}
                                 <div className="flex items-center justify-between gap-3">
                                     <div className="flex items-center gap-1.5">
                                         {isCritical ? <Timer className={`w-3 h-3 ${colors.iconColor} animate-pulse`} /> : <Zap className={`w-3 h-3 ${colors.iconColor}`} />}
                                         <span className="text-[10px] font-bold uppercase text-slate-300">
                                             {notif.minutesUntil > 0 ? (
                                                 <>T-Minus <span className={`text-lg font-black font-mono mx-1 ${colors.text}`}>{notif.minutesUntil}</span> MIN</>
                                             ) : (
                                                 <span className="text-emerald-400">ACTIVE NOW</span>
                                             )}
                                         </span>
                                     </div>
                                     <button 
                                        onClick={() => {
                                            // Permanently dismiss for this session/event
                                            dismissedNotifications.current.add(notif.id);
                                            // Immediately remove from UI
                                            setActiveNotifications(prev => prev.filter(n => n.id !== notif.id));
                                        }}
                                        className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                                     >
                                         <X className="w-4 h-4" />
                                     </button>
                                 </div>
                             </div>
                         </div>
                     </div>

                     {/* PROGRESS BAR LOADER */}
                     <div className="relative h-1 w-full bg-black/50">
                         <div 
                            className={`h-full ${colors.bar} shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-linear relative overflow-hidden`}
                            style={{ width: `${notif.progress}%` }}
                         >
                            <div className="absolute inset-0 bg-white/50 w-full h-full animate-shimmer" />
                         </div>
                     </div>
                 </div>
                 
                 {/* DECORATIVE GLOW UNDERNEATH */}
                 {isCritical && <div className="absolute -inset-4 bg-red-500/20 blur-2xl -z-10 animate-pulse" />}
             </div>
           );
       })}
    </div>
  );
};
