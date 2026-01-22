
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ScheduleSlot, Category } from '../types';
import { Check, Zap, Terminal, Cpu, Palette, Activity, Moon, Anchor, Plus, X, Trash2, Edit3, Scan, ShieldCheck, ChevronUp, ChevronDown, Flame, Volume2, VolumeX, Headphones, Waves } from 'lucide-react';

interface DailyViewProps {
  dayName: string;
  slots: ScheduleSlot[];
  username: string;
  onToggleSlot: (day: string, slotId: string) => void;
  onAddSlot: (slot: ScheduleSlot) => void;
  onRemoveSlot: (slotId: string) => void;
}

const THEME_CONFIG: Record<Category, any> = {
  Physical: { 
    glass: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    activeBorder: 'border-orange-500',
    text: 'text-orange-100',
    subText: 'text-orange-200/60',
    icon: 'text-orange-400',
    glow: 'shadow-[0_8px_32px_rgba(249,115,22,0.2)]',
    tint: '#f97316'
  },
  Academic: { 
    glass: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    activeBorder: 'border-cyan-500',
    text: 'text-cyan-100',
    subText: 'text-cyan-200/60',
    icon: 'text-cyan-400',
    glow: 'shadow-[0_8px_32px_rgba(6,182,212,0.2)]',
    tint: '#22d3ee'
  },
  Coding: { 
    glass: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    activeBorder: 'border-emerald-500',
    text: 'text-emerald-100',
    subText: 'text-emerald-200/60',
    icon: 'text-emerald-400',
    glow: 'shadow-[0_8px_32px_rgba(16,185,129,0.2)]',
    tint: '#10b981'
  },
  Creative: { 
    glass: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/30',
    activeBorder: 'border-fuchsia-500',
    text: 'text-fuchsia-100',
    subText: 'text-fuchsia-200/60',
    icon: 'text-fuchsia-400',
    glow: 'shadow-[0_8px_32px_rgba(217,70,239,0.2)]',
    tint: '#d946ef'
  },
  Rest: { 
    glass: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    activeBorder: 'border-indigo-500',
    text: 'text-indigo-100',
    subText: 'text-indigo-200/60',
    icon: 'text-indigo-400',
    glow: 'shadow-[0_8px_32px_rgba(99,102,241,0.2)]',
    tint: '#6366f1'
  },
  Logistics: { 
    glass: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    activeBorder: 'border-slate-500',
    text: 'text-slate-200',
    subText: 'text-slate-400/60',
    icon: 'text-slate-400',
    glow: 'shadow-[0_8px_32px_rgba(148,163,184,0.1)]',
    tint: '#94a3b8'
  },
};

// --- SOUND SYSTEM ---
const playSound = (type: 'tick' | 'open' | 'save' | 'delete' | 'complete' | 'fanfare' | 'type') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  switch (type) {
    case 'tick':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc.start(t);
      osc.stop(t + 0.03);
      break;
    case 'open':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.linearRampToValueAtTime(600, t + 0.2);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
      break;
    case 'save':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.linearRampToValueAtTime(1200, t + 0.1);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
      break;
    case 'delete':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.linearRampToValueAtTime(50, t + 0.3);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
      break;
    case 'complete':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, t);
      osc.frequency.exponentialRampToValueAtTime(2500, t + 0.08);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.start(t);
      osc.stop(t + 0.08);
      break;
    case 'fanfare':
      // Simplified fanfare for 100%
      [440, 554, 659, 880].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, t + i * 0.1);
        g.gain.setValueAtTime(0.05, t + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.5);
        o.start(t + i * 0.1);
        o.stop(t + i * 0.1 + 0.5);
      });
      break;
  }
};

