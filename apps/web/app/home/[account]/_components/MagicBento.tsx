"use client";

import React, { useMemo, useRef, useState } from "react";

type MagicBentoProps = React.PropsWithChildren<{
  // Container behavior
  as?: React.ElementType; // HTML element type (div, section, article, etc.)
  className?: string;
  style?: React.CSSProperties;
  
  // Content props (optional, for when used as content container)
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  
  // Animation and effect toggles
  enableStars?: boolean; // particles floating on hover
  enableSpotlight?: boolean; // spotlight following cursor
  enableBorderGlow?: boolean; // glow on border following cursor
  enableTilt?: boolean; // tilt card based on cursor
  clickEffect?: boolean; // ripple effect on click
  enableMagnetism?: boolean; // subtle attraction to cursor
  disableAnimations?: boolean; // disable all animations
  
  // Effect customization
  spotlightRadius?: number; // px
  particleCount?: number; // number of particles
  glowColor?: string; // rgb string without rgba wrapper e.g. "132, 0, 255"
  
  // Render modes
  variant?: 'container' | 'card' | 'overlay'; // container behavior
  
  // Event handlers (pass through)
  onClick?: React.MouseEventHandler<HTMLElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
}>;

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export default function MagicBento({
  // Container props
  as: Component = "div",
  className,
  style,
  
  // Content props
  title,
  description,
  icon,
  
  // Effect toggles
  enableStars = false,
  enableSpotlight = false,
  enableBorderGlow = false,
  enableTilt = false,
  clickEffect = false,
  enableMagnetism = false,
  disableAnimations = false,
  
  // Effect customization
  spotlightRadius = 300,
  particleCount = 12,
  glowColor = "132, 0, 255",
  
  // Render mode
  variant = "container",
  
  // Event handlers
  onClick,
  onMouseEnter,
  onMouseLeave,
  
  children,
}: MagicBentoProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleMove: React.MouseEventHandler<HTMLElement> = (e) => {
    const el = ref.current;
    if (!el || disableAnimations) return;
    
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPos({ x, y });

    if (enableTilt) {
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const ry = clamp((dx / cx) * 6, -6, 6);
      const rx = clamp((-dy / cy) * 6, -6, 6);
      setTilt({ rx, ry });
    }
  };

  const handleMouseLeave: React.MouseEventHandler<HTMLElement> = (e) => {
    setTilt({ rx: 0, ry: 0 });
    onMouseLeave?.(e);
  };

  const handleMouseEnter: React.MouseEventHandler<HTMLElement> = (e) => {
    onMouseEnter?.(e);
  };

  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    if (clickEffect && !disableAnimations) {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();
        setRipples((prev) => [...prev, { id, x, y }]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);
      }
    }
    onClick?.(e);
  };

  const stars = useMemo(() => {
    if (!enableStars || disableAnimations) return [] as { left: string; top: string; size: number }[];
    return new Array(particleCount).fill(0).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
    }));
  }, [enableStars, particleCount, disableAnimations]);

  // Dynamic styles based on effects
  const containerStyle: React.CSSProperties = {
    ...style, // Ensure custom styles are applied first as base
    borderRadius: style?.borderRadius || '12px', // Default border radius if not specified
    ...(enableTilt && !disableAnimations
      ? {
          transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(1.01)`,
        }
      : {}),
    ...(enableBorderGlow && !disableAnimations
      ? {
          boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 36px rgba(${glowColor}, 0.35)`,
        }
      : {}),
  };

  const spotlightStyle: React.CSSProperties = enableSpotlight && !disableAnimations
    ? {
        background: `radial-gradient(circle at ${pos.x}px ${pos.y}px, rgba(${glowColor}, 0.20), transparent ${spotlightRadius}px)`,
      }
    : {};

  // Base classes based on variant
  const getBaseClasses = () => {
    const baseTransition = disableAnimations ? "" : "transition-all duration-300";
    
    switch (variant) {
      case "card":
        return [
          "relative overflow-hidden border",
          "bg-background/30 backdrop-blur-sm p-6",
          baseTransition,
          !disableAnimations ? "hover:scale-[1.01]" : "",
        ];
      case "overlay":
        return [
          "relative group w-full",
          baseTransition,
          !disableAnimations ? "hover:scale-[1.01]" : "",
        ];
      case "container":
      default:
        return [
          "relative",
          baseTransition,
        ];
    }
  };

  const hasContent = title || description || icon;

  const ComponentTag = (Component ?? 'div') as React.ElementType;

  return (
    <ComponentTag
      ref={ref as React.RefObject<any>}
      onMouseMove={handleMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className={[...getBaseClasses(), className || ""].join(" ")}
      style={containerStyle}
    >
      {/* Spotlight overlay */}
      {enableSpotlight && !disableAnimations && (
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={spotlightStyle}
        />
      )}

      {/* Floating stars */}
      {enableStars && !disableAnimations && (
        <div className="pointer-events-none absolute inset-0 z-10">
          {stars.map((s, i) => (
            <span
              key={i}
              style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
              className="absolute rounded-full bg-white/70 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Content rendering */}
      <div className="relative z-10 w-full h-full">
        {hasContent && variant === "card" ? (
          <div className="flex items-start gap-4">
            {icon && (
              <div className="shrink-0">
                {icon}
              </div>
            )}
            <div className="space-y-1 flex-1">
              {title && <h3 className="text-lg font-semibold">{title}</h3>}
              {description && (
                <p className="text-muted-foreground text-sm">
                  {description}
                </p>
              )}
              {children && <div className="mt-4">{children}</div>}
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Click ripple effect */}
      {clickEffect && !disableAnimations && (
        <div className="pointer-events-none absolute inset-0 z-30">
          {ripples.map((r) => (
            <span
              key={r.id}
              style={{ left: r.x, top: r.y }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white/10"
            >
              <span className="block w-1 h-1 animate-[ripple_0.6s_ease-out]" />
            </span>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(200); opacity: 0; }
        }
      `}</style>
    </ComponentTag>
  );
}