import { useCallback, useEffect, useState } from 'react';

export function usePlayback(step: () => void, complete: boolean) {
  const [isPlaying, setIsPlaying] = useState(false);

  const advance = useCallback(() => {
    if (complete) {
      setIsPlaying(false);
      return;
    }

    step();
  }, [complete, step]);

  useEffect(() => {
    if (!isPlaying || complete) {
      if (complete) setIsPlaying(false);
      return;
    }

    const timer = window.setInterval(advance, 900);
    return () => window.clearInterval(timer);
  }, [advance, complete, isPlaying]);

  const stop = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying((playing) => !playing), []);

  return { isPlaying, advance, stop, toggle };
}
