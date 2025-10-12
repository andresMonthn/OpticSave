"use client";
import React, { useRef, useState } from "react";

interface ClickSparkContainerProps {
  children: React.ReactNode;
  sparkColor?: string; // Color de cada línea del destello
  sparkSize?: number; // Longitud inicial de cada línea
  sparkRadius?: number; // Distancia a la que viajan los destellos desde el centro
  sparkCount?: number; // Número de líneas por clic
  duration?: number; // Duración de la animación en ms
  easing?: string; // Función de easing
  extraScale?: number; // Escala adicional de distancia
}

export default function ClickSparkContainer({
  children,
  sparkColor = "#f00",
  sparkSize = 12,
  sparkRadius = 42,
  sparkCount = 14,
  duration = 600,
  easing = "ease-out",
  extraScale = 1,
}: ClickSparkContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sparks, setSparks] = useState<Array<{ id: number; x: number; y: number; angle: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const list: Array<{ id: number; x: number; y: number; angle: number }> = [];
    const base = Math.random() * 360;
    for (let i = 0; i < sparkCount; i++) {
      const angle = base + (360 / sparkCount) * i + (Math.random() * 10 - 5);
      list.push({ id: Date.now() + i, x, y, angle });
    }
    setSparks(list);

    // Limpiar los destellos cuando termina la animación
    window.setTimeout(() => {
      setSparks([]);
    }, duration);
  };

  return (
    <div ref={containerRef} onClick={handleClick} style={{ position: "relative" }}>
      {children}
      {/* Overlay para destellos */}
      <div style={{ position: "absolute", inset: 0 as any, pointerEvents: "none" }}>
        {sparks.map((s) => (
          <span
            key={s.id}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              width: sparkSize,
              height: 2,
              background: sparkColor,
              transformOrigin: "left center",
              opacity: 1,
              // Pasamos el ángulo como variable CSS para mantenerlo durante la animación
              ["--spark-angle" as any]: `${s.angle}deg`,
              animation: `click-spark-move ${duration}ms ${easing} forwards`,
            }}
          />
        ))}
      </div>

      {/* Keyframes de la animación */}
      <style>{`
        @keyframes click-spark-move {
          0%   { transform: rotate(var(--spark-angle)) translateX(0) scale(${0.85 * extraScale}); opacity: 1; }
          100% { transform: rotate(var(--spark-angle)) translateX(${sparkRadius}px) scale(${1 * extraScale}); opacity: 0; }
        }
      `}</style>
    </div>
  );
}