
import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useVelocity } from 'framer-motion';
import { playOrbitSound } from '../utils/audio';

interface Tab {
  id: string;
  label: React.ReactNode;
}

interface LiquidTabsProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  layoutIdPrefix: string;
  variant?: 'pill' | 'scrollable'; 
}

export const LiquidTabs: React.FC<LiquidTabsProps> = ({ tabs, activeId, onChange, layoutIdPrefix, variant = 'pill' }) => {
  const [dimensions, setDimensions] = useState({ left: 0, width: 0, opacity: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  // --- PHYSICS ENGINE (Professional Feel) ---
  const springConfig = { stiffness: 400, damping: 30, mass: 1 };
  
  const left = useSpring(0, springConfig);
  const width = useSpring(0, springConfig);
  
  const xVelocity = useVelocity(left);
  
  // Subtle Deformation
  const scaleX = useTransform(xVelocity, [-3000, 0, 3000], [1.15, 1, 1.15]);
  const scaleY = useTransform(xVelocity, [-3000, 0, 3000], [0.9, 1, 0.9]);
  const skewX = useTransform(xVelocity, [-3000, 0, 3000], [15, 0, -15]);

  // Chromatic Aberration
  const rgbShift = useTransform(xVelocity, [-3000, 0, 3000], [-3, 0, 3]);
  const rgbOpacity = useTransform(xVelocity, [-2000, 0, 2000], [0.6, 0, 0.6]);

  useEffect(() => {
    const activeIndex = tabs.findIndex(t => t.id === activeId);
    const el = tabRefs.current[activeIndex];
    
    if (el) {
      setDimensions({
        left: el.offsetLeft,
        width: el.offsetWidth,
        opacity: 1
      });
      left.set(el.offsetLeft);
      width.set(el.offsetWidth);
    }
  }, [activeId, tabs, left, width]);

  const handleTabClick = (id: string) => {
      if (navigator.vibrate) navigator.vibrate(5); 
      playOrbitSound('glass_tap');
      onChange(id);
      
      // Auto-scroll into view for mobile
      const index = tabs.findIndex(t => t.id === id);
      const el = tabRefs.current[index];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
  };

  return (
    <div 
      className={`relative flex items-center max-w-full ${
        variant === 'pill' 
          ? 'bg-black/20 p-1 rounded-full border border-white/5 backdrop-blur-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_4px_20px_rgba(0,0,0,0.2)] overflow-x-auto no-scrollbar' 
          : 'gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-2 sm:py-4 px-1 mask-linear-fade'
      }`}
    >
      {/* --- THE LIQUID CRYSTAL BUBBLE --- */}
      <motion.div
         style={{
            left,
            width,
            scaleX,
            scaleY,
            skewX,
            opacity: dimensions.opacity
         }}
         className={`absolute top-1 bottom-1 pointer-events-none z-0 ${variant === 'pill' ? 'rounded-full' : 'rounded-2xl top-1 bottom-1'}`}
      >
         {/* 1. RGB Edge Shift */}
         <motion.div 
            style={{ x: rgbShift, opacity: rgbOpacity }}
            className="absolute inset-0 bg-cyan-400/30 rounded-[inherit] blur-[3px] mix-blend-screen" 
         />
         <motion.div 
            style={{ x: useTransform(rgbShift, v => -v), opacity: rgbOpacity }}
            className="absolute inset-0 bg-fuchsia-500/30 rounded-[inherit] blur-[3px] mix-blend-screen" 
         />

         {/* 2. Main Glass Body */}
         <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-[12px] rounded-[inherit] border border-white/20 overflow-hidden shadow-sm">
            {/* Iridescent Tint */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-purple-400/10 mix-blend-overlay opacity-60" />
            
            {/* Elegant Shimmer */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" style={{ animationDuration: '4s' }} />

            {/* Inner Depth */}
            <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] rounded-[inherit]" />
            
            {/* Top Highlight */}
            <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/10 to-transparent" />
         </div>
         
         {/* 3. Outer Glow */}
         <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-lg rounded-[inherit] -z-10 opacity-50" />
      </motion.div>

      {/* --- TABS CONTENT --- */}
      {tabs.map((tab, i) => {
        const isActive = activeId === tab.id;
        
        return (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[i] = el; }} 
            onClick={() => handleTabClick(tab.id)}
            className={`relative z-10 flex items-center justify-center outline-none select-none cursor-pointer group transition-colors duration-300 flex-shrink-0 ${
              variant === 'pill' 
                ? 'px-3 py-2 sm:px-6 sm:py-2.5 min-w-[55px] sm:min-w-[90px] rounded-full' 
                : 'px-5 py-2.5 sm:px-7 sm:py-3 flex-shrink-0 rounded-2xl min-w-[90px] sm:min-w-[110px]'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
             {/* Magnifying Text Effect */}
             <motion.div 
               animate={{ 
                 scale: isActive ? 1.15 : 1, 
                 y: isActive ? -0.5 : 0,
                 color: isActive ? '#ffffff' : '#94a3b8',
                 textShadow: isActive ? '0 2px 8px rgba(255,255,255,0.4)' : 'none',
                 filter: isActive ? 'brightness(1.1)' : 'brightness(1)'
               }}
               transition={{ type: "spring", stiffness: 500, damping: 30 }}
               className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold font-mono uppercase tracking-[0.15em] relative z-20"
             >
                {tab.label}
             </motion.div>
          </button>
        );
      })}
    </div>
  );
};
