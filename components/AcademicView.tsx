
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClassSession, ClassType, UniversitySchedule } from '../types';
import { MapPin, Zap, Edit3, Trash2, X, Plus, Sparkles, CheckCircle2, BookOpen, Clock, User, Navigation, ChevronRight, ArrowRight, Scan, Fingerprint, Calendar, Rocket, Lock, Radio } from 'lucide-react';
import { LiquidSlider } from './LiquidSlider';
import { LiquidTabs } from './LiquidTabs';
import { playOrbitSound } from '../utils/audio';

interface AcademicViewProps {
    schedule: UniversitySchedule;
    onAddClass: (day: string, classData: ClassSession) => void;
    onEditClass: (day: string, classData: ClassSession) => void;
    onDeleteClass: (day: string, classId: string) => void;
    userAvatar?: string;
}

// --- CONFIG ---

const TYPE_THEMES: Record<ClassType, { primary: string, secondary: string, bgGradient: string, glow: string, icon: any, label: string, text: string, subText: string, activeBorder: string }> = {
  Lecture: { 
      primary: '#f97316', // Orange
      secondary: '#c2410c', 
      bgGradient: 'from-orange-500 to-red-600',
      glow: 'shadow-[0_0_30px_rgba(249,115,22,0.4)]',
      icon: Zap,
      label: 'THEORY',
      text: 'text-orange-100',
      subText: 'text-orange-300',
      activeBorder: 'border-orange-400 ring-1 ring-orange-500/50'
  },
  Lab: { 
      primary: '#8b5cf6', // Purple
      secondary: '#6d28d9', 
      bgGradient: 'from-purple-600 to-indigo-600',
      glow: 'shadow-[0_0_30px_rgba(139,92,246,0.4)]',
      icon: Sparkles,
      label: 'LAB',
      text: 'text-purple-100',
      subText: 'text-purple-300',
      activeBorder: 'border-purple-400 ring-1 ring-purple-500/50'
  },
  Tutorial: { 
      primary: '#06b6d4', // Cyan
      secondary: '#0891b2', 
      bgGradient: 'from-cyan-500 to-teal-500',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.4)]',
      icon: BookOpen,
      label: 'TUT',
      text: 'text-cyan-100',
      subText: 'text-cyan-300',
      activeBorder: 'border-cyan-400 ring-1 ring-cyan-500/50'
  }
};

const getMinutes = (timeStr: string) => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);
  if (!match) return 0;
  let [_, h, m, p] = match;
  let hours = parseInt(h);
  if (p.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (p.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + parseInt(m);
};

// --- SUB-COMPONENTS ---

const CosmicBackground = React.memo(() => (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Base Layer - Deep Void */}
        <div className="absolute inset-0 bg-[#030014]" />

        {/* Animated Aurora Gradient */}
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] opacity-[0.05]"
            style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, #8b5cf6 90deg, transparent 180deg, #06b6d4 270deg, transparent 360deg)',
                filter: 'blur(100px)'
            }}
        />

        {/* Moving Gradient Orbs */}
        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                x: [-50, 50, -50],
                y: [-50, 50, -50],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen"
        />
        
        <motion.div
            animate={{
                scale: [1.2, 1, 1.2],
                x: [50, -50, 50],
                y: [50, -50, 50],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] right-[-20%] w-[60vw] h-[60vw] bg-cyan-500/10 rounded-full blur-[120px] mix-blend-screen"
        />

        <motion.div
            animate={{
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-10%] left-[20%] w-[80vw] h-[80vw] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen"
        />

        {/* Subtle Grid Lines (Replaces Dots with a faint high-tech mesh) */}
        <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
                backgroundSize: '120px 120px',
                maskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 100%)'
            }}
        />
        
        {/* Cinematic Noise */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
    </div>
));

// --- MAIN VIEW ---

