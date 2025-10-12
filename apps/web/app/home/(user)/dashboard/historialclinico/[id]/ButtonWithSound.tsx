"use client";

import React, { useState, useRef, ButtonHTMLAttributes } from "react";
import { cn } from "@kit/ui/utils";

interface ButtonWithSoundProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
}

export function ButtonWithSound({
  children,
  className,
  variant = 'default',
  ...props
}: ButtonWithSoundProps) {
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Reproducir sonido al hacer clic
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error("Error al reproducir sonido:", err));
    }
    
    // Llamar al manejador de eventos onClick original si existe
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <>
      <button
        className={cn(
          "transition-transform duration-200 ease-in-out",
          isHovered ? "scale-105" : "",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
      <audio ref={audioRef} src="/sounds/click.mp3" preload="auto" />
    </>
  );
}