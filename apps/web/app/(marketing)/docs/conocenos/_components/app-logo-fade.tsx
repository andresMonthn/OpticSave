'use client';

import { useEffect, useRef } from 'react';

export default function AppLogoFade() {
  const ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== 'function') return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Run once on mount
    el.animate(
      [
        { opacity: 1 },
        { opacity: 0.15 },
        { opacity: 1 },
      ],
      { duration: 1200, easing: 'ease-in-out', fill: 'both' },
    );

    const interval = setInterval(() => {
      el.animate(
        [
          { opacity: 1 },
          { opacity: 0.15 },
          { opacity: 1 },
        ],
        { duration: 1200, easing: 'ease-in-out', fill: 'both' },
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={'mt-4 flex items-center justify-start'}>
      <img
        ref={ref}
        src={'/OpticsLogo.svg'}
        alt={'Logo de OpticSave'}
        width={64}
        height={64}
        className={'h-16 w-16'}
        loading={'lazy'}
      />
    </div>
  );
}