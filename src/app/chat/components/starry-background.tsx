"use client";

import { useEffect, useRef } from 'react';

export function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let shootingStarInterval: NodeJS.Timeout;

    // Set canvas size based on its container
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];

    // --- Classes from user script ---

    class Star {
      x: number;
      y: number;
      size: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.opacity = Math.random();
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      update() {
        this.opacity -= 0.01;
        if (this.opacity < 0) {
          this.opacity = Math.random();
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
        }
      }
    }

    class ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.length = Math.random() * 100 + 50;
        this.speed = Math.random() * 10 + 5;
        this.angle = Math.random() * 0.2 - 0.1;
        this.opacity = 1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(this.angle) * this.length, this.y + Math.sin(this.angle) * this.length);
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      update() {
        this.x -= this.speed * Math.cos(this.angle);
        this.y -= this.speed * Math.sin(this.angle);
        this.opacity -= 0.02;

        if (this.opacity <= 0) {
            return false;
        }
        return true;
      }
    }

    // --- Functions from user script ---

    function createShootingStar() {
        shootingStars.push(new ShootingStar());
    }

    function init() {
      if(!canvas) return;
      stars.length = 0;
      shootingStars.length = 0;
      for (let i = 0; i < 200; i++) {
        stars.push(new Star());
      }
    }

    function animate() {
      if (!ctx || !canvas) return;
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        star.draw();
        star.update();
      });
      
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        shootingStars[i].draw();
        if (!shootingStars[i].update()) {
            shootingStars.splice(i, 1);
        }
      }
    }
    
    // --- Setup and Cleanup ---

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      init(); // Re-initialize stars for new size
    };

    window.addEventListener('resize', handleResize);
    
    init();
    animate();
    shootingStarInterval = setInterval(createShootingStar, 2000);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearInterval(shootingStarInterval);
    };
  }, []);

  // The canvas is positioned absolutely to fill its parent container.
  return <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full bg-black" />;
}