// --- AMBIENT ENGINE (PROCEDURAL AUDIO) ---
class AmbientEngine {
    ctx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    activeNodes: AudioNode[] = [];
    currentCategory: string | null = null;

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    stop() {
        if (!this.ctx || !this.masterGain) return;
        const t = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(t);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
        this.masterGain.gain.linearRampToValueAtTime(0, t + 2); // 2s fade out

        setTimeout(() => {
            this.activeNodes.forEach(n => {
                try { n.disconnect(); (n as any).stop && (n as any).stop(); } catch(e){}
            });
            this.activeNodes = [];
            this.currentCategory = null;
        }, 2000);
    }

    play(category: Category) {
        this.init();
        if (this.currentCategory === category) return;
        
        // Quick Fade Out Old
        const t = this.ctx!.currentTime;
        if (this.currentCategory) {
            this.masterGain!.gain.setValueAtTime(this.masterGain!.gain.value, t);
            this.masterGain!.gain.linearRampToValueAtTime(0, t + 0.5);
            setTimeout(() => {
                this.activeNodes.forEach(n => { try { n.disconnect(); (n as any).stop && (n as any).stop(); } catch(e){} });
                this.activeNodes = [];
                this.startNewSound(category);
            }, 500);
        } else {
            this.startNewSound(category);
        }
    }

    startNewSound(category: Category) {
        if (!this.ctx || !this.masterGain) return;
        this.currentCategory = category;
        const t = this.ctx.currentTime;
        
        // Fade In
        this.masterGain.gain.cancelScheduledValues(t);
        this.masterGain.gain.setValueAtTime(0, t);
        this.masterGain.gain.linearRampToValueAtTime(0.12, t + 2);

        switch(category) {
            case 'Coding': this.genCoding(t); break;
            case 'Academic': this.genAcademic(t); break;
            case 'Physical': this.genPhysical(t); break;
            case 'Rest': this.genRest(t); break;
            default: this.genDrone(t); break;
        }
    }

