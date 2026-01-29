
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Activity, Cpu, Zap, CheckCircle2, Terminal } from 'lucide-react';
import { playOrbitSound } from '../utils/audio';

interface WelcomeLoaderProps {
  onComplete: () => void;
}

export const WelcomeLoader: React.FC<WelcomeLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("INITIALIZING KERNEL...");

  const statusMessages = [
    "LOADING MODULES...",
    "VERIFYING IDENTITY...",
    "SYNCING SATELLITE DATA...",
    "OPTIMIZING NEURAL NET...",
    "ESTABLISHING SECURE UPLINK..."
  ];

  useEffect(() => {
    // Initial sound
    const startTimer = setTimeout(() => {
        playOrbitSound('power_up');
    }, 300);

    // Progress Simulation
    let currentProgress = 0;
    const interval = setInterval(() => {
      // Random increment
      const increment = Math.random() * 4 + 1; 
      currentProgress += increment;
      
      if (currentProgress > 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
            playOrbitSound('success_chord');
            onComplete();
        }, 800);
      }

      setProgress(currentProgress);

      // Update text based on progress thresholds
      const msgIndex = Math.floor((currentProgress / 100) * statusMessages.length);
      if (currentProgress < 100) {
          setStatusText(statusMessages[Math.min(msgIndex, statusMessages.length - 1)]);
      } else {
          setStatusText("SYSTEM READY");
      }

    }, 50);

    return () => {
        clearTimeout(startTimer);
        clearInterval(interval);
    }
  }, [onComplete]);

  return (
    <motion.div
        className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden cursor-wait"
        initial={{ opacity: 1 }}
        exit={{ 
            y: -1000, 
            opacity: 0,
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
        }}
    >
        {/* Cinematic Background Layers */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] opacity-80" />
        
        {/* Animated Grid Floor (3D effect) */}
        <div className="absolute bottom-0 w-[200%] h-[50%] bg-[linear-gradient(transparent_0%,rgba(6,182,212,0.1)_100%)] blur-md transform -translate-x-1/2 perspective-[1000px] rotate-x-[60deg]" />

        <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
            
            {/* CENTRAL HUD RING */}
            <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
                {/* Outer Rotating Ring */}
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-slate-800 border-t-cyan-500 border-b-cyan-900 shadow-[0_0_30px_rgba(6,182,212,0.1)]"
                />
                
                {/* Inner Counter-Rotating Ring */}
                <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 rounded-full border border-slate-800 border-l-purple-500 border-r-transparent opacity-80"
                />

                {/* Core Logo */}
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="w-16 h-16 bg-gradient-to-tr from-cyan-600 to-blue-700 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.4)] relative z-20 group"
                >
                    <Radio className="w-8 h-8 text-white animate-pulse" />
                    {/* Inner Glint */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full" />
                </motion.div>

                {/* Pulsing Aura */}
                <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse-slow" />
            </div>

            {/* TYPOGRAPHY */}
            <div className="text-center space-y-4 w-full">
                <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-5xl font-black italic tracking-tighter text-white uppercase font-sans"
                >
                    Orbit <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">OS</span>
                </motion.h1>

                {/* Progress Bar Container */}
                <div className="w-full bg-slate-900/50 border border-slate-800 h-2 rounded-full overflow-hidden relative backdrop-blur-sm">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_1s_infinite] -skew-x-12" />
                    </motion.div>
                </div>

                {/* Status Terminal */}
                <div className="flex justify-between items-end h-8 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                    <span className="flex items-center gap-2">
                        {progress < 100 ? (
                            <Cpu className="w-3 h-3 animate-spin text-cyan-500" />
                        ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        )}
                        <span className={progress >= 100 ? "text-emerald-400" : "text-cyan-400"}>
                            {statusText}
                        </span>
                    </span>
                    <span className="tabular-nums text-white">{Math.floor(progress)}%</span>
                </div>
            </div>

            {/* FOOTER DECORATION */}
            <div className="absolute bottom-12 flex gap-4 opacity-30">
                {Array.from({length: 3}).map((_,i) => (
                    <div key={i} className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s`}} />
                ))}
            </div>
        </div>
    </motion.div>
  );
};
