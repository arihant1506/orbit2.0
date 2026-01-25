
import React from 'react';

interface AromaOrbProps {
  size?: string; // e.g. "w-24 h-24"
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
  
  // Color Configs
  const gradients = {
    default: {
      bg: 'bg-gradient-to-tr from-white/5 to-white/10',
      fluid1: 'from-cyan-500/20 via-transparent to-purple-500/20',
      fluid2: 'from-cyan-400/30 to-blue-600/30',
      fluid3: 'from-purple-500/30 to-pink-500/30',
      blob1: 'bg-cyan-400/30',
      blob2: 'bg-fuchsia-400/30',
      core: 'shadow-[0_0_15px_white,0_0_25px_cyan]',
      ring: 'border-cyan-500/10'
    },
    gold: {
      bg: 'bg-gradient-to-tr from-amber-500/5 to-amber-500/10',
      fluid1: 'from-amber-500/20 via-transparent to-orange-500/20',
      fluid2: 'from-amber-400/30 to-yellow-600/30',
      fluid3: 'from-orange-500/30 to-red-500/30',
      blob1: 'bg-amber-400/30',
      blob2: 'bg-orange-400/30',
      core: 'shadow-[0_0_15px_white,0_0_25px_orange]',
      ring: 'border-amber-500/20'
    },
    danger: {
      bg: 'bg-gradient-to-tr from-red-500/5 to-red-500/10',
      fluid1: 'from-red-500/20 via-transparent to-orange-500/20',
      fluid2: 'from-red-400/30 to-rose-600/30',
      fluid3: 'from-orange-500/30 to-red-500/30',
      blob1: 'bg-red-400/30',
      blob2: 'bg-orange-400/30',
      core: 'shadow-[0_0_15px_white,0_0_25px_red]',
      ring: 'border-red-500/20'
    },
    success: {
      bg: 'bg-gradient-to-tr from-emerald-500/5 to-emerald-500/10',
      fluid1: 'from-emerald-500/20 via-transparent to-green-500/20',
      fluid2: 'from-emerald-400/30 to-teal-600/30',
      fluid3: 'from-green-500/30 to-lime-500/30',
      blob1: 'bg-emerald-400/30',
      blob2: 'bg-lime-400/30',
      core: 'shadow-[0_0_15px_white,0_0_25px_emerald]',
      ring: 'border-emerald-500/20'
    }
  };

  const theme = gradients[colorMode];
  
  // Animation Speeds
  const speed = intensity === 'high' ? 'duration-500' : intensity === 'low' ? 'duration-[2000ms]' : 'duration-1000';

  return (
    <div className={`relative ${size} flex items-center justify-center`}>
        {/* The Perfect Circle Container (Removed animate-morph, added rounded-full) */}
        <div className={`absolute inset-0 w-full h-full rounded-full overflow-hidden backdrop-blur-sm border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] transition-all ${speed} ${theme.bg}`}>
            
              {/* Fluid Layer 1: Base Wash */}
              <div className={`absolute inset-0 bg-gradient-to-br animate-pulse ${theme.fluid1}`} />
              
              {/* Fluid Layer 2: Moving Blobs */}
              <div className="absolute top-[-20%] right-[-20%] w-[120%] h-[120%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.1)_90deg,transparent_180deg,rgba(255,255,255,0.1)_270deg,transparent_360deg)] animate-spin-slow opacity-30 blur-xl"></div>
              
              <div className={`absolute top-0 right-0 w-[60%] h-[60%] rounded-full blur-xl animate-blob ${theme.blob1}`}></div>
              <div className={`absolute bottom-0 left-0 w-[60%] h-[60%] rounded-full blur-xl animate-blob ${theme.blob2}`} style={{animationDelay: '2s', animationDirection: 'reverse'}}></div>
              
              {/* Subtle Noise Texture */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        {/* Outer Rings for Depth (Static Circle) */}
        {showRings && (
          <div className={`absolute inset-[-4px] border rounded-full opacity-40 ${theme.ring}`} />
        )}

        {/* Core Glow */}
        <div className={`absolute z-20 w-[6%] h-[6%] bg-white rounded-full animate-pulse ${theme.core}`} />
    </div>
  );
};