    createNoise(type: 'white'|'pink'|'brown') {
        if (!this.ctx) return null;
        const size = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for(let i=0; i<size; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5; 
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        return src;
    }

    genCoding(t: number) {
        // Cyberpunk Drone: Detuned Saws
        const osc1 = this.ctx!.createOscillator();
        const osc2 = this.ctx!.createOscillator();
        const filter = this.ctx!.createBiquadFilter();
        
        osc1.type = 'sawtooth'; osc1.frequency.value = 55;
        osc2.type = 'sawtooth'; osc2.frequency.value = 55.5; // Detune
        
        filter.type = 'lowpass'; filter.frequency.value = 400;

        osc1.connect(filter); osc2.connect(filter);
        filter.connect(this.masterGain!);
        
        osc1.start(t); osc2.start(t);
        this.activeNodes.push(osc1, osc2, filter);
    }

    genAcademic(t: number) {
        // Deep Focus: Brown Noise
        const noise = this.createNoise('brown');
        if (!noise) return;
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 150;
        
        noise.connect(filter);
        filter.connect(this.masterGain!);
        noise.start(t);
        this.activeNodes.push(noise, filter);
    }

    genPhysical(t: number) {
        // Heartbeat Pulse
        const osc = this.ctx!.createOscillator();
        const amp = this.ctx!.createGain();
        osc.type = 'triangle'; osc.frequency.value = 50;
        
        // LFO for pulsing
        const lfo = this.ctx!.createOscillator();
        lfo.frequency.value = 1.5; // ~90 BPM
        const lfoGain = this.ctx!.createGain();
        lfoGain.gain.value = 0.5;
        
        lfo.connect(lfoGain);
        lfoGain.connect(amp.gain);
        
        osc.connect(amp);
        amp.connect(this.masterGain!);
        
        osc.start(t); lfo.start(t);
        this.activeNodes.push(osc, amp, lfo, lfoGain);
    }

    genRest(t: number) {
        // Binaural Zen
        const osc1 = this.ctx!.createOscillator();
        const osc2 = this.ctx!.createOscillator();
        
        osc1.type = 'sine'; osc1.frequency.value = 200;
        osc2.type = 'sine'; osc2.frequency.value = 204; // 4Hz Theta beat
        
        const gain = this.ctx!.createGain();
        gain.gain.value = 0.5;

        osc1.connect(gain); osc2.connect(gain);
        gain.connect(this.masterGain!);
        osc1.start(t); osc2.start(t);
        this.activeNodes.push(osc1, osc2, gain);
    }

    genDrone(t: number) {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine'; osc.frequency.value = 60;
        osc.connect(this.masterGain!);
        osc.start(t);
        this.activeNodes.push(osc);
    }
}

const ambientEngine = new AmbientEngine();


const getCategoryIcon = (category: Category) => {
  switch (category) {
    case 'Physical': return <Activity className="w-full h-full" />;
    case 'Academic': return <Cpu className="w-full h-full" />;
    case 'Coding': return <Terminal className="w-full h-full" />;
    case 'Creative': return <Palette className="w-full h-full" />;
    case 'Rest': return <Moon className="w-full h-full" />;
    case 'Logistics': return <Anchor className="w-full h-full" />;
    default: return <Zap className="w-full h-full" />;
  }
};

const getProtocolLabel = (category: Category): string => {
  switch (category) {
    case 'Physical': return 'KINETIC';
    case 'Academic': return 'NEURAL';
    case 'Coding': return 'LOGIC';
    case 'Creative': return 'VISION';
    case 'Rest': return 'STANDBY';
    case 'Logistics': return 'SYSTEM';
    default: return 'GENERAL';
  }
};

const getMinutesFromFormatted = (timeStr: string): number => {
  if (timeStr.toLowerCase().includes('all day')) return -1;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);
  if (!match) return 540; 
  let [_, h, m, p] = match;
  let hours = parseInt(h);
  const minutes = parseInt(m);
  if (p.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (p.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const checkIsActive = (timeRange: string): boolean => {
    if (timeRange.toLowerCase().includes('all day')) return true;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const parts = timeRange.split(' - ').map(p => getMinutesFromFormatted(p.trim()));
    if (parts.length < 2) return false;
    const [start, end] = parts;
    if (start > end) return currentMinutes >= start || currentMinutes < end;
    return currentMinutes >= start && currentMinutes < end;
};

// --- CUSTOM TIME SCROLLER COMPONENT ---
const TimeWheel = ({ value, onChange, max, label }: { value: number, onChange: (v: number) => void, max: number, label: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_HEIGHT = 32; // h-8 = 32px

  // Initial scroll positioning
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = value * ITEM_HEIGHT;
    }
  }, []); // Run once on mount

  // Sync scroll if prop changes externally (re-open modal etc)
  useEffect(() => {
    if (containerRef.current) {
      const current = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT);
      if (current !== value) {
         containerRef.current.scrollTo({ top: value * ITEM_HEIGHT, behavior: 'smooth' });
      }
    }
  }, [value]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
     const target = e.currentTarget;
     const index = Math.round(target.scrollTop / ITEM_HEIGHT);
     
     // Only trigger if changed and within bounds
     if (index !== value && index >= 0 && index < max) {
        onChange(index);
        playSound('tick');
        // Haptic feedback for mobile
        if (navigator.vibrate) navigator.vibrate(10);
     }
  };

