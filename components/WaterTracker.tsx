
import React, { useState, useEffect, useRef } from 'react';
import { WaterConfig, WaterSlot } from '../types';
import { Droplet, Sun, Moon, RotateCcw, Check, Sparkles, Clock, ArrowRight, Activity, Zap, CloudLightning, Loader2, Thermometer, Settings2, X, Waves, Hexagon, Divide, ChevronRight, AlertCircle, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playOrbitSound } from '../utils/audio';
import { LiquidSlider } from './LiquidSlider';
import { GoogleGenAI } from "@google/genai";

interface WaterTrackerProps {
  userConfig?: WaterConfig;
  onSaveConfig: (config: WaterConfig) => void;
  username: string;
}

// --- UTILS ---
const formatTime12 = (hours: number, minutes: number) => {
    const h = hours % 12 || 12;
    const ampm = hours < 12 || hours === 24 ? 'AM' : 'PM';
    return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const generateSlots = (goalLiters: number, wakeTime: string, sleepTime: string): WaterSlot[] => {
    const [wH, wM] = wakeTime.split(':').map(Number);
    const [sH, sM] = sleepTime.split(':').map(Number);
    
    let startMin = wH * 60 + wM;
    let endMin = sH * 60 + sM;
    
    if (endMin < startMin) endMin += 24 * 60;
    endMin -= 60; // Buffer

    const totalMinutes = endMin - startMin;
    const glassSize = 250; 
    const totalMl = goalLiters * 1000;
    const slotsNeeded = Math.ceil(totalMl / glassSize);
    
    const finalSlots = Math.max(4, Math.min(16, slotsNeeded)); 
    const interval = totalMinutes / (finalSlots - 1);

    const slots: WaterSlot[] = [];
    for(let i=0; i<finalSlots; i++) {
        const currentMin = Math.floor(startMin + (i * interval));
        let h = Math.floor(currentMin / 60);
        const m = currentMin % 60;
        if (h >= 24) h -= 24;
        
        let label = "INTAKE CYCLE";
        if (i === 0) label = "SYS.BOOT";
        else if (i === Math.floor(finalSlots/2)) label = "CORE REFUEL";
        else if (i === finalSlots - 1) label = "FLUSH PROTOCOL";

        slots.push({
            id: `hydro-${Date.now()}-${i}`,
            time: formatTime12(h, m),
            amount: glassSize,
            isCompleted: false,
            label
        });
    }
    return slots;
};

// --- VISUAL FX COMPONENTS ---

const Scanline = () => (
    <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-20" />
);

const HexGrid = () => (
    <div className="absolute inset-0 z-0 opacity-[0.05]" 
         style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
             backgroundSize: '60px 60px'
         }} 
    />
);

