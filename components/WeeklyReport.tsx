
import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { WeekSchedule, ScheduleSlot, WeeklyStats, DailyStat, Category } from '../types';
import { Activity, Zap, Brain, Grid, Cpu, Terminal as TerminalIcon, Database, Calendar, Flame, Layers, History, BarChart2 } from 'lucide-react';

interface WeeklyReportProps {
  schedule: WeekSchedule;
  lastWeekStats?: WeeklyStats;
  reportArchive?: WeeklyStats[];
  dailyStats?: Record<string, DailyStat>; // "YYYY-MM-DD": {c, t}
}

const CATEGORY_COLORS: Record<string, string> = {
  Physical: '#f97316', // Orange
  Academic: '#06b6d4', // Cyan
  Coding: '#10b981',   // Emerald
  Creative: '#d946ef', // Fuchsia
  Rest: '#6366f1',     // Indigo
  Logistics: '#64748b' // Slate
};

// Heatmap Helper: Generate array of last 100 days
const getHeatmapDays = (history: Record<string, DailyStat>) => {
    const days = [];
    const today = new Date();
    // Go back 16 weeks (approx 4 months) to fill a nice grid
    const weeksToShow = 16;
    const totalDays = weeksToShow * 7; 
    
    // Find the start date (ensure it starts on a Monday for alignment)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays);
    // Adjust to previous Monday
    const dayOfWeek = startDate.getDay();
    const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startDate.setDate(diff);

    for (let i = 0; i < totalDays; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        const stat = history[iso];
        const percentage = stat && stat.t > 0 ? Math.round((stat.c / stat.t) * 100) : 0;
        
        days.push({
            date: iso,
            percentage,
            dayIndex: d.getDay(), // 0=Sun, 1=Mon
            month: d.toLocaleString('default', { month: 'short' }),
            isToday: iso === (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'))
        });
    }
    return days;
};

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ schedule, lastWeekStats, reportArchive = [], dailyStats = {} }) => {
  
  // --- 1. DATA PROCESSING ---
  const analytics = useMemo(() => {
    const categoryStats: Record<string, { total: number; completed: number }> = {};
    let grandTotal = 0;
    let grandCompleted = 0;

    // Process Categories (Current Week)
    Object.values(schedule).flat().forEach((slot: ScheduleSlot) => {
      if (!categoryStats[slot.category]) categoryStats[slot.category] = { total: 0, completed: 0 };
      categoryStats[slot.category].total += 1;
      grandTotal += 1;
      if (slot.isCompleted) {
        categoryStats[slot.category].completed += 1;
        grandCompleted += 1;
      }
    });

    const chartData = Object.keys(categoryStats).map(cat => {
      const { total, completed } = categoryStats[cat];
      return {
        name: cat,
        value: total, // Use total slots for Pie Chart distribution
        completed,
        percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
      };
    }).filter(d => d.value > 0);

    // Filter for Radar Chart (exclude Logistics maybe?)
    const radarData = chartData.map(d => ({
        subject: d.name,
        A: d.percentage,
        fullMark: 100
    }));

    const overallScore = grandTotal === 0 ? 0 : Math.round((grandCompleted / grandTotal) * 100);

    // AI Insight
    let insight = "SYSTEM AWAITING DATA INPUT...";
    if (overallScore > 80) insight = "ORBIT STABLE. NEURAL SYNC OPTIMAL. MOMENTUM IS CRITICAL.";
    else if (overallScore > 50) insight = "SYSTEM OPERATIONAL. EFFICIENCY FLUCTUATIONS DETECTED.";
    else if (grandTotal > 0) insight = "SYNC DEGRADED. RE-INITIALIZE CORE ROUTINES IMMEDIATELY.";

    return { chartData, radarData, overallScore, insight };
  }, [schedule]);

  // --- 2. STREAK CALCULATION ---
  const streakData = useMemo(() => {
      const dates = Object.keys(dailyStats).sort();
      let currentStreak = 0;
      
      // Calculate active streak walking backwards from today
      const today = new Date();
      // Only verify up to yesterday for strict streak, or include today if active
      // Simple logic: consecutive days with > 0 completion
      
      // We iterate backward
      for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          const stat = dailyStats[iso];
          
          if (stat && stat.c > 0) {
              currentStreak++;
          } else if (i === 0) {
              // If today is 0, we don't break streak yet (day just started)
              continue;
          } else {
              break; 
          }
      }
      return { current: currentStreak };
  }, [dailyStats]);

  // --- 3. VELOCITY DATA (Last 7 Days) ---
  const velocityData = useMemo(() => {
      const data = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          const stat = dailyStats[iso];
          const percentage = stat && stat.t > 0 ? Math.round((stat.c / stat.t) * 100) : 0;
          
          data.push({
              day: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
              date: iso,
              percentage,
              completed: stat?.c || 0,
              total: stat?.t || 0
          });
      }
      return data;
  }, [dailyStats]);

  // --- 4. HEATMAP DATA ---
  const heatmapCells = useMemo(() => getHeatmapDays(dailyStats), [dailyStats]);

  // Custom Tooltips
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="font-bold text-white font-mono uppercase tracking-widest text-[10px] mb-1">{data.name}</p>
          <div className="text-xs text-slate-400 font-mono">
             Allocated: <span className="text-white font-bold">{data.value} Blocks</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
             Efficiency: <span className="text-cyan-400 font-bold">{data.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const VelocityTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
          const d = payload[0].payload;
          return (
              <div className="bg-[#050505] border border-white/10 p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">{d.day} • {d.date}</div>
                  <div className="flex items-center gap-2">
                      <div className={`text-2xl font-black italic tracking-tighter ${d.percentage >= 80 ? 'text-emerald-400' : d.percentage >= 50 ? 'text-cyan-400' : 'text-red-400'}`}>
                          {d.percentage}%
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                          {d.completed}/{d.total} TASKS
                      </div>
                  </div>
              </div>
          );
      }
      return null;
  };

  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8 pb-32">
      
      {/* --- HERO: VISUAL ANALYTICS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. STREAK & HEADER */}
          <div className="col-span-1 p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-orange-900/10 to-red-900/10 border border-orange-500/20 relative overflow-hidden flex flex-col justify-between h-full min-h-[250px]">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
              <div className="relative z-10">
                  <div className="flex items-center gap-2 text-orange-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-2">
                      <Flame className="w-4 h-4 animate-pulse" /> Kinetic Streak
                  </div>
                  <div className="flex items-baseline gap-2">
                      <h2 className="text-7xl font-black italic text-white tracking-tighter drop-shadow-lg">{streakData.current}</h2>
                      <span className="text-sm font-bold text-orange-400 uppercase tracking-widest">Days Active</span>
                  </div>
              </div>
              <div className="relative z-10 mt-6">
                  <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-red-600 w-full animate-shimmer" />
                  </div>
                  <p className="text-[9px] text-orange-400/60 font-mono mt-2 uppercase tracking-widest text-right">Momentum Critical</p>
              </div>
              
              {/* Background FX */}
              <div className="absolute -bottom-10 -right-10 text-orange-500/10">
                  <Flame className="w-48 h-48" />
              </div>
          </div>

          {/* 2. CATEGORY BREAKDOWN (DONUT CHART) */}
          <div className="col-span-1 lg:col-span-2 p-6 sm:p-8 rounded-[2rem] bg-[#0a0a0a] border border-white/10 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5"><Layers className="w-24 h-24 text-cyan-500" /></div>
              
              {/* Chart */}
              <div className="relative w-48 h-48 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={analytics.chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                          >
                              {analytics.chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#333'} />
                              ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                  </ResponsiveContainer>
                  {/* Center Stat */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-black italic text-white">{analytics.overallScore}%</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Efficiency</span>
                  </div>
              </div>

              {/* Legend & Stats */}
              <div className="flex-1 w-full">
                  <h3 className="text-lg font-black italic text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-500" /> Time Distribution
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                      {analytics.chartData.map(d => (
                          <div key={d.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                              <div className="w-1 h-8 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[d.name] }} />
                              <div>
                                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wide group-hover:text-white">{d.name}</div>
                                  <div className="text-[9px] font-mono text-slate-500">
                                      {d.percentage}% Comp.
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* --- DAILY VELOCITY CHART --- */}
      <div className="p-6 sm:p-8 rounded-[2rem] bg-[#08080a] border border-white/10 relative overflow-hidden group shadow-xl">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 relative z-10 gap-4">
              <div>
                  <div className="flex items-center gap-2 text-blue-400 font-mono text-[10px] uppercase tracking-[0.3em] mb-2">
                      <BarChart2 className="w-4 h-4" /> Kinetic Velocity
                  </div>
                  <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">Daily Throughput</h3>
              </div>
              <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">Last 7 Cycles</div>
              </div>
          </div>

          <div className="h-64 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={velocityData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }} barSize={36}>
                      <defs>
                          <linearGradient id="barGradientHigh" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#34d399" stopOpacity={1}/>
                              <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                          </linearGradient>
                          <linearGradient id="barGradientMid" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22d3ee" stopOpacity={1}/>
                              <stop offset="100%" stopColor="#0891b2" stopOpacity={0.6}/>
                          </linearGradient>
                          <linearGradient id="barGradientLow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f87171" stopOpacity={1}/>
                              <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.6}/>
                          </linearGradient>
                      </defs>
                      <XAxis 
                          dataKey="day" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 'bold' }} 
                          dy={10}
                      />
                      <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#475569', fontSize: 9, fontFamily: 'Space Grotesk' }} 
                          domain={[0, 100]}
                      />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }} content={<VelocityTooltip />} />
                      <Bar dataKey="percentage" radius={[8, 8, 8, 8]}>
                          {velocityData.map((entry, index) => (
                              <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.percentage >= 80 ? 'url(#barGradientHigh)' : entry.percentage >= 50 ? 'url(#barGradientMid)' : 'url(#barGradientLow)'} 
                                  strokeWidth={0}
                              />
                          ))}
                      </Bar>
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>

      {/* --- HEATMAP CALENDAR --- */}
      <div className="p-6 sm:p-8 rounded-[2rem] bg-[#050505] border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-2 text-emerald-500 font-mono text-[10px] uppercase tracking-[0.3em]">
                  <Grid className="w-4 h-4" /> Neural Activity Log
              </div>
              <div className="flex gap-1">
                  {[0, 25, 50, 75, 100].map(opacity => (
                      <div key={opacity} className="w-3 h-3 rounded-sm" style={{ backgroundColor: opacity === 0 ? '#1e293b' : `rgba(16, 185, 129, ${opacity / 100})` }} />
                  ))}
              </div>
          </div>

          <div className="relative z-10 overflow-x-auto custom-scrollbar pb-2">
              <div className="flex gap-1 min-w-max">
                  {/* We need to render columns (weeks). So chunk the days by 7 */}
                  {Array.from({ length: Math.ceil(heatmapCells.length / 7) }).map((_, colIndex) => (
                      <div key={colIndex} className="flex flex-col gap-1">
                          {heatmapCells.slice(colIndex * 7, (colIndex + 1) * 7).map((day) => {
                              const intensity = day.percentage === 0 ? 0 : 
                                                day.percentage < 40 ? 0.3 : 
                                                day.percentage < 70 ? 0.6 : 
                                                day.percentage < 90 ? 0.8 : 1;
                              
                              return (
                                  <div 
                                      key={day.date}
                                      className={`w-3 h-3 sm:w-4 sm:h-4 rounded-[2px] sm:rounded-sm transition-all duration-300 group relative ${intensity === 0 ? 'bg-slate-800/50' : 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.4)]'}`}
                                      style={{ opacity: intensity || 1 }}
                                  >
                                      {/* Tooltip */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                                          <div className="bg-black text-white text-[9px] font-mono px-2 py-1 rounded border border-white/20 whitespace-nowrap">
                                              {day.date}: {day.percentage}%
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* --- RADAR CHART (FOCUS) --- */}
      <div className="p-6 sm:p-8 rounded-[2rem] bg-slate-900/30 border border-white/5 relative overflow-hidden">
          <h3 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-[0.2em] mb-6 text-center">
             Attribute Matrix
          </h3>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analytics.radarData}>
                     <PolarGrid stroke="#334155" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Space Grotesk' }} />
                     <Radar name="Orbit" dataKey="A" stroke="#d946ef" strokeWidth={2} fill="#d946ef" fillOpacity={0.2} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontFamily: 'Space Grotesk' }}
                     />
                 </RadarChart>
             </ResponsiveContainer>
          </div>
      </div>

      {/* --- ARCHIVE SECTION (Old Logic) --- */}
      <div className="space-y-6 pt-6 border-t border-white/5 opacity-60 hover:opacity-100 transition-opacity">
          <h3 className="text-sm font-black italic text-slate-500 uppercase tracking-tighter flex items-center gap-2">
              <Database className="w-4 h-4" /> Legacy Data Logs
          </h3>
          <div className="p-6 rounded-[2rem] bg-[#050505] border border-white/10 flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar">
              {reportArchive.length === 0 ? (
                  <div className="h-24 flex flex-col items-center justify-center text-slate-600">
                      <History className="w-6 h-6 mb-2 opacity-50" />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Vault Empty</span>
                  </div>
              ) : (
                  [...reportArchive].reverse().map((report, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all mb-2">
                          <div className="flex items-center gap-3">
                              <div className="text-xs font-bold text-white uppercase tracking-wide">
                                  Week of {new Date(report.weekStart).getDate()} {report.month.substring(0,3)}
                              </div>
                              <span className="w-px h-3 bg-white/20" />
                              <div className="text-[10px] font-mono text-cyan-400">{report.percentage}% EFFICIENCY</div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>

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
