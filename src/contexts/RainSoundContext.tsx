import { createContext, useContext, useCallback, useRef, useState, useEffect, ReactNode } from 'react';
import { useTheme } from './ThemeContext';

export type RainIntensity = 'off' | 'sutil' | 'moderada' | 'intensa';

interface RainSoundContextType {
  intensity: RainIntensity;
  setIntensity: (intensity: RainIntensity) => void;
  isPlaying: boolean;
}

const RainSoundContext = createContext<RainSoundContextType>({
  intensity: 'off',
  setIntensity: () => {},
  isPlaying: false,
});

// Volume configs for each intensity
const INTENSITY_CONFIG: Record<Exclude<RainIntensity, 'off'>, {
  master: number;
  rain: number;
  ambience: number;
  hiss: number;
  rainFreq: number;
  ambFreq: number;
}> = {
  sutil: {
    master: 0.12,
    rain: 0.3,
    ambience: 0.15,
    hiss: 0.08,
    rainFreq: 3500,
    ambFreq: 200,
  },
  moderada: {
    master: 0.3,
    rain: 0.5,
    ambience: 0.35,
    hiss: 0.2,
    rainFreq: 2500,
    ambFreq: 300,
  },
  intensa: {
    master: 0.5,
    rain: 0.7,
    ambience: 0.55,
    hiss: 0.35,
    rainFreq: 2000,
    ambFreq: 400,
  },
};

export function RainSoundProvider({ children }: { children: ReactNode }) {
  const { backgroundEffect } = useTheme();
  const [intensity, setIntensityState] = useState<RainIntensity>(() => {
    return (localStorage.getItem('arrow-rain-intensity') as RainIntensity) || 'off';
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const stopSound = useCallback(() => {
    if (audioCtxRef.current) {
      const gain = masterGainRef.current;
      if (gain) {
        try {
          gain.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.5);
        } catch {}
      }
      const ctx = audioCtxRef.current;
      setTimeout(() => {
        try { ctx.close(); } catch {}
      }, 600);
      audioCtxRef.current = null;
      masterGainRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const startSound = useCallback((level: Exclude<RainIntensity, 'off'>) => {
    stopSound();

    try {
      const cfg = INTENSITY_CONFIG[level];
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Fade in
      masterGain.gain.linearRampToValueAtTime(cfg.master, ctx.currentTime + 2);

      // Layer 1: Rain patter
      const rainBuf = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = rainBuf.getChannelData(ch);
        for (let i = 0; i < d.length; i++) {
          const mod = 0.7 + 0.3 * Math.sin(i / ctx.sampleRate * 0.3);
          d[i] = (Math.random() * 2 - 1) * 0.4 * mod;
        }
      }
      const rainSrc = ctx.createBufferSource();
      rainSrc.buffer = rainBuf;
      rainSrc.loop = true;

      const rainBand = ctx.createBiquadFilter();
      rainBand.type = 'bandpass';
      rainBand.frequency.value = cfg.rainFreq;
      rainBand.Q.value = 0.3;

      const rainGain = ctx.createGain();
      rainGain.gain.value = cfg.rain;

      rainSrc.connect(rainBand);
      rainBand.connect(rainGain);
      rainGain.connect(masterGain);
      rainSrc.start();

      // Layer 2: Deep ambience
      const ambBuf = ctx.createBuffer(2, ctx.sampleRate * 3, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ambBuf.getChannelData(ch);
        for (let i = 0; i < d.length; i++) {
          d[i] = (Math.random() * 2 - 1) * 0.5;
        }
      }
      const ambSrc = ctx.createBufferSource();
      ambSrc.buffer = ambBuf;
      ambSrc.loop = true;

      const ambLow = ctx.createBiquadFilter();
      ambLow.type = 'lowpass';
      ambLow.frequency.value = cfg.ambFreq;

      const ambGain = ctx.createGain();
      ambGain.gain.value = cfg.ambience;

      ambSrc.connect(ambLow);
      ambLow.connect(ambGain);
      ambGain.connect(masterGain);
      ambSrc.start();

      // Layer 3: Surface hiss
      const hissBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const hissData = hissBuf.getChannelData(0);
      for (let i = 0; i < hissData.length; i++) {
        const mod = 0.8 + 0.2 * Math.sin(i / ctx.sampleRate * 0.7);
        hissData[i] = (Math.random() * 2 - 1) * 0.2 * mod;
      }
      const hissSrc = ctx.createBufferSource();
      hissSrc.buffer = hissBuf;
      hissSrc.loop = true;

      const hissFilter = ctx.createBiquadFilter();
      hissFilter.type = 'highpass';
      hissFilter.frequency.value = 5000;

      const hissGain = ctx.createGain();
      hissGain.gain.value = cfg.hiss;

      hissSrc.connect(hissFilter);
      hissFilter.connect(hissGain);
      hissGain.connect(masterGain);
      hissSrc.start();

      setIsPlaying(true);
    } catch (err) {
      console.warn('Rain sound error:', err);
    }
  }, [stopSound]);

  // Public setter
  const setIntensity = useCallback((newIntensity: RainIntensity) => {
    setIntensityState(newIntensity);
    localStorage.setItem('arrow-rain-intensity', newIntensity);
  }, []);

  // React to intensity or theme changes
  useEffect(() => {
    if (backgroundEffect !== 'rain' || intensity === 'off') {
      stopSound();
    }
    // Sound only starts when user clicks, not on mount (browser policy)
  }, [backgroundEffect, intensity, stopSound]);

  // Start sound when intensity is set and rain effect is active
  useEffect(() => {
    if (backgroundEffect === 'rain' && intensity !== 'off') {
      startSound(intensity);
    }
    return () => stopSound();
  }, [intensity, backgroundEffect, startSound, stopSound]);

  // Provide thunder trigger for RainBackground
  useEffect(() => {
    (window as any).__playThunder = () => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      try {
        const bufferSize = ctx.sampleRate * 4;
        const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const data = buffer.getChannelData(ch);
          for (let i = 0; i < bufferSize; i++) {
            const t = i / ctx.sampleRate;
            const crack = t < 0.1 ? Math.exp(-t * 30) * 0.8 : 0;
            const rumble = Math.exp(-t * 0.8) * (0.4 + Math.random() * 0.2);
            data[i] = (Math.random() * 2 - 1) * (crack + rumble);
          }
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 200;
        const thunderGain = ctx.createGain();
        thunderGain.gain.value = intensity === 'intensa' ? 0.6 : intensity === 'moderada' ? 0.4 : 0.2;
        source.connect(lowpass);
        lowpass.connect(thunderGain);
        thunderGain.connect(ctx.destination);
        source.start();
      } catch {}
    };
    return () => { delete (window as any).__playThunder; };
  }, [intensity]);

  return (
    <RainSoundContext.Provider value={{ intensity, setIntensity, isPlaying }}>
      {children}
    </RainSoundContext.Provider>
  );
}

export function useRainSound() {
  return useContext(RainSoundContext);
}
