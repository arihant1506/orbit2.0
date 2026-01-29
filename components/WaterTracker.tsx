import React, { useState, useEffect } from 'react';
import { WaterConfig } from '../types';
import { Droplet, Settings, Check, CloudRain, Trophy, ArrowRight, Dna, Brain, Moon, Sun, Thermometer, Wind, MapPin, Loader2, AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import { LiquidSlider } from './LiquidSlider';
import { playOrbitSound } from '../utils/audio';

interface WaterTrackerProps {
  userConfig?: WaterConfig;
  onSaveConfig: (config: WaterConfig) => void;
  username: string;
}

interface WeatherData {
  temp: number;
  humidity: number;
  conditionCode: number;
  isDay: boolean;
  locationName: string;
  loading: boolean;
  error?: string;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({ userConfig, onSaveConfig, username }) => {
  // Config State
  const [goal, setGoal] = useState(userConfig?.dailyGoal || 3);
  const [recommendedGoal, setRecommendedGoal] = useState<number>(3);
  const [medicalNote, setMedicalNote] = useState<string>("Analyzing local conditions...");
  const [showConfig, setShowConfig] = useState(!userConfig);
  
  // Weather State
  const [weather, setWeather] = useState<WeatherData>({
    temp: 20,
    humidity: 50,
    conditionCode: 0,
    isDay: true,
    locationName: 'Sector 7',
    loading: true
  });
  
  // Tracker State
  const [progress, setProgress] = useState<string[]>(userConfig?.progress || []);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [activeDrop, setActiveDrop] = useState<boolean>(false);

  // --- 2. DOCTOR'S LOGIC ALGORITHM ---
  const calculateMedicalGoal = (temp: number, humidity: number) => {
     let base = 2.5; // Baseline for active student (Liters)
     let reasons: string[] = ["Baseline metabolic need: 2.5L."];

     // Temperature Factors
     if (temp > 30) {
        base += 1.0;
        reasons.push(`EXTREME HEAT (${temp}°C): +1.0L for thermoregulation.`);
     } else if (temp > 25) {
        base += 0.5;
        reasons.push(`Elevated Temp (${temp}°C): +0.5L for sweat compensation.`);
     }

     // Humidity Factors (Insensible Water Loss)
     if (humidity < 30) {
        base += 0.5;
        reasons.push(`Dry Air (<30%): +0.5L for rapid evaporation.`);
     } else if (humidity > 70 && temp > 25) {
        base += 0.5;
        reasons.push(`High Humidity + Heat: +0.5L. Cooling efficiency reduced.`);
     }

     // Round to nearest 0.5
     const finalGoal = Math.round(base * 2) / 2;
     
     setRecommendedGoal(finalGoal);
     setMedicalNote(reasons.join(" "));
     
     // Auto-update goal if this is first load or user hasn't overridden
     if (!userConfig) {
        setGoal(finalGoal);
     }
  };

  // --- 1. WEATHER & ADAPTIVE LOGIC ---
  const refreshWeather = () => {
    playOrbitSound('click');
    setWeather(prev => ({ ...prev, loading: true, error: undefined }));
    
    if (!navigator.geolocation) {
       setWeather(prev => ({ ...prev, loading: false, error: "Geolocation not supported" }));
       return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
       try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Parallel Fetch: Weather & Location Name
          const [weatherRes, geoRes] = await Promise.all([
             fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m`),
             fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
          ]);

          const weatherData = await weatherRes.json();
          const geoData = await geoRes.json();
          
          const cityName = geoData.city || geoData.locality || geoData.principalSubdivision || "Unknown Sector";

          if (weatherData.current_weather) {
             const temp = weatherData.current_weather.temperature;
             // Approximate current humidity from hourly data (taking the closest hour)
             const hourIndex = new Date().getHours();
             const humidity = weatherData.hourly.relativehumidity_2m[hourIndex] || 50;
             
             setWeather({
                temp: temp,
                humidity: humidity,
                conditionCode: weatherData.current_weather.weathercode,
                isDay: weatherData.current_weather.is_day === 1,
                locationName: cityName,
                loading: false
             });

             calculateMedicalGoal(temp, humidity);
          }
       } catch (e) {
          setWeather(prev => ({ ...prev, loading: false, error: "Weather fetch failed" }));
          calculateMedicalGoal(20, 50); // Fallback defaults
       }
    }, (err) => {
       setWeather(prev => ({ ...prev, loading: false, error: "Location access denied" }));
       calculateMedicalGoal(20, 50); // Fallback defaults
    });
  };

  useEffect(() => {
    refreshWeather();
  }, []);

  // --- 3. BIO-RHYTHM SLOT GENERATOR ---
  const generateBioRhythmSlots = () => {
    const glassSize = 0.5; // 500ml per slot
    const totalSlotsNeeded = Math.ceil(goal / glassSize);
    
    const slots = [];

    // Slot 1: Morning Flush
    slots.push({
      id: 'water-wake',
      time: '07:30 AM',
      amount: glassSize,
      label: 'CORTISOL FLUSH',
      icon: <Sun className="w-3 h-3" />
    });

    const remaining = totalSlotsNeeded - 1;
    if (remaining <= 0) return slots;

    // Distribute remainder from 9 AM to 9 PM
    const startMin = 9 * 60;
    const endMin = 21 * 60;
    const interval = (endMin - startMin) / remaining;

    for (let i = 0; i < remaining; i++) {
       const minutes = Math.floor(startMin + (i * interval));
       const h = Math.floor(minutes / 60);
       const m = minutes % 60;
       const ampm = h >= 12 ? 'PM' : 'AM';
       const dispH = h > 12 ? h - 12 : (h === 0 || h === 24 ? 12 : h);
       const timeStr = `${dispH}:${m.toString().padStart(2, '0')} ${ampm}`;

       let label = 'HYDRATE';
       let icon = <Droplet className="w-3 h-3" />;

       if (h >= 9 && h < 11) { label = 'COGNITIVE LOAD'; icon = <Brain className="w-3 h-3" />; }
       else if (h >= 11 && h < 14) { label = 'DIGESTION PREP'; icon = <Droplet className="w-3 h-3" />; }
       else if (h >= 14 && h < 17) { label = 'ENERGY BRIDGE'; icon = <Brain className="w-3 h-3" />; }
       else if (h >= 17) { label = 'RECOVERY'; icon = <Moon className="w-3 h-3" />; }

       slots.push({ id: `water-${i}`, time: timeStr, amount: glassSize, label, icon });
    }

    return slots;
  };

  const slots = generateBioRhythmSlots();
  const completedCount = progress.length;
  const percentage = Math.round((completedCount / slots.length) * 100);

  useEffect(() => {
    if (percentage === 100 && !isCelebrating) {
      playOrbitSound('success_chord');
      setIsCelebrating(true);
      setTimeout(() => setIsCelebrating(false), 8000);
    }
  }, [percentage]);

  const toggleSlot = (id: string) => {
    if (progress.includes(id)) {
      const newProg = progress.filter(p => p !== id);
      setProgress(newProg);
      save(newProg);
      playOrbitSound('liquid_deactivate');
    } else {
      setActiveDrop(true);
      playOrbitSound('click'); // Trigger drop
      setTimeout(() => {
         setActiveDrop(false);
         playOrbitSound('water_splash');
         const newProg = [...progress, id];
         setProgress(newProg);
         save(newProg);
      }, 600);
    }
  };

  const save = (currentProgress: string[]) => {
    onSaveConfig({
      dailyGoal: goal,
      adaptiveMode: true,
      lastDate: new Date().toDateString(),
      progress: currentProgress
    });
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playOrbitSound('success_chord');
    setShowConfig(false);
    save([]);
  };

  if (showConfig) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 animate-fade-in-up">
        <div className="w-full max-w-2xl bg-slate-950 border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" />
           
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2">
                 {weather.loading ? <Loader2 className="w-5 h-5 animate-spin text-cyan-500" /> : <MapPin className="w-5 h-5 text-cyan-500" />}
                 <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                    {weather.loading ? "Triangulating Location..." : `${weather.locationName} • ${weather.temp}°C / ${weather.humidity}% RH`}
                 </span>
             </div>
             <h2 className="text-3xl sm:text-4xl font-black italic text-white uppercase mb-8">Adaptive <span className="text-cyan-500">Calibration</span></h2>
             
             <form onSubmit={handleConfigSubmit} className="space-y-8">
                
                {/* DOCTOR'S NOTE CARD */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20">
                   <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-cyan-400" />
                          <h4 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider">Medical Analysis</h4>
                      </div>
                      <span className="text-[10px] bg-cyan-500 text-white px-2 py-0.5 rounded font-mono uppercase tracking-widest">
                         AI Suggested
                      </span>
                   </div>
                   <div className="flex items-end gap-4 mb-3">
                      <span className="text-5xl font-black italic text-white">{recommendedGoal}L</span>
                      <p className="text-xs text-slate-400 mb-2 max-w-[250px] leading-relaxed">
                         {medicalNote}
                      </p>
                   </div>
                </div>

                {/* User Override */}
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-[0.2em]">
                          Manual Override
                       </label>
                   </div>
                   <LiquidSlider 
                      value={goal} 
                      onChange={setGoal} 
                      min={2} 
                      max={6} 
                      step={0.5} 
                      unit="L" 
                      label="TARGET GOAL" 
                   />
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={() => setGoal(recommendedGoal)} className="flex-1 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded-xl font-bold uppercase tracking-wider transition-all text-xs">
                        Accept Recommended ({recommendedGoal}L)
                    </button>
                    <button type="submit" className="flex-1 py-4 bg-white hover:bg-cyan-400 text-slate-950 rounded-xl font-black italic uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 text-xs">
                        Initialize <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
             </form>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center animate-fade-in pb-20">
      
      {/* CELEBRATION OVERLAY */}
      <div className={`fixed inset-0 z-[9999] bg-cyan-600 transition-all duration-[2000ms] pointer-events-none flex items-center justify-center overflow-hidden ${isCelebrating ? 'h-full opacity-100' : 'h-0 opacity-0'}`}>
         {/* Confetti logic... */}
         <div className="text-center z-10 transform scale-150 animate-bounce">
            <h1 className="text-6xl sm:text-9xl font-black italic text-white drop-shadow-lg tracking-tighter">HYDRATED</h1>
         </div>
      </div>

      {/* LEFT: SLOTS & WEATHER DASHBOARD */}
      <div className="order-2 lg:order-1 h-[500px] lg:h-[600px] flex flex-col">
         
         {/* WEATHER WIDGET */}
         <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-white/10 rounded-xl shadow-sm">
                  {weather.loading ? <Loader2 className="w-6 h-6 animate-spin text-cyan-500" /> : 
                   weather.temp > 25 ? <Sun className="w-6 h-6 text-amber-500" /> : 
                   <CloudRain className="w-6 h-6 text-blue-500" />}
               </div>
               <div>
                  <div className="flex items-center gap-2">
                     <span className="text-2xl font-black italic text-white">{weather.loading ? "--" : weather.temp}°C</span>
                     <div className="h-4 w-px bg-white/20" />
                     <span className="text-sm font-mono text-slate-400 flex items-center gap-1">
                        <Droplet className="w-3 h-3" /> {weather.loading ? "--" : weather.humidity}% RH
                     </span>
                  </div>
                  <p className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest mt-1">
                     {weather.loading ? "Scanning Environment..." : weather.locationName.toUpperCase()}
                  </p>
               </div>
            </div>
            
            {/* CONTROLS */}
            <div className="flex items-center gap-2">
                <button 
                  onClick={refreshWeather}
                  disabled={weather.loading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-all disabled:opacity-50"
                  title="Refresh Weather"
                >
                   <RefreshCw className={`w-3.5 h-3.5 text-slate-300 ${weather.loading ? 'animate-spin' : ''}`} />
                   <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider hidden sm:inline">Refresh</span>
                </button>
                <button onClick={() => { setShowConfig(true); playOrbitSound('click'); }} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                   <Settings className="w-5 h-5 text-slate-400" />
                </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar relative">
            {slots.map((slot) => {
               const isDone = progress.includes(slot.id);
               return (
                  <button 
                     key={slot.id}
                     onClick={() => toggleSlot(slot.id)}
                     disabled={isDone}
                     className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${isDone ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-slate-950/80 border-white/5 hover:border-cyan-400'}`}
                  >
                     <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-slate-700 text-transparent group-hover:border-cyan-400'}`}>
                           <Check className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                           <div className="flex items-center gap-2">
                              <p className={`text-lg font-black font-mono tracking-tight ${isDone ? 'text-cyan-400' : 'text-slate-300'}`}>{slot.time}</p>
                              <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 ${isDone ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-slate-500'}`}>
                                 {slot.icon} {slot.label}
                              </div>
                           </div>
                           <p className="text-[9px] text-slate-400 uppercase tracking-widest">500ML Unit</p>
                        </div>
                     </div>
                     {isDone && <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent w-full h-full" />}
                  </button>
               )
            })}
         </div>
      </div>

      {/* RIGHT: REALISTIC GLASS */}
      <div className="order-1 lg:order-2 flex flex-col items-center justify-center relative">
         {/* Simulated Drop */}
         <div className={`absolute top-0 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in ${activeDrop ? 'translate-y-[300px] opacity-0 scale-50' : '-translate-y-20 opacity-100 scale-100'}`}>
            <div className={`w-6 h-6 bg-cyan-400 rounded-tr-full rounded-bl-full rounded-br-full rotate-45 shadow-[0_0_15px_#22d3ee] ${activeDrop ? 'block' : 'hidden'}`} />
         </div>

         {/* The Glass Container */}
         <div className="relative w-48 h-80 sm:w-60 sm:h-96 rounded-b-[4rem] border-x-4 border-b-[12px] border-white/20 bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-hidden">
            <div className="absolute top-0 left-2 w-2 h-full bg-white/20 rounded-full blur-[2px]" />
            <div 
               className="absolute bottom-0 left-0 w-full bg-cyan-500/80 transition-all duration-1000 ease-in-out flex items-start justify-center overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.2)]"
               style={{ height: `${percentage}%` }}
            >
               <div className="absolute top-0 w-[200%] h-4 bg-cyan-400 opacity-50 animate-shimmer" style={{ transform: 'translateY(-50%)' }} />
               {/* Bubbles */}
               <div className="absolute inset-0 w-full h-full">
                  {Array.from({length: 8}).map((_, i) => (
                     <div key={i} className="absolute bg-white/40 rounded-full animate-float" 
                          style={{ width: Math.random() * 8 + 'px', height: Math.random() * 8 + 'px', left: Math.random() * 100 + '%', bottom: '-20px', animationDuration: Math.random() * 3 + 2 + 's' }} 
                     />
                  ))}
               </div>
            </div>
            <div className="absolute inset-0 pointer-events-none">
               {[25, 50, 75].map(tick => (<div key={tick} className="absolute w-4 h-0.5 bg-white/30 right-0" style={{ bottom: `${tick}%` }} />))}
            </div>
         </div>

         <div className="w-40 h-4 bg-black/20 blur-xl rounded-[100%] mt-8" />
         
         <div className="mt-8 text-center">
            <h3 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tabular-nums">
               {(completedCount * 0.5).toFixed(1)} <span className="text-lg text-slate-500 not-italic">/ {goal}L</span>
            </h3>
            <div className="flex items-center justify-center gap-2 mt-2 text-[9px] font-mono text-cyan-600 uppercase tracking-widest animate-pulse">
               <Dna className="w-3 h-3" /> Adaptive Target
            </div>
         </div>
      </div>
    </div>
  );
};