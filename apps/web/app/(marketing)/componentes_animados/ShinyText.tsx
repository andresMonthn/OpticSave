"use client";

import React, { CSSProperties } from "react";

interface ShinyTextProps {
  text: string;
  className?: string;
  disabled?: boolean; // Desactiva el efecto shiny
  speed?: number; // Duración de la animación en segundos
}

export default function ShinyText({
  text,
  className = "",
  disabled = false,
  speed = 5,
}: ShinyTextProps) {
  return (
    <span
      className={`inline-block ${className} ${disabled ? "" : "shiny-text"}`}
      style={
        disabled
          ? undefined
          : ({ ["--shine-duration" as any]: `${speed}s` } as CSSProperties)
      }
    >
      {text}

      {/* Estilos del efecto Shiny */}
      <style jsx>{`
        .shiny-text {
          display: inline-block;
          background:
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0) 35%,
              rgba(255, 255, 255, 0.9) 50%,
              rgba(255, 255, 255, 0) 65%,
              rgba(255, 255, 255, 0) 100%
            ),
            linear-gradient(0deg, currentColor, currentColor);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% 100%, 100% 100%;
          animation: shine var(--shine-duration, 5s) linear infinite;
        }

        @keyframes shine {
          0% {
            background-position: -200% 0, 0 0;
          }
          100% {
            background-position: 200% 0, 0 0;
          }
        }
      `}</style>
    </span>
  );
}