  return (
    <div className="flex flex-col items-center group relative w-12 sm:w-16 select-none">
      <span className="text-[9px] text-slate-500 font-mono uppercase mb-2 font-bold tracking-wider">{label}</span>
      
      <div className="relative h-24 w-full">
         {/* Center Highlight Bar (Fixed) */}
         <div className="absolute top-[32px] left-0 right-0 h-8 bg-cyan-500/10 border-y border-cyan-500/30 rounded-sm pointer-events-none z-0" />
         
         {/* Gradient Masks for 3D effect */}
         <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-20" />
         <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-20" />

         {/* Scrollable Container */}
         <div 
           ref={containerRef}
           className="absolute inset-0 overflow-y-auto no-scrollbar snap-y snap-mandatory z-10 py-8"
           onScroll={onScroll}
         >
           {Array.from({ length: max }).map((_, i) => {
             const displayVal = label === 'MIN' ? i.toString().padStart(2, '0') : (i === 0 ? 12 : i);
             const isSelected = value === i;
             return (
                <div 
                  key={i} 
                  onClick={() => {
                     onChange(i);
                     containerRef.current?.scrollTo({ top: i * ITEM_HEIGHT, behavior: 'smooth' });
                     playSound('tick');
                  }}
                  className={`h-8 flex items-center justify-center snap-center cursor-pointer transition-all duration-200 ${
                     isSelected 
                       ? 'font-black text-cyan-500 text-lg scale-110 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]' 
                       : 'text-slate-400 text-xs opacity-40 hover:opacity-70'
                  }`}
                >
                  {displayVal}
                </div>
             )
           })}
         </div>
      </div>
    </div>
  );
};

const determineCategory = (title: string): Category => {
  const t = title.toLowerCase();
  if (t.match(/(gym|workout|run|walk|sleep|breakfast|lunch|dinner|shower|bath|nap)/)) return 'Physical';
  if (t.match(/(code|react|js|ts|python|java|debug|git|develop|build)/)) return 'Coding';
  if (t.match(/(study|read|class|lecture|exam|quiz|learn|math|science)/)) return 'Academic';
  if (t.match(/(design|draw|paint|edit|video|photo|write|music|art)/)) return 'Creative';
  if (t.match(/(relax|chill|game|netflix|movie|tv|rest|break)/)) return 'Rest';
  if (t.match(/(plan|commute|shop|clean|organize|email|meeting)/)) return 'Logistics';
  return 'Logistics';
};

// --- CHRONOMETER HUD ---
const ChronometerHUD = ({ timeRange, isActive, isDone, theme }: { timeRange: string, isActive: boolean, isDone: boolean, theme: any }) => {
  const [startStr, endStr] = timeRange.includes('-') ? timeRange.split('-').map(s => s.trim()) : [timeRange, ''];
  return (
    <div className={`flex flex-row sm:flex-col items-center justify-between sm:justify-center p-4 sm:p-5 w-full sm:w-40 border-b sm:border-b-0 sm:border-r border-white/10 bg-black/30 backdrop-blur-sm rounded-t-3xl sm:rounded-l-3xl sm:rounded-tr-none relative overflow-hidden ${isDone ? 'opacity-40 grayscale' : ''}`}>
        <div className="relative z-10 text-left sm:text-center">
            <div className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest mb-1 opacity-60 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                {isActive ? 'CURRENT' : 'START'}
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight leading-none ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-slate-300'}`}>
                {startStr.replace(/AM|PM/, '').trim()}
            </div>
        </div>
        
        <div className="relative flex items-center justify-center px-4 sm:py-3">
             <div className="absolute w-full h-[1px] sm:w-[2px] sm:h-full bg-white/10" />
             <div className={`relative z-10 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black font-mono tracking-wider border backdrop-blur-sm transition-all ${isActive ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-110' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                MIN
             </div>
        </div>
        
        {endStr && (
            <div className="relative z-10 text-right sm:text-center">
                 <div className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest mb-1 opacity-60 text-slate-500 sm:hidden">
                    END
                 </div>
                <div className={`text-lg sm:text-xl font-bold font-mono tracking-tight leading-none ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                    {endStr.replace(/AM|PM/, '').trim()}
                </div>
            </div>
        )}
    </div>
  );
};

