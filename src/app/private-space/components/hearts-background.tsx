'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Heart {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  animationDuration: string;
}

const HeartIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-full h-full", className)} {...props}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
);

export function HeartsBackground() {
  const [hearts, setHearts] = useState<Heart[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastHeartTime = useRef(0);

  const removeHeart = useCallback((id: number) => {
    setHearts(prevHearts => prevHearts.filter(heart => heart.id !== id));
  }, []);

  const createHeart = useCallback((e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const id = Date.now() + Math.random();
        const colors = ['#ef4444', '#f472b6', '#f87171', '#fb7185', '#ec4899'];
        
        const newHeart: Heart = {
          id,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          size: Math.random() * 20 + 15,
          color: colors[Math.floor(Math.random() * colors.length)],
          animationDuration: `${Math.random() * 2 + 3}s`, // 3-5 seconds
        };

        setHearts(prevHearts => {
            const newHearts = [...prevHearts, newHeart];
            // Limit the number of hearts on screen
            if (newHearts.length > 50) {
                return newHearts.slice(newHearts.length - 50);
            }
            return newHearts;
        });
      }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle creation to avoid overwhelming the DOM
      const now = Date.now();
      if (now - lastHeartTime.current > 50) { // create a heart every 50ms max
          lastHeartTime.current = now;
          createHeart(e);
      }
    };

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);

    return () => {
      container?.removeEventListener('mousemove', handleMouseMove);
    };
  }, [createHeart]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-black cursor-none">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute animate-float-heart pointer-events-none"
          style={{
            left: heart.x,
            top: heart.y,
            width: `${heart.size}px`,
            height: `${heart.size}px`,
            transform: 'translate(-50%, -50%)',
            animationDuration: heart.animationDuration,
          }}
          onAnimationEnd={() => removeHeart(heart.id)}
        >
          <HeartIcon
            style={{
              color: heart.color,
              filter: `drop-shadow(0 0 6px ${heart.color})`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
