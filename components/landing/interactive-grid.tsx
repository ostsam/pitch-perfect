"use client";

import { useEffect, useRef } from "react";

export function InteractiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const mouse = { x: width / 2, y: height / 2 };
    const points: { x: number; y: number; ox: number; oy: number }[] = [];
    const spacing = 50;

    // Initialize grid points
    for (let x = 0; x < width + spacing; x += spacing) {
      for (let y = 0; y < height + spacing; y += spacing) {
        points.push({ x, y, ox: x, oy: y });
      }
    }

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Draw Grid
      ctx.beginPath();

      // Update points based on mouse influence
      for (const p of points) {
        const dx = p.ox - mouse.x;
        const dy = p.oy - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 300;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          const angle = Math.atan2(dy, dx);
          // Push away
          p.x = p.ox + Math.cos(angle) * force * 50;
          p.y = p.oy + Math.sin(angle) * force * 50;
        } else {
          // Return to original with easing
          p.x += (p.ox - p.x) * 0.1;
          p.y += (p.oy - p.y) * 0.1;
        }

        // Draw point
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fillRect(p.x, p.y, 1, 1);
      }

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 opacity-40 pointer-events-none"
    />
  );
}
