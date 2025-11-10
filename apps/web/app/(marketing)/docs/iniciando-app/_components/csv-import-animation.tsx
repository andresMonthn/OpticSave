'use client';

import { useEffect, useRef } from 'react';

export default function CsvImportAnimation() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== 'function') return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const children = Array.from(el.children);

    children.forEach((child, index) => {
      child.animate(
        [
          { transform: 'translateY(8px)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        {
          duration: 450,
          easing: 'ease-out',
          delay: index * 120,
          fill: 'both',
        },
      );
    });
  }, []);

  return (
    <div ref={ref} className={'mt-3 flex items-center gap-2'}>
      <span className={'inline-flex rounded-md bg-green-100 text-green-800 px-2 py-1 text-xs'}>
        CSV
      </span>
      <span className={'inline-flex rounded-md bg-blue-100 text-blue-800 px-2 py-1 text-xs'}>
        Excel
      </span>
      <span className={'inline-flex rounded-md bg-emerald-100 text-emerald-800 px-2 py-1 text-xs'}>
        Google Sheets
      </span>
    </div>
  );
}