// --- PLASMA GAUGE COMPONENT ---
const PlasmaGauge = ({ progress }: { progress: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius; 
  const gradientId = progress === 100 ? "goldGradient" : "plasmaGradient";
  const glowColor = progress === 100 ? "#f59e0b" : "#22d3ee";
  
  return (
    <div className="relative w-40 h-40 sm:w-56 sm:h-56 flex-shrink-0 group select-none">
       <svg className="absolute w-0 h-0">
          <defs>
             <linearGradient id="plasmaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" /> 
                <stop offset="100%" stopColor="#d946ef" /> 
             </linearGradient>
             <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fcd34d" /> 
                <stop offset="100%" stopColor="#f59e0b" /> 
             </linearGradient>
          </defs>
       </svg>
       <svg className="absolute inset-0 w-full h-full -rotate-90">
           <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1 3" className="text-white/20" />
       </svg>
       <div className="absolute inset-2 animate-spin-slow opacity-30">
          <svg className="w-full h-full"><circle cx="50%" cy="50%" r="42%" fill="none" stroke={glowColor} strokeWidth="1" strokeDasharray="10 10" /></svg>
       </div>
       <svg className="absolute inset-0 w-full h-full -rotate-90">
           <circle cx="50%" cy="50%" r={`${radius}%`} className="fill-none stroke-white/10" strokeWidth="6" />
           <circle cx="50%" cy="50%" r={`${radius}%`} fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeDasharray={`${circumference}`} strokeDashoffset={circumference - (progress / 100) * circumference} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${progress > 0 ? '6px' : '0'} ${glowColor})`, transition: 'stroke-dashoffset 1s ease-out' }} />
       </svg>
       <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="relative">
             <span className={`text-5xl sm:text-7xl font-black italic font-mono transition-all duration-700 ${progress === 100 ? 'text-amber-500 scale-110 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'text-white'}`}>{progress}</span>
             <span className="absolute top-0 -right-4 text-base sm:text-xl font-bold text-slate-400">%</span>
          </div>
       </div>
    </div>
  );
};

export const DailyView: React.FC<DailyViewProps> = ({ dayName, slots, username, onToggleSlot, onAddSlot, onRemoveSlot }) => {
  const [modalMode, setModalMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Modal Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('Logistics');
  const [sHour, setSHour] = useState(9);
  const [sMin, setSMin] = useState(0);
  const [sAmpm, setSAmpm] = useState<'AM'|'PM'>('AM');
  const [eHour, setEHour] = useState(10);
  const [eMin, setEMin] = useState(0);
  const [eAmpm, setEAmpm] = useState<'AM'|'PM'>('AM');

  const [currentTime, setCurrentTime] = useState(new Date());

  // Ambient Audio State
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const activeSlot = slots.find(s => checkIsActive(s.timeRange));

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Ambient Audio Effect
  useEffect(() => {
    if (ambientEnabled && activeSlot) {
       ambientEngine.play(activeSlot.category);
    } else if (ambientEnabled && !activeSlot) {
       ambientEngine.play('Logistics'); // Default background
    } else {
       ambientEngine.stop();
    }
    return () => { if (!ambientEnabled) ambientEngine.stop(); }
  }, [ambientEnabled, activeSlot?.category]);

  const completedCount = slots.filter(s => s.isCompleted).length;
  const progress = slots.length > 0 ? Math.round((completedCount / slots.length) * 100) : 0;
  const prevProgressRef = useRef(progress);
  
  useEffect(() => {
    if (progress === 100 && prevProgressRef.current < 100) {
      playSound('fanfare');
    }
    prevProgressRef.current = progress;
  }, [progress]);

  const handleSlotAction = (day: string, slotId: string, isCompleted: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) playSound('complete');
    onToggleSlot(day, slotId);
  };

  const openModal = (slot?: ScheduleSlot) => {
    playSound('open');
    if (slot) {
      setModalMode('edit');
      setEditingId(slot.id);
      setFormTitle(slot.title);
      setFormDesc(slot.description || '');
      setFormCategory(slot.category);
      
      const match = slot.timeRange.match(/(\d{1,2}):(\d{2})\s?([AP]M)\s?-\s?(\d{1,2}):(\d{2})\s?([AP]M)/i);
      if (match) {
        setSHour(parseInt(match[1]) === 12 ? 0 : parseInt(match[1]));
        setSMin(parseInt(match[2]));
        setSAmpm(match[3].toUpperCase() as any);
        setEHour(parseInt(match[4]) === 12 ? 0 : parseInt(match[4]));
        setEMin(parseInt(match[5]));
        setEAmpm(match[6].toUpperCase() as any);
      }
    } else {
      setModalMode('add');
      setEditingId(null);
      setFormTitle('');
      setFormDesc('');
      setFormCategory('Logistics');
      setSHour(9); setSMin(0); setSAmpm('AM');
      setEHour(10); setEMin(0); setEAmpm('AM');
    }
  };

  const handleSave = () => {
    if (!formTitle) return;
    playSound('save');
    const startStr = `${sHour === 0 ? 12 : sHour}:${sMin.toString().padStart(2, '0')} ${sAmpm}`;
    const endStr = `${eHour === 0 ? 12 : eHour}:${eMin.toString().padStart(2, '0')} ${eAmpm}`;
    
    onAddSlot({
      id: editingId || `slot-${Date.now()}`,
      title: formTitle,
      timeRange: `${startStr} - ${endStr}`,
      category: formCategory,
      description: formDesc,
      isCompleted: false
    });
    setModalMode('closed');
  };

  return (
    <div className="animate-fade-in-up space-y-6 sm:space-y-10 pb-10">
      
      {/* --- PLASMA REACTOR CORE (HEADER) --- */}
      <div className={`liquid-glass relative p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden transition-all duration-1000 group/core ${progress === 100 ? 'border-amber-400/50 shadow-[0_0_60px_rgba(251,191,36,0.2)]' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <PlasmaGauge progress={progress} />
          
          <div className="flex-1 text-center md:text-left space-y-4 sm:space-y-6">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                 <div className="h-px w-8 sm:w-12 bg-white/20" />
                 <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-[0.4em]">Chronicle Sequence</span>
              </div>
              <h2 className="text-5xl sm:text-8xl md:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 uppercase leading-[0.85]">{dayName}</h2>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                 <div className="px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-2 sm:gap-3">
                      <Scan className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500" />
                      <span className="text-[10px] sm:text-xs font-bold font-mono text-slate-300 uppercase tracking-widest">{username}</span>
                 </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTROLS --- */}
      <div className="flex justify-between items-end px-2 sm:px-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <h4 className="text-[10px] sm:text-xs font-mono font-bold text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.4em]">Active Protocols</h4>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {/* AMBIENT AUDIO TOGGLE */}
             <button 
                onClick={() => setAmbientEnabled(!ambientEnabled)}
                className={`flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-xl border transition-all duration-500 glass-panel hover:bg-white/10 ${ambientEnabled ? 'border-cyan-500/50 text-cyan-400' : 'border-white/10 text-slate-400'}`}
             >
                {ambientEnabled ? <Headphones className="w-4 h-4 animate-pulse" /> : <Headphones className="w-4 h-4" />}
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest hidden sm:inline">
                   {ambientEnabled ? 'Uplink Active' : 'Audio Offline'}
                </span>
             </button>

             <button onClick={() => openModal()} className="group relative px-5 py-2 sm:px-8 sm:py-3 glass-panel hover:bg-white/10 text-white rounded-xl overflow-hidden transition-all shadow-lg active:scale-95 border-white/20">
                <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] -translate-x-full group-hover:animate-shimmer" />
                <div className="relative flex items-center gap-2 font-black italic text-xs sm:text-sm uppercase tracking-wide">
                  <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Initialize</span>
                </div>
             </button>
          </div>
      </div>

      {/* --- SLOT CONTAINER --- */}
      <div className="space-y-4 sm:space-y-6">
        {slots.length === 0 ? (
          <div className="py-20 sm:py-32 text-center glass-panel rounded-[2rem] sm:rounded-[3rem] border-dashed border-white/10">
             <Terminal className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-700 mb-6" />
             <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-slate-500">No Data Stream</p>
          </div>
        ) : (
          slots.map((slot) => {
            const isDone = slot.isCompleted;
            const isActive = checkIsActive(slot.timeRange);
            const theme = THEME_CONFIG[slot.category] || THEME_CONFIG.Logistics;
            
            return (
              <div key={slot.id} className={`relative group rounded-3xl transition-all duration-500 ease-out select-none ${isActive && !isDone ? 'scale-[1.02] z-30 my-6 sm:my-8 shadow-2xl ring-1 ring-cyan-500/50' : 'z-10 hover:scale-[1.01] hover:z-20'} ${isDone ? 'opacity-80 scale-[0.98]' : 'opacity-100'}`}>
                 
                 {/* Liquid Glass Background */}
                 <div className={`absolute inset-0 rounded-3xl backdrop-blur-3xl border transition-all duration-500 ${isDone ? 'bg-black/40 border-white/5 grayscale' : isActive ? `${theme.glass} ${theme.activeBorder} border shadow-lg` : `${theme.glass} ${theme.border} group-hover:border-opacity-50`} ${isActive ? theme.glow : ''}`} />
                 
                 {/* Shine Effect */}
                 <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                 <div className="relative z-20 flex flex-col sm:flex-row items-stretch min-h-[140px] sm:min-h-[160px]">
                    <ChronometerHUD timeRange={slot.timeRange} isActive={isActive} isDone={isDone} theme={theme} />
                    <div className="flex-1 p-5 sm:p-8 flex flex-col justify-center relative overflow-hidden cursor-pointer" onClick={(e) => handleSlotAction(dayName, slot.id, isDone, e)}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-1.5 rounded-md ${theme.text} bg-white/10 shadow-sm border border-white/20`}><div className="w-3 h-3 sm:w-4 sm:h-4">{getCategoryIcon(slot.category)}</div></div>
                            <span className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${theme.subText}`}>{getProtocolLabel(slot.category)}</span>
                            {slot.isCompleted && (<span className="ml-auto px-2 py-0.5 rounded text-[8px] font-black uppercase bg-green-500 text-white tracking-widest shadow-lg shadow-green-500/20">Complete</span>)}
                        </div>
                        <h3 className={`text-2xl sm:text-4xl font-black italic uppercase tracking-tight leading-none mb-2 transition-all duration-300 ${isDone ? 'text-slate-400 line-through decoration-slate-500/50' : theme.text}`}>{slot.title}</h3>
                        {slot.description && (<p className={`text-xs sm:text-sm font-mono max-w-lg ${isDone ? 'text-slate-500' : theme.subText}`}>{slot.description}</p>)}
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center p-4 sm:p-6 gap-4 border-t sm:border-t-0 sm:border-l border-white/5 bg-black/20 rounded-b-3xl sm:rounded-bl-none sm:rounded-r-3xl">
                        <button onClick={(e) => handleSlotAction(dayName, slot.id, isDone, e)} className={`relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl border-2 transition-all duration-500 group/btn ${isDone ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-transparent shadow-[0_0_20px_rgba(16,185,129,0.4)] rotate-0' : `bg-white/5 ${theme.border} hover:scale-110 hover:shadow-lg hover:bg-white/10`}`}>
                             {isDone ? (<Check className="w-6 h-6 sm:w-8 sm:h-8 text-white stroke-[4]" />) : (<div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${theme.glass} ${theme.activeBorder} border-2 group-hover/btn:bg-current transition-colors duration-300`} />)}
                        </button>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); openModal(slot); }} className="p-2 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-white/5 transition-all"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); playSound('delete'); onRemoveSlot(slot.id); }} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                 </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- COMMAND CENTER MODAL (ADD/EDIT) --- */}
      {modalMode !== 'closed' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/60 animate-fade-in">
            <div className="w-full max-w-lg liquid-glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden group max-h-[90vh] overflow-y-auto">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                
                <div className="flex items-start justify-between mb-6 sm:mb-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                           <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
                           <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.3em]">{modalMode === 'add' ? 'System Input' : 'Modify Sequence'}</span>
                        </div>
                        <h3 className="text-3xl sm:text-4xl font-black italic text-white uppercase tracking-tighter">{modalMode === 'add' ? 'New Protocol' : 'Edit Protocol'}</h3>
                    </div>
                    <button onClick={() => setModalMode('closed')} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                
                <div className="space-y-5 sm:space-y-6 relative z-10">
                    {/* Time Scrollers */}
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 shadow-inner">
                       <label className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 block text-center">Temporal Settings</label>
                       <div className="flex items-center justify-center gap-2 sm:gap-6">
                          {/* Start Time */}
                          <div className="flex gap-1 sm:gap-2 text-white">
                             <TimeWheel value={sHour} onChange={setSHour} max={12} label="HR" />
                             <TimeWheel value={sMin} onChange={setSMin} max={60} label="MIN" />
                             <div className="flex flex-col gap-2 justify-center ml-1 sm:ml-2">
                                <button onClick={() => {setSAmpm('AM'); playSound('tick');}} className={`text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded transition-colors ${sAmpm === 'AM' ? 'bg-cyan-500 text-white' : 'text-slate-500 hover:bg-white/10'}`}>AM</button>
                                <button onClick={() => {setSAmpm('PM'); playSound('tick');}} className={`text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded transition-colors ${sAmpm === 'PM' ? 'bg-cyan-500 text-white' : 'text-slate-500 hover:bg-white/10'}`}>PM</button>
                             </div>
                          </div>
                          <div className="text-slate-600 font-black text-xl">-</div>
                          {/* End Time */}
                          <div className="flex gap-1 sm:gap-2 text-white">
                             <TimeWheel value={eHour} onChange={setEHour} max={12} label="HR" />
                             <TimeWheel value={eMin} onChange={setEMin} max={60} label="MIN" />
                             <div className="flex flex-col gap-2 justify-center ml-1 sm:ml-2">
                                <button onClick={() => {setEAmpm('AM'); playSound('tick');}} className={`text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded transition-colors ${eAmpm === 'AM' ? 'bg-cyan-500 text-white' : 'text-slate-500 hover:bg-white/10'}`}>AM</button>
                                <button onClick={() => {setEAmpm('PM'); playSound('tick');}} className={`text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded transition-colors ${eAmpm === 'PM' ? 'bg-cyan-500 text-white' : 'text-slate-500 hover:bg-white/10'}`}>PM</button>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Directive Name</label>
                        <input 
                          autoFocus
                          value={formTitle} 
                          onChange={e => {
                            setFormTitle(e.target.value);
                            const detected = determineCategory(e.target.value);
                            if (detected !== formCategory) {
                                setFormCategory(detected);
                                playSound('tick');
                            }
                          }} 
                          placeholder="ENTER TASK DATA..." 
                          className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-4 text-white font-mono placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-all text-base sm:text-lg shadow-inner" 
                        />
                        <div className="flex justify-end">
                           <span className={`text-[8px] sm:text-[9px] px-2 py-0.5 rounded border uppercase font-mono tracking-widest transition-colors ${THEME_CONFIG[formCategory].text} ${THEME_CONFIG[formCategory].border} ${THEME_CONFIG[formCategory].glass}`}>
                              Detected: {formCategory}
                           </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Parameters (Optional)</label>
                       <textarea 
                          value={formDesc}
                          onChange={e => setFormDesc(e.target.value)}
                          placeholder="ADDITIONAL INSTRUCTIONS..."
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-mono text-xs placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-all h-20 resize-none shadow-inner"
                       />
                    </div>

                    <button 
                      onClick={handleSave} 
                      className="w-full py-4 bg-white hover:bg-cyan-400 text-slate-950 font-black italic uppercase rounded-2xl transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Terminal className="w-4 h-4" /> {modalMode === 'add' ? 'Initialize Sequence' : 'Update Sequence'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
