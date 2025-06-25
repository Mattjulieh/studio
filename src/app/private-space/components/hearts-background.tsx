'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Heart {
  id: number;
  left: string;
  animationDuration: string;
  initialScale: number;
  opacity: number;
  color: string;
}

const HeartIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-full h-full", className)} {...props}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

export function HeartsBackground() {
  const [hearts, setHearts] = useState<Heart[]>([]);

  const removeHeart = useCallback((id: number) => {
    setHearts(prevHearts => prevHearts.filter(heart => heart.id !== id));
  }, []);

  useEffect(() => {
    const createHeart = () => {
      const id = Date.now() + Math.random();
      const colors = ['#ef4444', '#f472b6', '#f87171']; // red-500, pink-400, red-400
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const newHeart: Heart = {
        id,
        left: `${Math.random() * 100}vw`,
        animationDuration: `${Math.random() * 3 + 4}s`, // Slower fall, 4-7s
        initialScale: Math.random() * 0.6 + 0.6, // Slightly smaller, 0.6-1.2
        opacity: Math.random() * 0.5 + 0.5,
        color: color,
      };
      setHearts(prevHearts => {
        if (prevHearts.length > 50) { // Increased max hearts
            return [...prevHearts.slice(1), newHeart];
        }
        return [...prevHearts, newHeart];
      });
    };

    const interval = setInterval(createHeart, 150); // More hearts

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-black pointer-events-none">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute top-[-5vh] animate-fall"
          style={{
            left: heart.left,
            animationDuration: heart.animationDuration,
            animationTimingFunction: 'linear',
            transform: `scale(${heart.initialScale})`,
            opacity: heart.opacity,
          }}
          onAnimationEnd={() => removeHeart(heart.id)}
        >
          <HeartIcon
            className="animate-glow w-5 h-5"
            style={{
              color: heart.color,
              animationDuration: `${Math.random() * 2 + 2}s`,
              animationIterationCount: 'infinite',
            }}
          />
        </div>
      ))}
    </div>
  );
}