export const AcademicView: React.FC<AcademicViewProps> = ({ schedule, onAddClass, onEditClass, onDeleteClass, userAvatar }) => {
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const d = new Date().getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d] === 'Sunday' ? 'Monday' : days[d];
  });
  
  const [realTime, setRealTime] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // Path Traversal State
  const pathRef = useRef<SVGPathElement>(null);
  const [travelerPos, setTravelerPos] = useState({ x: 200, y: 0, angle: 0 });
  const [nodeLengths, setNodeLengths] = useState<number[]>([]);
  const [isTraveling, setIsTraveling] = useState(false); 
  
  // Inspect Mode State
  const [inspectingNode, setInspectingNode] = useState<any | null>(null);
  
  // Mobile Check
  const [isMobile, setIsMobile] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<ClassType>('Lecture');
  const [professor, setProfessor] = useState('');
  const [venue, setVenue] = useState('');
  const [batch, setBatch] = useState('');
  const [sHour, setSHour] = useState(9);
  const [sMin, setSMin] = useState(0);
  const [sAmpm, setSAmpm] = useState<'AM'|'PM'>('AM');
  const [eHour, setEHour] = useState(10);
  const [eMin, setEMin] = useState(0);
  const [eAmpm, setEAmpm] = useState<'AM'|'PM'>('AM');

  useEffect(() => {
    const timer = setInterval(() => setRealTime(new Date()), 30000); 
    return () => clearInterval(timer);
  }, []);

  // Responsive Check
  useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 640);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentMinutes = realTime.getHours() * 60 + realTime.getMinutes();
  const dayTabs = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => ({ id: d, label: d.slice(0, 3) })), []);

  // --- PATH GENERATION LOGIC ---
  const { pathD, nodes, totalHeight, activeNodeIndex, progressPercent, nextMilestone, firstFutureIndex } = useMemo(() => {
      const classes = [...(schedule[selectedDay] || [])].sort((a, b) => getMinutes(a.startTime) - getMinutes(b.startTime));
      
      // Safety Vertical config: Lower start point to avoid top clipping
      const START_Y = 160; 
      const SPACING_Y = isMobile ? 140 : 240; 
      
      // Amplitude config: High Curve for Mobile
      const WAVE_AMP = isMobile ? 75 : 160; 
      
      const CANVAS_WIDTH = 400; 
      const CENTER_X = CANVAS_WIDTH / 2;

      // The path line starts higher up (Y=80)
      let pathString = `M ${CENTER_X} 80`; 
      
      const nodeList = classes.map((cls, idx) => {
          const isLeft = idx % 2 === 0;
          const x = isLeft ? CENTER_X - WAVE_AMP : CENTER_X + WAVE_AMP;
          const y = START_Y + (idx * SPACING_Y);
          
          const start = getMinutes(cls.startTime);
          const end = getMinutes(cls.endTime);
          
          let status: 'past' | 'active' | 'future' = 'future';
          if (currentMinutes >= end) status = 'past';
          else if (currentMinutes >= start) status = 'active';
          
          return { ...cls, x, y, status, start, end };
      });

      // Construct Smooth Curve Path
      let prevX = CENTER_X;
      let prevY = 80;

      nodeList.forEach((node, i) => {
          const cpY = (prevY + node.y) / 2;
          pathString += ` Q ${prevX} ${cpY} ${(prevX + node.x)/2} ${cpY} T ${node.x} ${node.y}`;
          prevX = node.x;
          prevY = node.y;
      });

      if (nodeList.length > 0) {
          pathString += ` Q ${prevX} ${prevY + 100} ${CENTER_X} ${prevY + 200}`;
      } else {
          pathString += ` L ${CENTER_X} 360`;
      }

      const totalH = nodeList.length > 0 ? prevY + 300 : 400;

      const activeIdx = nodeList.findIndex(n => n.status === 'active');
      const nextIdx = nodeList.findIndex(n => n.status === 'future');
      const nextMilestone = activeIdx !== -1 ? nodeList[activeIdx] : (nextIdx !== -1 ? nodeList[nextIdx] : null);

      const dayStart = 8 * 60; 
      const dayEnd = 18 * 60; 
      const prog = Math.min(100, Math.max(0, ((currentMinutes - dayStart) / (dayEnd - dayStart)) * 100));

      return {
          pathD: pathString,
          nodes: nodeList,
          totalHeight: totalH,
          activeNodeIndex: activeIdx,
          progressPercent: Math.round(prog),
          nextMilestone,
          firstFutureIndex: nextIdx // Identify the first upcoming class
      };
  }, [schedule, selectedDay, currentMinutes, isMobile]);

  // --- PATH MEASUREMENT EFFECT ---
  useEffect(() => {
      if (!pathRef.current || nodes.length === 0) return;
      
      const totalLen = pathRef.current.getTotalLength();
      const lengths: number[] = [];
      let lastScan = 0;

      nodes.forEach(node => {
          let bestL = lastScan;
          let minDist = Infinity;
          
          for (let l = lastScan; l < totalLen; l += 5) {
              const p = pathRef.current!.getPointAtLength(l);
              const dist = Math.sqrt(Math.pow(p.x - node.x, 2) + Math.pow(p.y - node.y, 2));
              
              if (dist < minDist) {
                  minDist = dist;
                  bestL = l;
              }
              if (minDist < 10 && dist > minDist + 5) break; 
          }
          lengths.push(bestL);
          lastScan = bestL;
      });
      
      setNodeLengths(lengths);
  }, [pathD, nodes.length]);

  // --- AVATAR POSITION UPDATE EFFECT ---
  useEffect(() => {
      if (!pathRef.current || nodeLengths.length !== nodes.length) return;

      const updatePosition = () => {
          const path = pathRef.current!;
          const pathTotal = path.getTotalLength();
          
          let targetLength = 0;
          let isMoving = true;

          if (nodes.length === 0) {
              targetLength = 0;
              isMoving = false;
          } else {
              if (currentMinutes < nodes[0].start) {
                  const dayStart = 8 * 60; 
                  const ratio = Math.max(0, (currentMinutes - dayStart) / (nodes[0].start - dayStart));
                  targetLength = nodeLengths[0] * ratio;
                  if (targetLength < 0) targetLength = 0;
              } 
              else if (currentMinutes > nodes[nodes.length - 1].end) {
                  const lastL = nodeLengths[nodes.length - 1];
                  const dayEnd = 22 * 60; 
                  const ratio = Math.min(1, (currentMinutes - nodes[nodes.length - 1].end) / (dayEnd - nodes[nodes.length - 1].end));
                  targetLength = lastL + (pathTotal - lastL) * ratio;
              }
              else {
                  for (let i = 0; i < nodes.length; i++) {
                      const node = nodes[i];
                      if (currentMinutes >= node.start && currentMinutes <= node.end) {
                          targetLength = nodeLengths[i];
                          isMoving = false; 
                          break;
                      }
                      const nextNode = nodes[i+1];
                      if (nextNode && currentMinutes > node.end && currentMinutes < nextNode.start) {
                          const gapDuration = nextNode.start - node.end;
                          const timeInGap = currentMinutes - node.end;
                          const ratio = timeInGap / gapDuration;
                          const l1 = nodeLengths[i];
                          const l2 = nodeLengths[i+1];
                          targetLength = l1 + (l2 - l1) * ratio;
                          break;
                      }
                  }
              }
          }

          const p = path.getPointAtLength(targetLength);
          const pNext = path.getPointAtLength(Math.min(targetLength + 1, pathTotal));
          const angle = Math.atan2(pNext.y - p.y, pNext.x - p.x) * (180 / Math.PI);

          setTravelerPos({ x: p.x, y: p.y, angle });
          setIsTraveling(isMoving);
      };

      updatePosition();
  }, [currentMinutes, nodeLengths, nodes]);

  const openForm = (cls?: ClassSession) => {
      playOrbitSound('click');
      if (cls) {
          setEditingId(cls.id); setSubject(cls.subject); setType(cls.type);
          setProfessor(cls.professor); setVenue(cls.venue); setBatch(cls.batch);
          const parseTimeStr = (str: string) => {
              const m = str.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);
              if (m) {
                  const h = parseInt(m[1]);
                  const mVal = parseInt(m[2]);
                  const pVal = m[3].toUpperCase();
                  const p: 'AM' | 'PM' = (pVal === 'AM' || pVal === 'PM') ? pVal : 'AM';
                  return { h: h === 12 ? 0 : h, m: mVal, p };
              }
              return { h: 9, m: 0, p: 'AM' as const };
          };
          const s = parseTimeStr(cls.startTime);
          const e = parseTimeStr(cls.endTime);
          setSHour(s.h); setSMin(s.m); setSAmpm(s.p); 
          setEHour(e.h); setEMin(e.m); setEAmpm(e.p);
      } else {
          setEditingId(null); setSubject(''); setType('Lecture'); setProfessor(''); setVenue(''); setBatch('');
          setSHour(9); setSMin(0); setSAmpm('AM'); 
          setEHour(10); setEMin(0); setEAmpm('AM');
      }
      setIsFormOpen(true);
      setInspectingNode(null); 
  };

  const handleInspect = (node: any) => {
      setInspectingNode(node);
      playOrbitSound('power_up');
  };

  const handleSave = () => {
      if (!subject) return;
      playOrbitSound('success_chord');
      const sStr = `${sHour === 0 ? 12 : sHour}:${sMin.toString().padStart(2,'0')} ${sAmpm}`;
      const eStr = `${eHour === 0 ? 12 : eHour}:${eMin.toString().padStart(2,'0')} ${eAmpm}`;
      const payload: ClassSession = { id: editingId || `class-${Date.now()}`, subject, type, professor, venue, batch, startTime: sStr, endTime: eStr };
      if (editingId) onEditClass(selectedDay, payload); else onAddClass(selectedDay, payload);
      setIsFormOpen(false);
  };

  // Ensure blink animation only happens if we are actually viewing "Today"
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const isViewingToday = selectedDay === todayName;

  return (
    <div className="animate-fade-in-up relative min-h-screen flex flex-col font-sans text-white pb-32">
      
      <CosmicBackground />

      {/* HEADER */}
      <header className="relative z-40 flex flex-col gap-6 px-1 pt-2">
          <div className="flex items-center justify-between">
              <div className="size-10" />
              <div className="text-center">
                  <h1 className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase mb-1">Orbit Journey</h1>
                  <p className="text-xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                      Academic Roadmap
                  </p>
              </div>
              <button 
                  onClick={() => openForm()}
                  className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/30 transition-all active:scale-95"
              >
                  <Plus className="w-5 h-5" />
              </button>
          </div>
          <LiquidTabs tabs={dayTabs} activeId={selectedDay} onChange={setSelectedDay} layoutIdPrefix="academic-journey" variant="scrollable" />
      </header>

      {/* MAIN SCROLL AREA */}
      <main className="relative flex-1 w-full max-w-2xl mx-auto mt-8 overflow-x-hidden">
          <div className="relative w-full" style={{ height: totalHeight }}>
              
              {/* SVG PATH LAYER */}
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible" viewBox={`0 0 400 ${totalHeight}`} preserveAspectRatio="none">
                  <defs>
                      <linearGradient id="activeGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="50%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                  </defs>
                  
                  {/* The Path with Ref */}
                  <path 
                      ref={pathRef}
                      d={pathD} 
                      fill="none" 
                      stroke="url(#activeGradient)" 
                      strokeWidth={isMobile ? "4" : "6"} 
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_8px_rgba(249,115,22,0.3)] opacity-80"
                  />
                  {/* Ghost Path for structure */}
                  <path 
                      d={pathD} 
                      fill="none" 
                      stroke="rgba(255,255,255,0.05)" 
                      strokeWidth="20" 
                      strokeLinecap="round"
                  />
              </svg>

              {/* NODES LAYER */}
              {nodes.map((node, idx) => {
                  const theme = TYPE_THEMES[node.type];
                  const Icon = theme.icon;
                  const isActive = node.status === 'active';
                  const isPast = node.status === 'past';
                  const isLeft = idx % 2 === 0; 
                  
                  // Check if this specific node is the next one on the current day
                  const isUpcoming = isViewingToday && idx === firstFutureIndex;
                  
                  // Logic for cross-axis layout to prevent clipping on mobile
                  const textStyle = isLeft 
                    ? { left: '55%', textAlign: 'left', alignItems: 'flex-start' } 
                    : { right: '55%', textAlign: 'right', alignItems: 'flex-end' };

                  return (
                      <motion.div 
                          key={node.id}
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: isPast ? 0.6 : 1 }}
                          viewport={{ once: true, margin: "-10%" }}
                          transition={{ duration: 0.5 }}
                          className="absolute z-10 w-full pointer-events-none"
                          style={{ 
                              top: node.y,
                              // No horizontal transform here, node uses absolute left
                          }}
                      >
                          {/* --- DATA BLOCK (Cross-Axis) --- */}
                          <div 
                              className="absolute top-1/2 -translate-y-1/2 flex flex-col justify-center pointer-events-auto cursor-pointer group/data z-20"
                              style={textStyle as any}
                              onClick={(e) => { e.stopPropagation(); handleInspect(node); }}
                          >
                              {/* Blink Label for Upcoming */}
                              {isUpcoming && (
                                  <motion.div
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 ${theme.text} flex items-center gap-1 ${isLeft ? 'justify-start' : 'justify-end'}`}
                                  >
                                      {/* Flashing Dot */}
                                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                      <span className="animate-[pulse_2s_infinite]">INCOMING SIGNAL</span>
                                  </motion.div>
                              )}

                              {/* 1. Time Display */}
                              <motion.div
                                  initial={{ opacity: 0, x: isLeft ? 20 : -20 }}
                                  whileInView={{ opacity: 1, x: 0 }}
                                  transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                              >
                                  <span className={`block text-5xl sm:text-7xl font-black italic tracking-tighter leading-[0.8] whitespace-nowrap drop-shadow-xl transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover/data:text-slate-200'} ${isUpcoming ? 'animate-pulse' : ''}`}>
                                      {node.startTime.split(' ')[0]}
                                  </span>
                              </motion.div>

                              {/* 2. Type Badge */}
                              <motion.div 
                                  initial={{ opacity: 0 }} 
                                  whileInView={{ opacity: 1 }}
                                  transition={{ delay: 0.2 }}
                                  className={`mt-2 px-3 py-1 rounded-full border bg-black/60 backdrop-blur-md text-[8px] font-bold uppercase tracking-widest inline-flex items-center gap-1 ${isActive ? theme.activeBorder + ' ' + theme.text : 'border-white/10 text-slate-600 group-hover/data:border-white/20 group-hover/data:text-slate-400'}`}
                              >
                                  {React.createElement(theme.icon, { className: "w-3 h-3" })}
                                  {theme.label}
                              </motion.div>

                              {/* Connector Line (Decorative) */}
                              <svg 
                                  className={`absolute top-1/2 -translate-y-1/2 w-16 h-px overflow-visible pointer-events-none opacity-30 ${isLeft ? 'right-full mr-4' : 'left-full ml-4'}`}
                                  viewBox="0 0 50 1"
                              >
                                  <line x1="0" y1="0" x2="50" y2="0" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className={isActive || isUpcoming ? 'text-white' : 'text-slate-600'} />
                                  <circle cx={isLeft ? 50 : 0} cy="0" r="3" fill="currentColor" className={isActive || isUpcoming ? theme.text : 'text-slate-600'} />
                              </svg>
                          </div>

                          {/* --- THE NODE (Interactive Trigger) --- */}
                          <div 
                              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer group pointer-events-auto z-30"
                              style={{ 
                                  left: `${(node.x / 400) * 100}%`,
                                  transform: 'translate(-50%, -50%)'
                              }}
                              onMouseEnter={() => setHoveredNodeId(node.id)}
                              onMouseLeave={() => setHoveredNodeId(null)}
                              onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleInspect(node);
                              }}
                          >
                              {/* Pulse Ring for Active */}
                              {isActive && (
                                  <div className={`absolute inset-0 rounded-full animate-ping opacity-30 bg-gradient-to-r ${theme.bgGradient}`} style={{ padding: '25px' }} />
                              )}
                              
                              {/* Radar Ping for Upcoming */}
                              {isUpcoming && (
                                  <>
                                    <div className={`absolute inset-0 rounded-full animate-ping opacity-40 border-2 ${theme.activeBorder}`} style={{ animationDuration: '2s' }} />
                                    <div className={`absolute inset-[-8px] rounded-full border border-dashed ${theme.text} opacity-30 animate-spin-slow`} />
                                  </>
                              )}

                              {/* Core Circle */}
                              <div 
                                className={`relative rounded-full p-1 transition-all duration-500 ${isActive ? `size-16 sm:size-20 ${theme.glow} bg-gradient-to-br ${theme.bgGradient}` : isPast ? 'size-12 sm:size-16 border-2 border-white/10 bg-black/40 hover:border-white/30' : 'size-12 sm:size-16 bg-[#0a0a0a] border-2 border-white/10 hover:border-white/30'}`}
                                style={!isActive && !isPast && !isUpcoming ? { borderColor: `${theme.primary}4D` } : isUpcoming ? { borderColor: theme.primary, boxShadow: `0 0 20px ${theme.primary}40` } : {}}
                              >
                                  <div className="w-full h-full rounded-full bg-black/90 flex items-center justify-center overflow-hidden relative">
                                      {isPast ? (
                                          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                                      ) : (
                                          <>
                                              <div className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient} opacity-20`} />
                                              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive || isUpcoming ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} style={{ color: isActive || isUpcoming ? theme.primary : undefined }} />
                                          </>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </motion.div>
                  );
              })}

              {/* SPACE TRAVELER AVATAR (Adjusted for Safety) */}
              {isViewingToday && (
                  <motion.div 
                      className="absolute z-50 pointer-events-none"
                      style={{ 
                          left: `${(travelerPos.x / 400) * 100}%`,
                          top: travelerPos.y, 
                          transform: 'translate(-50%, -50%)' // Center exactly on point
                      }}
                  >
                      {/* Rotating Orientation Wrapper */}
                      <motion.div 
                          animate={{ rotate: isTraveling ? travelerPos.angle + 90 : 0 }} 
                          transition={{ type: "spring", stiffness: 100, damping: 20 }}
                      >
                          {/* The Ship */}
                          <div className="relative">
                              {/* Active Thruster Trail */}
                              {isTraveling && (
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-1 h-12 bg-gradient-to-b from-cyan-400 to-transparent blur-sm opacity-80" />
                              )}
                              
                              {/* Core */}
                              <div className={`relative z-20 rounded-full border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.8)] overflow-hidden bg-black transition-all duration-500 ${isTraveling ? 'w-8 h-12 sm:w-10 sm:h-14 rounded-b-full rounded-t-[20px]' : 'w-12 h-12 sm:w-16 sm:h-16 border-cyan-400 shadow-[0_0_30px_cyan]'}`}>
                                  {userAvatar ? (
                                      <img src={userAvatar} className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                          <Rocket className={`text-white transition-all ${isTraveling ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-6 h-6 sm:w-8 sm:h-8'}`} />
                                      </div>
                                  )}
                                  
                                  {/* Energy Shield overlay when traveling */}
                                  {isTraveling && <div className="absolute inset-0 bg-cyan-500/30 mix-blend-overlay" />}
                              </div>

                              {/* Docking Pulse Rings */}
                              {!isTraveling && (
                                  <>
                                      <div className="absolute inset-[-10px] rounded-full border border-cyan-500/30 animate-ping opacity-20" />
                                      <div className="absolute inset-[-20px] rounded-full border border-white/10 animate-spin-slow opacity-50" />
                                  </>
                              )}
                          </div>
                      </motion.div>
                      
                      {/* Label (Relocated Closer to Hub for Screen Safety) */}
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur text-white text-[7px] sm:text-[8px] font-black uppercase tracking-widest border border-white/20 whitespace-nowrap z-50">
                          {isTraveling ? 'In Transit' : 'Docked'}
                      </div>
                  </motion.div>
              )}

          </div>
      </main>

      {/* FOOTER (HUD) - Re-aligned */}
      <footer className="fixed bottom-0 left-0 right-0 z-[50] p-4 sm:p-6 pb-safe pointer-events-none">
          <div className="max-w-2xl mx-auto bg-black/80 backdrop-blur-2xl border border-white/10 p-5 rounded-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden pointer-events-auto group">
              {/* HUD Scanline Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none translate-x-[-100%] animate-[shimmer_3s_infinite]" />
              
              <div className="flex justify-between items-center mb-4 relative z-10">
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Scan className="w-3 h-3 text-cyan-500" /> Orbit Progress
                      </span>
                      <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-white tabular-nums tracking-tighter">{progressPercent}</span>
                          <span className="text-xs font-bold text-slate-500">%</span>
                      </div>
                  </div>
                  
                  {nextMilestone ? (
                      <div className="flex items-center gap-3 text-right">
                          <div>
                              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Next Node</p>
                              <p className="text-xs font-bold text-white truncate max-w-[140px]">{nextMilestone.subject}</p>
                          </div>
                          <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                              {/* Dynamic Icon for Next */}
                              {React.createElement(TYPE_THEMES[nextMilestone.type].icon, { className: "w-5 h-5" })}
                          </div>
                      </div>
                  ) : (
                      <div className="flex items-center gap-2 opacity-50">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <span className="text-xs font-bold text-slate-400 uppercase">Day Complete</span>
                      </div>
                  )}
              </div>

              {/* Progress Bar (Liquid & Animated) */}
              <div className="relative h-2 w-full bg-slate-900 rounded-full mb-4 overflow-hidden border border-white/5">
                  <motion.div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 via-purple-500 to-cyan-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1 }}
                  >
                      <div className="absolute top-0 right-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]" />
                      <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                  </motion.div>
              </div>

              {/* Controls */}
              <div className="flex gap-3 relative z-10">
                  {nextMilestone && (
                      <button 
                        onClick={() => handleInspect(nextMilestone)} 
                        className="flex-1 bg-gradient-to-r from-[#2c1a4d] to-[#1e1b4b] hover:from-[#3b2166] hover:to-[#2a2669] border border-white/10 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-white shadow-lg group active:scale-95"
                      >
                          <Scan className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Inspect Node</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform opacity-50" />
                      </button>
                  )}
              </div>
          </div>
      </footer>

      {/* INSPECT MODAL (Safe Screen Bound) */}
      <AnimatePresence>
        {inspectingNode && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
                onClick={() => setInspectingNode(null)}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-[#050505] border border-white/10 rounded-[2.5rem] relative overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                >
                    {/* Dynamic Header Background (Fixed) */}
                    <div className={`absolute top-0 left-0 w-full h-40 bg-gradient-to-b ${TYPE_THEMES[inspectingNode.type as ClassType].bgGradient} opacity-20 pointer-events-none`} />
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />

                    {/* Scrollable Content */}
                    <div className="relative z-10 p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        
                        {/* Top Bar */}
                        <div className="flex justify-between items-start sticky top-0 z-20">
                            <div className={`px-3 py-1 rounded-full border ${TYPE_THEMES[inspectingNode.type as ClassType].primary} bg-black/40 backdrop-blur-sm border-opacity-30 text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2`}>
                                {React.createElement(TYPE_THEMES[inspectingNode.type as ClassType].icon, { className: "w-3 h-3" })}
                                {TYPE_THEMES[inspectingNode.type as ClassType].label}
                            </div>
                            <button onClick={() => setInspectingNode(null)} className="p-2 -mr-2 -mt-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors bg-black/50 backdrop-blur-md border border-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Title Section */}
                        <div className="mt-2">
                            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none mb-2">
                                {inspectingNode.subject}
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {inspectingNode.batch && (
                                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                                        BATCH {inspectingNode.batch}
                                    </span>
                                )}
                                <span className={`text-[10px] font-mono px-2 py-1 rounded border border-white/5 uppercase ${inspectingNode.status === 'active' ? 'text-green-400 bg-green-900/20' : inspectingNode.status === 'past' ? 'text-slate-500 bg-slate-800/20' : 'text-cyan-400 bg-cyan-900/20'}`}>
                                    {inspectingNode.status === 'active' ? 'LIVE SESSION' : inspectingNode.status === 'past' ? 'COMPLETED' : 'UPCOMING'}
                                </span>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center gap-1">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3" /> Time</span>
                                <div className="text-sm font-mono font-bold text-white">{inspectingNode.startTime}</div>
                                <div className="text-[10px] font-mono text-slate-500">to {inspectingNode.endTime}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center gap-1">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Venue</span>
                                <div className="text-lg font-black italic text-white uppercase">{inspectingNode.venue}</div>
                            </div>
                        </div>

                        {/* Professor Info */}
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                            <div className="size-12 flex-shrink-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border border-white/10 shadow-lg">
                                <User className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Instructor</div>
                                <div className="text-sm font-bold text-white line-clamp-2">{inspectingNode.professor}</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2 mt-auto">
                            <button 
                                onClick={() => openForm(inspectingNode)}
                                className="flex-1 py-4 rounded-xl bg-white text-black font-black italic uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                <Edit3 className="w-4 h-4" /> Edit Data
                            </button>
                            {inspectingNode.status === 'active' && (
                                <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 flex items-center justify-center animate-pulse">
                                    <Fingerprint className="w-6 h-6" />
                                </div>
                            )}
                        </div>

                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* FORM MODAL (Reused) */}
      <AnimatePresence>
        {isFormOpen && (
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
             >
                 <div className="w-full max-w-lg bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-purple-500" />
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-black italic text-white uppercase">Configure Node</h3>
                         <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-white/10"><X className="w-5 h-5 text-slate-500" /></button>
                     </div>
                     
                     <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
                         <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-mono text-sm outline-none focus:border-cyan-500" placeholder="SUBJECT NAME..." autoFocus />
                         <div className="flex gap-2">
                             {(['Lecture', 'Lab', 'Tutorial'] as ClassType[]).map(t => (
                                 <button key={t} onClick={() => setType(t)} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${type === t ? 'bg-white/10 border-white/30 text-white' : 'bg-black/20 border-white/10 text-slate-500'}`}>{t}</button>
                             ))}
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <input value={venue} onChange={e => setVenue(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl p-3 text-white font-mono text-xs" placeholder="VENUE" />
                             <input value={professor} onChange={e => setProfessor(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl p-3 text-white font-mono text-xs" placeholder="PROFESSOR" />
                         </div>
                         <div className="bg-black/40 rounded-xl border border-white/5 p-4">
                             <LiquidSlider value={sHour===0?12:sHour} onChange={v => setSHour(v===12?0:v)} min={1} max={12} unit="H" label="START" />
                             <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setSAmpm('AM')} className={`px-2 py-1 text-[9px] font-bold rounded ${sAmpm === 'AM' ? 'bg-white text-black' : 'bg-white/10'}`}>AM</button>
                                <button onClick={() => setSAmpm('PM')} className={`px-2 py-1 text-[9px] font-bold rounded ${sAmpm === 'PM' ? 'bg-white text-black' : 'bg-white/10'}`}>PM</button>
                             </div>
                         </div>
                         <div className="bg-black/40 rounded-xl border border-white/5 p-4">
                             <LiquidSlider value={eHour===0?12:eHour} onChange={v => setEHour(v===12?0:v)} min={1} max={12} unit="H" label="END" />
                             <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setEAmpm('AM')} className={`px-2 py-1 text-[9px] font-bold rounded ${eAmpm === 'AM' ? 'bg-white text-black' : 'bg-white/10'}`}>AM</button>
                                <button onClick={() => setEAmpm('PM')} className={`px-2 py-1 text-[9px] font-bold rounded ${eAmpm === 'PM' ? 'bg-white text-black' : 'bg-white/10'}`}>PM</button>
                             </div>
                         </div>
                         <div className="flex gap-2 pt-2 pb-2">
                             {editingId && (
                                 <button onClick={() => { onDeleteClass(selectedDay, editingId); setIsFormOpen(false); }} className="p-4 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                                     <Trash2 className="w-5 h-5" />
                                 </button>
                             )}
                             <button onClick={handleSave} className="flex-1 py-4 bg-white hover:bg-cyan-400 text-black font-black italic uppercase rounded-xl shadow-lg flex items-center justify-center gap-2">
                                 {editingId ? 'Update Data' : 'Initialize Node'} <ArrowRight className="w-4 h-4" />
                             </button>
                         </div>
                     </div>
                 </div>
             </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
