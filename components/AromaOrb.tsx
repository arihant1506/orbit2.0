import React from 'react';

interface AromaOrbProps {
  size?: string;
  intensity?: 'low' | 'normal' | 'high';
  colorMode?: 'default' | 'gold' | 'danger' | 'success';
  showRings?: boolean;
}

export const AromaOrb: React.FC<AromaOrbProps> = ({ 
  size = 'w-24 h-24', 
  intensity = 'normal',
  colorMode = 'default',
  showRings = true
}) => {
  
  // Siri-like Vibrant Themes using additive color mixing (mix-blend-screen)
  const themes = {
    default: {
      base: 'bg-black', // Deep base for colors to pop against
      // Distinct colorful blobs
      blob1: 'bg-cyan-400',
      blob2: 'bg-blue-600',
      blob3: 'bg-purple-500',
      blob4: 'bg-pink-500',
      blob5: 'bg-white', // Hot core
      ring: 'border-cyan-500/30',
      glow: 'shadow-[0_0_40px_rgba(6,182,212,0.6),0_0_80px_rgba(168,85,247,0.4)]'
    },
    gold: {
      base: 'bg-amber-950',
      blob1: 'bg-amber-400',
      blob2: 'bg-yellow-500',
      blob3: 'bg-orange-600',
      blob4: 'bg-red-500',
      blob5: 'bg-white',
      ring: 'border-amber-500/30',
      glow: 'shadow-[0_0_40px_rgba(245,158,11,0.6),0_0_80px_rgba(234,88,12,0.4)]'
    },
    danger: {
      base: 'bg-red-950',
      blob1: 'bg-red-500',
      blob2: 'bg-rose-600',
      blob3: 'bg-orange-600',
      blob4: 'bg-pink-600',
      blob5: 'bg-white',
      ring: 'border-red-500/30',
      glow: 'shadow-[0_0_40px_rgba(239,68,68,0.6),0_0_80px_rgba(244,63,94,0.4)]'
    },
    success: {
      base: 'bg-emerald-950',
      blob1: 'bg-emerald-400',
      blob2: 'bg-green-500',
      blob3: 'bg-teal-500',
      blob4: 'bg-lime-400',
      blob5: 'bg-white',
      ring: 'border-emerald-500/30',
      glow: 'shadow-[0_0_40px_rgba(16,185,129,0.6),0_0_80px_rgba(20,184,166,0.4)]'
    }
  };

  const t = themes[colorMode];
  
  // Animation speed adjustment based on intensity
  const fastSpeed = intensity === 'high' ? '2s' : intensity === 'low' ? '6s' : '3s';
  const slowSpeed = intensity === 'high' ? '4s' : intensity === 'low' ? '10s' : '7s';

  return (
    <div className={`relative ${size} flex items-center justify-center`}>
        
        {/* Main Orb Container */}
        <div className={`absolute inset-0 rounded-full overflow-hidden ${t.base} ring-1 ring-white/20 isolate`}>
            
            {/* 1. Global Rotation - Adds a spinning layer */}
            <div className="absolute inset-[-50%] w-[200%] h-[200%] animate-spin-slow opacity-50 mix-blend-screen"
                 style={{ 
                   background: `conic-gradient(from 0deg, transparent 0deg, ${colorMode === 'default' ? '#06b6d4' : 'currentColor'} 60deg, transparent 120deg)` 
                 }} 
            />

            {/* 2. Fluid Blobs - The "Siri" Core */}
            {/* Blob 1: Top Right */}
            <div 
              className={`absolute top-0 right-0 w-[70%] h-[70%] rounded-full mix-blend-screen blur-[15px] sm:blur-[25px] opacity-90 animate-blob ${t.blob1}`}
              style={{ animationDuration: slowSpeed, animationDelay: '0s' }} 
            />
            
            {/* Blob 2: Bottom Left */}
            <div 
              className={`absolute bottom-0 left-0 w-[70%] h-[70%] rounded-full mix-blend-screen blur-[15px] sm:blur-[25px] opacity-90 animate-blob ${t.blob2}`}
              style={{ animationDuration: '5s', animationDelay: '1s' }} 
            />
            
            {/* Blob 3: Bottom Right (Accent) */}
            <div 
              className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-screen blur-[15px] sm:blur-[25px] opacity-90 animate-blob ${t.blob3}`}
              style={{ animationDuration: fastSpeed, animationDelay: '2s' }} 
            />
            
            {/* Blob 4: Top Left (Accent) */}
            <div 
              className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full mix-blend-screen blur-[15px] sm:blur-[25px] opacity-90 animate-blob ${t.blob4}`}
              style={{ animationDuration: '6s', animationDelay: '0.5s' }} 
            />

            {/* 3. Core Hotspot - Bright center */}
            <div className={`absolute inset-0 m-auto w-[20%] h-[20%] rounded-full blur-[10px] mix-blend-screen animate-pulse ${t.blob5}`} />

            {/* 4. Texture Overlay (Noise) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay" />
            
            {/* 5. Highlight Gloss */}
            <div className="absolute top-0 left-[10%] w-[40%] h-[20%] bg-gradient-to-b from-white/30 to-transparent rounded-full blur-[5px]" />
        </div>

        {/* External Glow / Aura */}
        <div className={`absolute inset-0 rounded-full mix-blend-screen ${t.glow} opacity-60 animate-pulse`} style={{ animationDuration: '3s' }} />

        {/* Orbiting Rings */}
        {showRings && (
          <>
            <div className={`absolute inset-[-15%] rounded-full border border-dashed opacity-40 animate-spin-slow ${t.ring}`} style={{ animationDuration: '15s' }} />
            <div className={`absolute inset-[-5%] rounded-full border opacity-70 ${t.ring}`} />
          </>
        )}
    </div>
  );
};