// --- SUB-COMPONENT: ADVANCED BIO-REACTOR AVATAR ---
const BioReactor = ({ percentage, mood = 'neutral' }: { percentage: number, mood?: 'neutral' | 'analyzing' | 'success' }) => {
    
    // Determine Stage
    let stage: 'critical' | 'low' | 'medium' | 'high' | 'max' = 'low';
    if (percentage >= 100) stage = 'max';
    else if (percentage >= 75) stage = 'high';
    else if (percentage >= 50) stage = 'medium';
    else if (percentage > 20) stage = 'low';
    else stage = 'critical';

    if (mood === 'analyzing') stage = 'medium';

    // Config per stage
    const config = {
        critical: {
            colorClass: 'red',
            ringColor: 'border-red-500',
            glowColor: 'shadow-red-500/50',
            liqFrom: 'from-red-600',
            liqTo: 'to-rose-900',
            eyes: 'dead',
            mouth: 'frown'
        },
        low: {
            colorClass: 'orange',
            ringColor: 'border-orange-500',
            glowColor: 'shadow-orange-500/50',
            liqFrom: 'from-orange-500',
            liqTo: 'to-amber-800',
            eyes: 'bored',
            mouth: 'flat'
        },
        medium: {
            colorClass: 'cyan',
            ringColor: 'border-cyan-500',
            glowColor: 'shadow-cyan-500/50',
            liqFrom: 'from-cyan-500',
            liqTo: 'to-blue-800',
            eyes: 'normal',
            mouth: 'smile'
        },
        high: {
            colorClass: 'purple',
            ringColor: 'border-purple-500',
            glowColor: 'shadow-purple-500/50',
            liqFrom: 'from-purple-500',
            liqTo: 'to-fuchsia-800',
            eyes: 'happy',
            mouth: 'big'
        },
        max: {
            colorClass: 'emerald',
            ringColor: 'border-emerald-400',
            glowColor: 'shadow-emerald-400/60',
            liqFrom: 'from-emerald-400',
            liqTo: 'to-teal-500',
            eyes: 'glowing',
            mouth: 'hyped'
        }
    }[stage];

    const isAnalyzing = mood === 'analyzing';

    return (
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
            {/* 1. Outer Tech Ring (Static with ticks) */}
            <div className="absolute inset-0 rounded-full border border-white/10 flex items-center justify-center">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`absolute w-1 h-2 bg-white/20`} 
                        style={{ 
                            top: 0, 
                            transformOrigin: 'center 128px',
                            transform: `rotate(${i * 30}deg)` 
                        }} 
                    />
                ))}
            </div>

            {/* 2. Rotating HUD Rings */}
            <div className={`absolute inset-4 rounded-full border border-dashed ${config.ringColor} opacity-30 animate-spin-slow`} style={{ animationDuration: '30s' }} />
            <div className={`absolute inset-8 rounded-full border border-dotted ${config.ringColor} opacity-50 animate-spin-slow`} style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
            
            {/* Halo for Max Stage */}
            {stage === 'max' && (
                <div className="absolute inset-[-20px] rounded-full border-2 border-emerald-400/30 animate-ping opacity-20" />
            )}

            {/* 3. Core Container (Glass) */}
            <div className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden backdrop-blur-md border-2 border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.1)] ${config.glowColor} shadow-2xl transition-all duration-700`}>
                
                {/* Liquid Fill */}
                <motion.div 
                    initial={{ height: '0%' }}
                    animate={{ height: isAnalyzing ? '100%' : `${percentage}%` }}
                    transition={{ type: 'spring', damping: 15, mass: 1 }}
                    className={`absolute bottom-0 left-0 right-0 w-full bg-gradient-to-t ${config.liqFrom} ${config.liqTo} transition-colors duration-700 opacity-90`}
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/50 animate-pulse" />
                    {/* Bubbles */}
                    <div className="absolute inset-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay" />
                </motion.div>

                {/* Face Interface */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 mix-blend-overlay">
                    <div className="flex gap-4 mb-3">
                        {/* LEFT EYE */}
                        <div className="w-4 h-4 flex items-center justify-center">
                            {config.eyes === 'dead' && (
                                <div className="relative w-4 h-4">
                                    <div className="absolute inset-0 w-1 h-full bg-white left-1.5 rotate-45 rounded-full" />
                                    <div className="absolute inset-0 w-1 h-full bg-white left-1.5 -rotate-45 rounded-full" />
                                </div>
                            )}
                            {config.eyes === 'bored' && (
                                <div className="w-4 h-1 bg-white rounded-full mt-1" />
                            )}
                            {(config.eyes === 'normal' || config.eyes === 'glowing') && (
                                <motion.div 
                                    animate={{ scaleY: [1, 0.1, 1] }} 
                                    transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.15 }}
                                    className={`w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] ${config.eyes === 'glowing' ? 'animate-pulse shadow-[0_0_20px_white]' : ''}`} 
                                />
                            )}
                            {config.eyes === 'happy' && (
                                <div className="w-3 h-3 border-t-2 border-r-2 border-white rotate-[-45deg] rounded-sm mt-1" />
                            )}
                        </div>

                        {/* RIGHT EYE */}
                        <div className="w-4 h-4 flex items-center justify-center">
                            {config.eyes === 'dead' && (
                                <div className="relative w-4 h-4">
                                    <div className="absolute inset-0 w-1 h-full bg-white left-1.5 rotate-45 rounded-full" />
                                    <div className="absolute inset-0 w-1 h-full bg-white left-1.5 -rotate-45 rounded-full" />
                                </div>
                            )}
                            {config.eyes === 'bored' && (
                                <div className="w-4 h-1 bg-white rounded-full mt-1" />
                            )}
                            {(config.eyes === 'normal' || config.eyes === 'glowing') && (
                                <motion.div 
                                    animate={{ scaleY: [1, 0.1, 1] }} 
                                    transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.15 }}
                                    className={`w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] ${config.eyes === 'glowing' ? 'animate-pulse shadow-[0_0_20px_white]' : ''}`} 
                                />
                            )}
                            {config.eyes === 'happy' && (
                                <div className="w-3 h-3 border-t-2 border-l-2 border-white rotate-[45deg] rounded-sm mt-1" />
                            )}
                        </div>
                    </div>

                    {/* MOUTH */}
                    <div className="flex justify-center h-4 items-start">
                        {config.mouth === 'frown' && (
                            <div className="w-4 h-4 border-t-2 border-white rounded-t-full mt-2" />
                        )}
                        {config.mouth === 'flat' && (
                            <div className="w-4 h-1 bg-white rounded-full mt-1" />
                        )}
                        {config.mouth === 'smile' && (
                            <div className="w-4 h-2 border-b-2 border-white rounded-b-full" />
                        )}
                        {config.mouth === 'big' && (
                            <div className="w-6 h-3 bg-white rounded-b-full opacity-80" />
                        )}
                        {config.mouth === 'hyped' && (
                            <div className="w-6 h-4 bg-white rounded-t-sm rounded-b-xl opacity-90 animate-pulse" />
                        )}
                    </div>
                </div>

                {/* Glare */}
                <div className="absolute top-4 left-6 w-8 h-4 bg-white/10 rounded-full blur-[2px] -rotate-12" />
            </div>
            
            {/* 4. Data Readouts */}
            <div className="absolute -bottom-8 font-mono text-[9px] text-slate-500 flex gap-4 uppercase tracking-widest">
                <span>Status: {stage.toUpperCase()}</span>
                <span>Visc: {(percentage/100).toFixed(2)}</span>
            </div>
        </div>
    );
};

// --- SETUP WIZARD ---
const HydroSetup = ({ onComplete, onCancel, initialConfig }: { onComplete: (c: WaterConfig) => void, onCancel?: () => void, initialConfig?: WaterConfig }) => {
    const [step, setStep] = useState(1);
    
    // Parse Initial Config for defaults
    const parseTimeStr = (str?: string) => {
        if (!str) return null;
        const [h, m] = str.split(':').map(Number);
        return { h, m };
    };
    
    const initWake = parseTimeStr(initialConfig?.wakeTime) || { h: 7, m: 30 };
    const initSleep = parseTimeStr(initialConfig?.sleepTime) || { h: 23, m: 0 };

    const [goal, setGoal] = useState(initialConfig?.dailyGoal || 3);
    const [wakeH, setWakeH] = useState(initWake.h); 
    const [wakeM, setWakeM] = useState(initWake.m);
    const [bedH, setBedH] = useState(initSleep.h); 
    const [bedM, setBedM] = useState(initSleep.m);

    const handleNext = () => {
        playOrbitSound('click');
        if (step < 2) setStep(step + 1);
        else {
            playOrbitSound('power_up');
            const wTime = `${wakeH}:${wakeM}`;
            const bTime = `${bedH}:${bedM}`;
            const slots = generateSlots(goal, wTime, bTime);
            
            onComplete({
                dailyGoal: goal,
                wakeTime: wTime,
                sleepTime: bTime,
                adaptiveMode: true,
                lastDate: new Date().toDateString(),
                progress: [], 
                slots
            });
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fade-in relative">
            {onCancel && (
                <button onClick={onCancel} className="absolute top-0 right-0 p-3 text-slate-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            )}

            <div className="mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)] mb-4 ring-2 ring-white/20">
                    <Settings2 className="w-8 h-8 text-white animate-spin-slow" style={{ animationDuration: '10s' }} />
                </div>
                <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">System<span className="text-cyan-400">Config</span></h2>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-2">
                    {step === 1 ? 'Target Volume Calibration' : 'Circadian Sync'}
                </p>
            </div>

            <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden shadow-2xl">
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="mb-6">
                                <span className="text-6xl font-black italic text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">{goal}</span>
                                <span className="text-xl font-bold text-slate-500 ml-1">LITERS</span>
                            </div>
                            <LiquidSlider value={goal} min={1} max={6} step={0.5} onChange={setGoal} label="DAILY TARGET" unit="L" />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Wake */}
                            <div>
                                <div className="flex items-center justify-center gap-2 mb-2 text-amber-400 font-mono text-xs uppercase tracking-widest">
                                    <Sun className="w-4 h-4" /> System Wake
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <LiquidSlider value={wakeH} min={4} max={12} onChange={setWakeH} unit="H" />
                                    <LiquidSlider value={wakeM} min={0} max={55} step={5} onChange={setWakeM} unit="M" />
                                </div>
                            </div>
                            {/* Sleep */}
                            <div>
                                <div className="flex items-center justify-center gap-2 mb-2 text-indigo-400 font-mono text-xs uppercase tracking-widest">
                                    <Moon className="w-4 h-4" /> Standby
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <LiquidSlider value={bedH} min={18} max={29} onChange={setBedH} unit="H" />
                                    <LiquidSlider value={bedM} min={0} max={55} step={5} onChange={setBedM} unit="M" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex gap-3 mt-6">
                    {step === 2 && (
                        <button onClick={() => setStep(1)} className="px-4 py-4 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 font-bold uppercase transition-colors">
                            Back
                        </button>
                    )}
                    <button onClick={handleNext} className="flex-1 py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                        {step === 1 ? 'Next' : 'Initialize'} <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const WaterTracker: React.FC<WaterTrackerProps> = ({ userConfig, onSaveConfig, username }) => {
  const [localConfig, setLocalConfig] = useState<WaterConfig | undefined>(userConfig);
  const [isSetup, setIsSetup] = useState(!!(userConfig?.slots && userConfig.slots.length > 0));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{weather: string, goal: number, msg: string} | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Hydration Check
  useEffect(() => {
      if (userConfig) {
          setLocalConfig(userConfig);
          const today = new Date().toDateString();
          if (userConfig.lastDate !== today && userConfig.slots) {
              const resetSlots = userConfig.slots.map(s => ({ ...s, isCompleted: false }));
              onSaveConfig({ ...userConfig, lastDate: today, slots: resetSlots });
          } else {
              setIsSetup(!!(userConfig.slots && userConfig.slots.length > 0));
          }
      }
  }, [userConfig]);

  const handleConfigComplete = (config: WaterConfig) => {
      setLocalConfig(config);
      setIsSetup(true);
      onSaveConfig(config);
  };

  const toggleSlot = (id: string) => {
      if (!localConfig || !localConfig.slots) return;
      
      const target = localConfig.slots.find(s => s.id === id);
      const newState = !target?.isCompleted;
      
      playOrbitSound(newState ? 'water_splash' : 'liquid_deactivate');

      const updatedSlots = localConfig.slots.map(s => 
          s.id === id ? { ...s, isCompleted: newState } : s
      );
      
      const newConfig = { ...localConfig, slots: updatedSlots };
      setLocalConfig(newConfig);
      onSaveConfig(newConfig);
  };

  const handleEnterSetup = () => { playOrbitSound('click'); setIsSetup(false); };
  const handleCancelSetup = () => { if (localConfig?.slots?.length) { playOrbitSound('click'); setIsSetup(true); } };

  // --- AI LOGIC ---
  const handleAISync = async () => {
      if (!localConfig) return;
      setIsAnalyzing(true);
      playOrbitSound('power_up');

      try {
          if (!("geolocation" in navigator)) throw new Error("No Geo");
          
          const position: any = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          const { latitude, longitude } = position.coords;

          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const prompt = `
            You are a hydration expert AI.
            User Location: ${latitude}, ${longitude}.
            User Goal: ${localConfig.dailyGoal} Liters.
            Wake: ${localConfig.wakeTime}, Sleep: ${localConfig.sleepTime}.
            Task:
            1. Use Google Search to find current weather (Temp, Humidity).
            2. Recommend adjusted water goal.
            3. Provide a short, energetic, sci-fi style advice string.
            Output strictly valid JSON: { "weather": "string", "new_goal": number, "message": "string" }
          `;

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            }
          });

          const text = response.text || "{}";
          const jsonStr = text.replace(/```json|```/g, "").trim();
          const data = JSON.parse(jsonStr);

          if (data.new_goal) {
              setAiResult({
                  weather: data.weather || "Atmosphere Unstable",
                  goal: data.new_goal,
                  msg: data.message || "Optimization Complete."
              });
              playOrbitSound('success_chord');
          }
      } catch (e) {
          console.error("AI Sync Failed", e);
          alert("Neural Sync Failed: Check connectivity.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const applyAIRecommendation = () => {
      if (!aiResult || !localConfig) return;
      playOrbitSound('power_up');
      
      const newSlots = generateSlots(aiResult.goal, localConfig.wakeTime, localConfig.sleepTime);
      
      const newConfig = { 
          ...localConfig, 
          dailyGoal: aiResult.goal, 
          slots: newSlots,
          aiSuggestion: {
              weather: aiResult.weather,
              recommendedGoal: aiResult.goal,
              message: aiResult.msg,
              timestamp: new Date().toISOString()
          }
      };
      
      setLocalConfig(newConfig);
      onSaveConfig(newConfig);
      setAiResult(null);
  };

  // Calculations
  const totalVolume = localConfig?.slots?.reduce((acc, s) => acc + s.amount, 0) || 0;
  const consumed = localConfig?.slots?.filter(s => s.isCompleted).reduce((acc, s) => acc + s.amount, 0) || 0;
  const percentage = totalVolume > 0 ? Math.round((consumed / totalVolume) * 100) : 0;

  if (!isSetup) {
      return <HydroSetup onComplete={handleConfigComplete} onCancel={localConfig?.slots ? handleCancelSetup : undefined} initialConfig={localConfig} />;
  }

  return (
    <div className="relative min-h-[85vh] w-full overflow-hidden rounded-[2.5rem] bg-[#020617] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row animate-fade-in group">
        
        {/* --- GLOBAL ATMOSPHERE --- */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-black to-purple-900/10 pointer-events-none" />
        <HexGrid />
        <Scanline />
        
        {/* --- LEFT PANEL: VISUALIZER (Bio-Reactor) --- */}
        <div className="relative z-10 w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 bg-black/20 backdrop-blur-sm">
            
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] uppercase tracking-[0.3em] mb-1">
                        <Activity className="w-3 h-3 animate-pulse" /> Bio-Metric Uplink
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black italic text-white tracking-tighter pr-2">
                        {percentage}% <span className="text-slate-600 text-xl">FULL</span>
                    </h2>
                    {localConfig?.aiSuggestion && (
                        <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono text-purple-400 uppercase tracking-widest opacity-80">
                            <CloudLightning className="w-3 h-3" /> {localConfig.aiSuggestion.weather}
                        </div>
                    )}
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={handleAISync} 
                        disabled={isAnalyzing}
                        className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                        title="AI Weather Sync"
                    >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    </button>
                    <button onClick={handleEnterSetup} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-colors" title="Settings">
                        <Settings2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Visualizer */}
            <div className="flex-1 flex flex-col items-center justify-center py-8">
                <BioReactor percentage={percentage} mood={isAnalyzing ? 'analyzing' : undefined} />
                
                <div className="mt-8 px-6 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md max-w-xs text-center">
                    <p className={`text-xs font-mono uppercase tracking-widest leading-relaxed ${percentage < 30 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
                        {isAnalyzing ? "CONNECTING TO SATELLITE ARRAY..." : 
                         localConfig?.aiSuggestion ? localConfig.aiSuggestion.message :
                         percentage < 20 ? "CRITICAL FAILURE IMMINENT. INTAKE REQUIRED." : 
                         percentage < 50 ? "SYSTEMS FUNCTIONAL. EFFICIENCY SUB-OPTIMAL." :
                         percentage < 80 ? "OPERATING WITHIN NORMAL PARAMETERS." :
                         percentage < 100 ? "OPTIMAL PERFORMANCE REACHED." :
                         "TRANSCENDENCE ACHIEVED. MAXIMUM POWER."}
                    </p>
                </div>
            </div>
        </div>

        {/* --- RIGHT PANEL: FUEL GAUGE (Timeline) --- */}
        <div className="relative z-10 w-full md:w-1/2 bg-black/40 flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">Intake Schedule</span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">
                    {consumed} / {totalVolume} ml
                </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative" ref={scrollContainerRef}>
                <div className="absolute left-9 top-0 bottom-0 w-px bg-white/10 h-full z-0" />
                
                <div className="space-y-6 relative z-10">
                    {localConfig?.slots?.map((slot, idx) => {
                        const isNext = !slot.isCompleted && (idx === 0 || localConfig.slots![idx-1].isCompleted);
                        
                        return (
                            <div 
                                key={slot.id}
                                onClick={() => toggleSlot(slot.id)}
                                className={`relative group cursor-pointer transition-all duration-300 ${slot.isCompleted ? 'opacity-50 hover:opacity-100' : isNext ? 'opacity-100 scale-105' : 'opacity-40'}`}
                            >
                                <div className="flex items-center gap-6">
                                    {/* Icon / Node */}
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 ${slot.isCompleted ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]' : isNext ? 'bg-black border-white text-white animate-pulse' : 'bg-black border-slate-700 text-slate-700'}`}>
                                        {slot.isCompleted && <Check className="w-3.5 h-3.5 text-black stroke-[4]" />}
                                        {isNext && !slot.isCompleted && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>

                                    {/* Content Card */}
                                    <div className={`flex-1 p-4 rounded-xl border transition-all duration-300 ${slot.isCompleted ? 'bg-cyan-900/10 border-cyan-500/30' : isNext ? 'bg-white/10 border-white/30 shadow-lg' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className={`text-[10px] font-mono uppercase tracking-widest mb-1 ${slot.isCompleted ? 'text-cyan-400' : isNext ? 'text-white' : 'text-slate-500'}`}>
                                                    {slot.time}
                                                </div>
                                                <div className={`text-sm font-bold uppercase ${slot.isCompleted ? 'text-slate-400 line-through decoration-cyan-500/50' : 'text-slate-200'}`}>
                                                    {slot.label}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black font-mono text-slate-400">{slot.amount}ml</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        {/* --- AI RESULT MODAL (OVERLAY) --- */}
        <AnimatePresence>
            {aiResult && (
                <motion.div 
                    initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
                    exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-8 text-center"
                >
                    <div className="w-20 h-20 rounded-full border border-purple-500/30 bg-purple-900/20 flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(168,85,247,0.3)] animate-pulse-slow">
                        <Thermometer className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-2">Analysis Complete</h3>
                    <p className="text-purple-300 font-mono text-xs uppercase tracking-[0.2em] mb-8 border border-purple-500/30 px-3 py-1 rounded-full">{aiResult.weather}</p>
                    
                    <div className="bg-gradient-to-b from-white/10 to-transparent border border-white/10 p-8 rounded-3xl mb-8 w-full max-w-sm">
                        <div className="flex justify-between items-end mb-4 opacity-60">
                            <span className="text-[10px] font-mono uppercase tracking-widest">Current</span>
                            <span className="text-[10px] font-mono uppercase tracking-widest">Target</span>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-3xl font-black text-slate-500">{localConfig?.dailyGoal}L</span>
                            <div className="flex-1 h-px bg-white/20 mx-4 relative"><ChevronRight className="absolute right-0 -top-2 w-4 h-4 text-white" /></div>
                            <span className="text-5xl font-black text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">{aiResult.goal}L</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-mono leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
                            "{aiResult.msg}"
                        </p>
                    </div>

                    <div className="flex gap-4 w-full max-w-sm">
                        <button onClick={() => setAiResult(null)} className="flex-1 py-4 rounded-xl border border-white/10 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors">
                            Dismiss
                        </button>
                        <button onClick={applyAIRecommendation} className="flex-1 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(147,51,234,0.3)] transition-all hover:scale-105">
                            Engage Sync
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};
