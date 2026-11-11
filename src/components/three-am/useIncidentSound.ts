import { useCallback, useEffect, useRef, useState } from 'react';

export function useIncidentSound(active: boolean) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  const contextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (typeof window === 'undefined' || !('AudioContext' in window)) {
      setError('Web Audio is unavailable in this browser.');
      return null;
    }

    try {
      contextRef.current ??= new window.AudioContext();
      if (contextRef.current.state === 'suspended') {
        void contextRef.current.resume().catch(() => {
          setError('Sound could not start. Check your browser audio permissions.');
        });
      }
      return contextRef.current;
    } catch {
      setError('Sound could not be initialized in this browser.');
      return null;
    }
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, gainAmount: number) => {
      if (!enabled) return;
      const context = getContext();
      if (!context) return;

      try {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(gainAmount, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.02);
      } catch {
        setError('The incident sound could not be played.');
      }
    },
    [enabled, getContext],
  );

  const toggle = useCallback(() => {
    const turnOn = !enabled;
    setEnabled(turnOn);
    if (turnOn) {
      const context = getContext();
      if (context) {
        try {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const now = context.currentTime;
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, now);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.008, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start(now);
          oscillator.stop(now + 0.14);
        } catch {
          setError('The incident sound could not be enabled.');
        }
      }
    }
  }, [enabled, getContext]);

  const playPager = useCallback(() => {
    playTone(740, 0.17, 0.035);
    window.setTimeout(() => playTone(988, 0.22, 0.035), 240);
  }, [playTone]);

  useEffect(() => {
    if (!active || !enabled) return;
    const timer = window.setInterval(() => playTone(68, 0.16, 0.012), 680);
    return () => window.clearInterval(timer);
  }, [active, enabled, playTone]);

  useEffect(() => {
    return () => {
      if (contextRef.current && contextRef.current.state !== 'closed') {
        void contextRef.current.close();
      }
    };
  }, []);

  return { enabled, error, toggle, playPager };
}
