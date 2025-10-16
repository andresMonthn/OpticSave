'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@kit/ui/utils';

interface LogoLoopProps {
  /**
   * Array of logo items to display. Each item can be either a React node or an image src string.
   */
  logos: (React.ReactNode | string)[];
  /**
   * Animation speed in pixels per second. Positive values move based on direction, negative values reverse direction.
   * @default 120
   */
  speed?: number;
  /**
   * Direction of the logo animation loop.
   * @default 'left'
   */
  direction?: 'left' | 'right';
  /**
   * Width of the logo loop container.
   * @default '100%'
   */
  width?: number | string;
  /**
   * Height of the logos in pixels.
   * @default 28
   */
  logoHeight?: number;
  /**
   * Gap between logos in pixels.
   * @default 32
   */
  gap?: number;
  /**
   * Whether to pause the animation when hovering over the component.
   * @default true
   */
  pauseOnHover?: boolean;
  /**
   * Whether to apply fade-out effect at the edges of the container.
   * @default false
   */
  fadeOut?: boolean;
  /**
   * Color used for the fade-out effect. Only applies when fadeOut is true.
   */
  fadeOutColor?: string;
  /**
   * Whether to scale logos on hover.
   * @default false
   */
  scaleOnHover?: boolean;
  /**
   * Accessibility label for the logo loop component.
   * @default 'Partner logos'
   */
  ariaLabel?: string;
  /**
   * Additional CSS class names to apply to the root element.
   */
  className?: string;
  /**
   * Inline styles to apply to the root element.
   */
  style?: React.CSSProperties;
}

export function LogoLoop({
  logos,
  speed = 120,
  direction = 'left',
  width = '100%',
  logoHeight = 28,
  gap = 32,
  pauseOnHover = true,
  fadeOut = false,
  fadeOutColor,
  scaleOnHover = false,
  ariaLabel = 'Partner logos',
  className,
  style,
}: LogoLoopProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(1);

  // Determine animation direction
  const actualDirection = speed >= 0 ? direction : direction === 'left' ? 'right' : 'left';
  const actualSpeed = Math.abs(speed);

  // Calculate animation duration based on speed and container width
  useEffect(() => {
    if (!containerRef.current || !innerRef.current) return;

    const calculateDimensions = () => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setContainerWidth(containerRect.width);
      }

      // Calculate how many times we need to duplicate the logos to fill the container
      const innerWidth = innerRef.current?.scrollWidth || 0;
      const requiredDuplicates = Math.ceil((containerRect?.width || 0) / innerWidth) + 1;
      setDuplicateCount(Math.max(1, requiredDuplicates));
    };

    calculateDimensions();

    const resizeObserver = new ResizeObserver(calculateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [logos, gap]);

  // Create duplicated logo arrays to ensure continuous animation
  const duplicatedLogos = Array(duplicateCount)
    .fill(0)
    .flatMap(() => logos);

  // Calculate animation duration based on speed and container width
  const animationDuration = containerWidth > 0 ? containerWidth / actualSpeed : 10;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        pauseOnHover && 'group',
        className
      )}
      style={{
        width,
        ...style,
      }}
      aria-label={ariaLabel}
    >
      {/* Fade out effect at the edges */}
      {fadeOut && (
        <>
          <div
            className="absolute left-0 top-0 z-10 h-full w-12 pointer-events-none"
            style={{
              background: `linear-gradient(to right, ${fadeOutColor || 'var(--background, white)'}, transparent)`,
            }}
          />
          <div
            className="absolute right-0 top-0 z-10 h-full w-12 pointer-events-none"
            style={{
              background: `linear-gradient(to left, ${fadeOutColor || 'var(--background, white)'}, transparent)`,
            }}
          />
        </>
      )}

      {/* Logo container with animation */}
      <div
        ref={innerRef}
        className={cn(
          'flex items-center',
          pauseOnHover && 'group-hover:[animation-play-state:paused]'
        )}
        style={{
          gap: `${gap}px`,
          animation: `scroll-${actualDirection} ${animationDuration}s linear infinite`,
          height: `${logoHeight + 16}px`, // Add some padding
        }}
        onMouseEnter={() => pauseOnHover && setIsPaused(true)}
        onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      >
        {duplicatedLogos.map((logo, index) => (
          <div
            key={index}
            className={cn(
              'flex-shrink-0 transition-transform duration-300',
              scaleOnHover && 'hover:scale-110'
            )}
            style={{
              height: `${logoHeight}px`,
            }}
          >
            {typeof logo === 'string' ? (
              <img 
                src={logo} 
                alt={`Logo ${index}`} 
                style={{ height: '100%', width: 'auto' }} 
              />
            ) : (
              logo
            )}
          </div>
        ))}
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes scroll-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-100% / ${duplicateCount}));
          }
        }

        @keyframes scroll-right {
          from {
            transform: translateX(calc(-100% / ${duplicateCount}));
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default LogoLoop;