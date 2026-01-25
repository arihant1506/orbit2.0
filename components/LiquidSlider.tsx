
import React, { useRef, useState, useEffect } from 'react';
import { 
  motion, 
  useMotionValue, 
  useTransform, 
  useSpring, 
  useVelocity
} from 'framer-motion';
import { playOrbitSound } from '../utils/audio';

interface LiquidSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  label?: string;
  unit?: string;
}

export const LiquidSlider: React.FC<LiquidSliderProps> = ({ value, min, max, step = 1, onChange, label, unit }) => {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Measure track width
  useEffect(() => {
    if (constraintsRef.current) {
      setWidth(constraintsRef.current.offsetWidth);
    }
  }, []);

  // --- PHYSICS ENGINE ---
  const x = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 400, damping: 28 }); // Snappy but smooth
  const velocity = useVelocity(xSpring);
  
  // Subtle Deformation for stability
  const scaleX = useTransform(velocity, [-1500, 0, 1500], [1.2, 1, 1.2]);
  const scaleY = useTransform(velocity, [-1500, 0, 1500], [0.8, 1, 0.8]);
  const skewX = useTransform(velocity, [-1500, 0, 1500], [20, 0, -20]);

  // Sync external value
  useEffect(() => {
    if (!isActive && width > 0) {
      const percentage = (value - min) / (max - min);
      const thumbSize = 48; // Estimate
      const availableWidth = width - thumbSize;
      const targetX = percentage * availableWidth;
      xSpring.set(targetX);
    }
  }, [value, min, max, width, isActive, xSpring]);

  const handleDrag = () => {
    if (!constraintsRef.current) return;
    const thumbSize = 48; // Must match CSS width roughly
    const availableWidth = width - thumbSize;
    
    const currentX = xSpring.get();
    let percentage = currentX / availableWidth;
    percentage = Math.max(0, Math.min(1, percentage));
    
    let newValue = min + percentage * (max - min);
    
    if (step) {
      newValue = Math.round(newValue / step) * step;
    }
    
    if (newValue !== value) {
      if (navigator.vibrate) navigator.vibrate(5);
      playOrbitSound('slider_tick');
      onChange(newValue);
    }
  };

  const backgroundWidth = useTransform(xSpring, (current) => current + 24);

  return (
    <div className="w-full flex flex-col gap-2 mb-4 select-none touch-none">
       <div className="flex justify-between items-end px-2">
          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">{label}</span>
          <div className="flex items-baseline gap-1">
             <motion.span 
               className="text-lg sm:text-xl font-black italic text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] tabular-nums"
               animate={{ scale: isActive ? 1.15 : 1, color: isActive ? '#22d3ee' : '#ffffff' }}
             >
                {value < 10 && value > 0 ? `0${value}` : value}
             </motion.span>
             <span className="text-[8px] sm:text-[9px] font-bold text-cyan-500 font-mono">{unit}</span>
          </div>
       </div>
       
       {/* Track */}
       <div 
         className="relative h-12 sm:h-14 flex items-center" 
         ref={constraintsRef}
       >
          <div className="absolute inset-x-0 h-3 sm:h-4 bg-white/5 rounded-full border border-white/10 shadow-inner overflow-hidden backdrop-blur-md">
             {/* Blurred Glow Background */}
             <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-900/40 via-blue-800/40 to-purple-800/40 blur-sm opacity-60"
                style={{ width: backgroundWidth }}
             />
             {/* Sharp Progress Line */}
             <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 opacity-90"
                style={{ width: backgroundWidth }}
             />
          </div>

          {/* Liquid Glass Thumb */}
          <motion.div
            drag="x"
            dragConstraints={constraintsRef}
            dragElastic={0}
            dragMomentum={false}
            onDragStart={() => setIsActive(true)}
            onDragEnd={() => setIsActive(false)}
            onDrag={handleDrag}
            style={{ x: xSpring, scaleX, scaleY, skewX, zIndex: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 1.15 }}
            className="absolute top-0 bottom-0 my-auto w-10 h-10 sm:w-12 sm:h-12 -ml-0 cursor-grab active:cursor-grabbing"
          >
             {/* The Thumb Bubble */}
             <div className="w-full h-full rounded-full relative shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                
                {/* 1. Main Glass Body */}
                <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-[10px] border border-white/30 overflow-hidden">
                    
                    {/* Iridescent Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 mix-blend-overlay" />
                    
                    {/* Shinning Animation */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-shimmer" style={{ animationDuration: '3s' }} />
                    
                    {/* Top Gloss */}
                    <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-white/20 to-transparent" />
                </div>
                
                {/* 2. Center Indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]"
                      animate={{ scale: isActive ? 0.8 : 1 }} 
                    />
                </div>
             </div>

             {/* 3. Outer Glow / Bloom */}
             <motion.div 
                className="absolute -inset-3 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 blur-lg rounded-full -z-10"
                animate={{ opacity: isActive ? 0.8 : 0, scale: isActive ? 1.2 : 1 }}
             />
          </motion.div>
       </div>
    </div>
  );
};
