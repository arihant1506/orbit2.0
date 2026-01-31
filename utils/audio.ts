
// --- ORBIT AUDIO ENGINE ---
// A procedural audio synthesizer for UI interactions

type SoundType = 
  | 'click' 
  | 'hover' 
  | 'liquid_activate' 
  | 'liquid_deactivate' 
  | 'glass_tap' 
  | 'success_chord' 
  | 'delete' 
  | 'error' 
  | 'slider_tick'
  | 'water_splash'
  | 'power_up'
  | 'bell_normal'
  | 'alarm_critical';

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  try {
    if (!audioCtx) {
      // Robust check for AudioContext presence
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    console.warn("Audio initialization failed:", e);
    return null;
  }
};

export const playOrbitSound = (type: SoundType) => {
  const ctx = initAudio();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Master connection
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'click':
        // Crisp, high-tech tick
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);
        break;

      case 'hover':
        // Very subtle airy breath (using buffer noise)
        const bufferSize = ctx.sampleRate * 0.1; // 0.1s
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 3000;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.01, t);
        noiseGain.gain.linearRampToValueAtTime(0, t + 0.05);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(t);
        break;

      case 'liquid_activate':
        // bubbly rising morph
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.2);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.linearRampToValueAtTime(3000, t + 0.2); // opening filter
        filter.Q.value = 5; // Resonant liquid sound

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
        
        osc.start(t);
        osc.stop(t + 0.2);
        break;

      case 'liquid_deactivate':
        // bubbly falling morph
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.linearRampToValueAtTime(200, t + 0.2);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.linearRampToValueAtTime(200, t + 0.2); // closing filter
        filter.Q.value = 5; 

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
        
        osc.start(t);
        osc.stop(t + 0.2);
        break;

      case 'glass_tap':
        // Ethereal crystal ping (requires overtones)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.5);
        
        // Add a 2nd harmonic for "glass" texture
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2350, t); // Non-integer harmonic
        gain2.gain.setValueAtTime(0.02, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc2.start(t);
        osc2.stop(t + 0.4);
        break;

      case 'success_chord':
        // Futuristic Major 7th Arp
        const freqs = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5
        freqs.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, t + i * 0.05);
          g.gain.setValueAtTime(0, t + i * 0.05);
          g.gain.linearRampToValueAtTime(0.05, t + i * 0.05 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 1.5); // Long decay
          o.start(t + i * 0.05);
          o.stop(t + i * 0.05 + 1.5);
        });
        break;

      case 'error':
        // Glitchy buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(50, t + 0.3);
        
        // Tremolo effect via gain
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.setValueCurveAtTime(new Float32Array([0.1, 0, 0.1, 0, 0.1, 0]), t, 0.3);
        
        osc.start(t);
        osc.stop(t + 0.3);
        break;

      case 'delete':
        // Sci-fi trash crunch
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 0.2);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
        break;

      case 'slider_tick':
        // Extremely short haptic tick
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        osc.start(t);
        osc.stop(t + 0.02);
        break;

      case 'water_splash':
          // Filtered noise sweep
          const bSize = ctx.sampleRate * 0.5;
          const b = ctx.createBuffer(1, bSize, ctx.sampleRate);
          const d = b.getChannelData(0);
          for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
          const n = ctx.createBufferSource();
          n.buffer = b;
          const f = ctx.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.setValueAtTime(400, t);
          f.frequency.linearRampToValueAtTime(100, t + 0.3);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.1, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          n.connect(f);
          f.connect(g);
          g.connect(ctx.destination);
          n.start(t);
          break;

      case 'power_up':
         // THX-style riser
         const o1 = ctx.createOscillator();
         const o2 = ctx.createOscillator();
         const g1 = ctx.createGain();
         
         o1.connect(g1); o2.connect(g1); g1.connect(ctx.destination);
         
         o1.type = 'sawtooth';
         o2.type = 'square';
         
         o1.frequency.setValueAtTime(100, t);
         o1.frequency.exponentialRampToValueAtTime(400, t + 1.0);
         o2.frequency.setValueAtTime(105, t);
         o2.frequency.exponentialRampToValueAtTime(405, t + 1.0); // Slight detune for chorus effect
         
         g1.gain.setValueAtTime(0, t);
         g1.gain.linearRampToValueAtTime(0.1, t + 0.2);
         g1.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
         
         o1.start(t); o2.start(t);
         o1.stop(t + 1.5); o2.stop(t + 1.5);
         break;

      case 'bell_normal':
         // Standard Ping (Sine)
         osc.type = 'sine';
         osc.frequency.setValueAtTime(800, t);
         osc.frequency.exponentialRampToValueAtTime(400, t + 0.3);
         gain.gain.setValueAtTime(0.1, t);
         gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
         osc.start(t);
         osc.stop(t + 0.3);
         break;

      case 'alarm_critical':
         // Urgent Alarm (Sawtooth)
         osc.type = 'sawtooth';
         osc.frequency.setValueAtTime(800, t);
         osc.frequency.linearRampToValueAtTime(1200, t + 0.1);
         osc.frequency.linearRampToValueAtTime(800, t + 0.2);
         osc.frequency.linearRampToValueAtTime(1200, t + 0.3);
         gain.gain.setValueAtTime(0.2, t);
         gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
         osc.start(t);
         osc.stop(t + 0.6);
         break;
    }
  } catch (e) {
    console.warn("Error playing sound:", e);
  }
};
