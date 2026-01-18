
import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area, YAxis } from 'recharts';
import { WeekSchedule, ScheduleSlot, WeeklyStats, Category } from '../types';
import { AlertTriangle, Award, Activity, Crosshair, History, Zap, Brain, TrendingUp, Grid, Cpu, Terminal as TerminalIcon, Shield } from 'lucide-react';

interface WeeklyReportProps {
  schedule: WeekSchedule;
  lastWeekStats?: WeeklyStats;
}

const CATEGORY_COLORS: Record<string, string> = {
  Physical: '#f97316', // Orange
  Academic: '#06b6d4', // Cyan
  Coding: '#10b981',   // Emerald
  Creative: '#d946ef', // Fuchsia
  Rest: '#6366f1',     // Indigo
  Logistics: '#64748b' // Slate
};

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ schedule, lastWeekStats }) => {
  
  // --- 1. DATA PROCESSING ENGINE ---
  const analytics = useMemo(() => {
    const categoryStats: Record<string, { total: number; completed: number }> = {};
    const dailyStats: { day: string; percentage: number; total: number }[] = [];
    let grandTotal = 0;
    let grandCompleted = 0;

    // Process Categories
    Object.values(schedule).flat().forEach((slot: ScheduleSlot) => {
      if (!categoryStats[slot.category]) categoryStats[slot.category] = { total: 0, completed: 0 };
      categoryStats[slot.category].total += 1;
      grandTotal += 1;
      if (slot.isCompleted) {
        categoryStats[slot.category].completed += 1;
        grandCompleted += 1;
      }
    });

    // Process Daily Heatmap
    Object.keys(schedule).forEach(day => {
      const slots = schedule[day];
      const dayTotal = slots.length;
      const dayCompleted = slots.filter(s => s.isCompleted).length;
      dailyStats.push({
        day: day.substring(0, 3),
        total: dayTotal,
        percentage: dayTotal === 0 ? 0 : Math.round((dayCompleted / dayTotal) * 100)
      });
    });

    const chartData = Object.keys(categoryStats).map(cat => {
      const { total, completed } = categoryStats[cat];
      return {
        name: cat,
        completed,
        total,
        percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
        fullMark: 100,
      };
    }).filter(d => d.name !== 'Logistics'); // Hide logistics from main charts for clarity

    const overallScore = grandTotal === 0 ? 0 : Math.round((grandCompleted / grandTotal) * 100);

    // AI Insight Logic
    const sorted = [...chartData].sort((a, b) => b.percentage - a.percentage);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    let insight = "SYSTEM AWAITING DATA INPUT...";
    if (overallScore > 80) insight = "ORBIT STABLE. NEURAL SYNC OPTIMAL. MOMENTUM IS CRITICAL.";
    else if (overallScore > 50) insight = "SYSTEM OPERATIONAL. EFFICIENCY FLUCTUATIONS DETECTED.";
    else if (grandTotal > 0) insight = "SYNC DEGRADED. RE-INITIALIZE CORE ROUTINES IMMEDIATELY.";

    return { chartData, dailyStats, overallScore, best, worst, insight };
  }, [schedule]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="font-bold text-slate-700 dark:text-white font-mono uppercase tracking-widest text-[9px] mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill || '#22d3ee' }} />
            <p className="text-lg font-black text-slate-900 dark:text-white">{payload[0].value}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6 pb-32">
      
      {/* --- ROW 1: ORBIT RESONANCE & HEATMAP --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* A. ORBIT RESONANCE GAUGE (HERO) */}
        <div className="lg:col-span-1 relative group p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[300px]">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent" />
          
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            {/* Rotating Outer Rings */}
            <div className="absolute inset-0 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-full animate-spin-slow" />
            <div className="absolute inset-4 border border-cyan-500/20 rounded-full animate-spin-fast" style={{ animationDirection: 'reverse' }} />
            
            {/* SVG Progress Circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="50%" cy="50%" r="40%" className="fill-none stroke-slate-100 dark:stroke-slate-900 stroke-[12]" />
              <circle 
                cx="50%" cy="50%" r="40%" 
                className="fill-none stroke-cyan-500 stroke-[12] transition-all duration-1000 ease-out"
                strokeDasharray="251"
                strokeDashoffset={251 - (251 * analytics.overallScore) / 100}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.5))' }}
              />
            </svg>

            {/* Center Data */}
            <div className="flex flex-col items-center z-10">
               <Zap className="w-6 h-6 text-cyan-400 mb-1 animate-pulse" />
               <span className="text-5xl sm:text-6xl font-black italic text-slate-900 dark:text-white tracking-tighter">{analytics.overallScore}</span>
               <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-500 uppercase tracking-widest mt-1">Resonance</span>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <Activity className="w-3 h-3 text-green-500 dark:text-green-400" />
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              System Status: <span className="text-slate-900 dark:text-white font-bold">{analytics.overallScore > 80 ? 'OVERDRIVE' : analytics.overallScore > 50 ? 'NOMINAL' : 'OFFLINE'}</span>
            </span>
          </div>
        </div>

        {/* B. TEMPORAL HEATMAP & INSIGHT TERMINAL */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
          
          {/* Heatmap Card */}
          <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden backdrop-blur-md shadow-sm">
             <div className="absolute top-0 right-0 p-6 opacity-5"><CalendarGrid /></div>
             <h3 className="text-xs sm:text-sm font-mono text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                <Grid className="w-4 h-4 text-purple-400" /> Temporal Consistency
             </h3>
             
             <div className="flex items-end justify-between gap-1 sm:gap-2 h-32 sm:h-40 w-full">
                {analytics.dailyStats.map((stat, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end group gap-2">
                     <div className="w-full relative">
                        <div 
                          className={`w-full rounded-sm transition-all duration-700 ${
                            stat.percentage === 0 ? 'bg-slate-200 dark:bg-slate-900 h-1' : 
                            stat.percentage < 40 ? 'bg-purple-300 dark:bg-purple-900/40 shadow-[0_0_5px_rgba(88,28,135,0.2)]' : 
                            stat.percentage < 80 ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 
                            'bg-slate-900 dark:bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)]'
                          }`}
                          style={{ height: `${Math.max(stat.percentage, 5)}%` }}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[9px] px-2 py-1 rounded font-mono">
                          {stat.percentage}%
                        </div>
                     </div>
                     <span className="text-[8px] sm:text-[10px] text-center font-mono text-slate-400 dark:text-slate-600 uppercase group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                        {stat.day}
                     </span>
                  </div>
                ))}
             </div>
          </div>

          {/* Neural Insight Terminal */}
          <div className="bg-slate-50 dark:bg-black border border-emerald-500/20 rounded-2xl p-4 sm:p-6 font-mono relative overflow-hidden group">
             <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex items-start gap-3 relative z-10">
               <TerminalIcon className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
               <div className="space-y-1">
                 <p className="text-[10px] text-emerald-600/60 dark:text-emerald-500/60 uppercase tracking-widest">Sys_Admin_Log // {new Date().toLocaleDateString()}</p>
                 <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 uppercase leading-relaxed typing-effect">
                   {">"} {analytics.insight}
                 </p>
                 {analytics.best && (
                   <p className="text-[10px] text-slate-500 mt-2">
                     {">"} DOMINANT PROTOCOL: <span className="text-slate-900 dark:text-white">{analytics.best.name} ({analytics.best.percentage}%)</span>
                   </p>
                 )}
                 {analytics.worst && (
                    <p className="text-[10px] text-slate-500">
                      {">"} SYSTEM FAILURE: <span className="text-red-500 dark:text-red-400">{analytics.worst.name} ({analytics.worst.percentage}%)</span>
                    </p>
                 )}
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- ROW 2: ADVANCED METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* C. FREQUENCY VISUALIZER (BAR CHART REDESIGN) */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-6 sm:p-8 rounded-[2.5rem] relative overflow-hidden shadow-lg">
          <div className="absolute -right-10 -bottom-10 opacity-5">
             <TrendingUp className="w-48 h-48 text-cyan-500" />
          </div>
          <h3 className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" /> Protocol Output Levels
          </h3>
          <div className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.chartData} barGap={0} barCategoryGap="20%">
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{fill: '#94a3b8', fontFamily: 'Space Grotesk', fontSize: 9}}
                  dy={10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
                <Bar dataKey="percentage" radius={[2, 2, 0, 0]}>
                  {analytics.chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.name] || '#ffffff'} 
                      className="opacity-80 hover:opacity-100 transition-all cursor-pointer hover:filter drop-shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:hover:filter dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* D. FOCUS VECTOR (RADAR CHART REDESIGN) */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-6 sm:p-8 rounded-[2.5rem] relative overflow-hidden shadow-lg flex flex-col">
          <div className="absolute top-0 right-0 p-6 opacity-10">
             <Crosshair className="w-16 h-16 text-emerald-500 animate-spin-slow" />
          </div>
          <h3 className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mb-2">
            Life Balance Matrix
          </h3>
          <p className="text-[9px] text-emerald-600/60 dark:text-emerald-500/60 mb-4 font-mono uppercase tracking-widest">Targeting Optimization</p>
          
          <div className="flex-1 min-h-[250px] w-full relative">
             {/* Background Target UI */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
               <div className="w-[70%] h-[70%] border border-emerald-500/30 rounded-full" />
               <div className="w-[40%] h-[40%] border border-emerald-500/30 rounded-full" />
               <div className="w-full h-[1px] bg-emerald-500/20 absolute top-1/2 left-0" />
               <div className="h-full w-[1px] bg-emerald-500/20 absolute top-0 left-1/2" />
             </div>

             <ResponsiveContainer width="100%" height="100%">
               <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analytics.chartData}>
                 <PolarGrid stroke="#94a3b8" strokeOpacity={0.3} />
                 <PolarAngleAxis 
                   dataKey="name" 
                   tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'Space Grotesk' }} 
                 />
                 <Radar 
                   name="Stats" 
                   dataKey="percentage" 
                   stroke="#10b981" 
                   strokeWidth={2}
                   fill="#10b981" 
                   fillOpacity={0.2} 
                 />
                 <Tooltip content={<CustomTooltip />} />
               </RadarChart>
             </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- ROW 3: ARCHIVE DATA (CONDENSED) --- */}
      {lastWeekStats && (
        <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-400"><History className="w-4 h-4" /></div>
               <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Archive: Last Cycle</h4>
                  <p className="text-[9px] text-slate-500 font-mono">{lastWeekStats.dateRange}</p>
               </div>
            </div>
            <div className="text-right">
               <span className="text-xl font-black italic text-slate-700 dark:text-slate-300">{lastWeekStats.percentage}%</span>
               <span className="text-[9px] text-slate-500 dark:text-slate-600 block uppercase">Efficiency</span>
            </div>
        </div>
      )}

    </div>
  );
};

// Helper Graphic
const CalendarGrid = () => (
  <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-50">
     <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
           <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-500"/>
        </pattern>
     </defs>
     <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);
