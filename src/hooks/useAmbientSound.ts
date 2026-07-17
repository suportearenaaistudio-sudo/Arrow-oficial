import { useCallback, useEffect, useRef } from 'react';
import type { AmbientSound } from '@/types/pomodoro';

export function useAmbientSound(sound: AmbientSound, volume: number, playing: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);

  const stop = useCallback(() => {
    nodesRef.current.forEach((n) => {
      try {
        if ('stop' in n && typeof n.stop === 'function') (n as OscillatorNode).stop();
        n.disconnect();
      } catch {
        // already stopped
      }
    });
    nodesRef.current = [];
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!playing || sound === 'none' || volume <= 0) {
      stop();
      return;
    }

    stop();
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = Math.min(1, Math.max(0, volume)) * 0.35;
    master.connect(ctx.destination);
    nodesRef.current.push(master);

    if (sound === 'white' || sound === 'rain' || sound === 'cafe') {
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      if (sound === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 800;
      } else if (sound === 'cafe') {
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 0.5;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 12000;
      }

      source.connect(filter);
      filter.connect(master);
      source.start();
      nodesRef.current.push(source, filter);
    }

    return stop;
  }, [sound, volume, playing, stop]);

  return { stop };
}
