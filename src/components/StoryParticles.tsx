import { useEffect, useRef } from "react";
import { THEME_CHANGE_EVENT, themed } from "@/lib/themeColors";

type Particle = {
  angle: number;
  orbit: number;
  speed: number;
  phase: number;
  size: number;
  alpha: number;
  violet: boolean;
};

const seededRandom = () => {
  let seed = 0x51f15e;
  return () => {
    seed = Math.imul(seed ^ (seed >>> 15), seed | 1);
    seed ^= seed + Math.imul(seed ^ (seed >>> 7), seed | 61);
    return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
  };
};

/** A small independent canvas keeps ambient motion inexpensive. */
export default function StoryParticles({ paused }: { paused: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d", { alpha: true });
    if (!element || !context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let disposed = false;
    let lastPaint = 0;
    let scrolling = false;
    let scrollResumeTimer = 0;
    const startedAt = performance.now();
    let particles: Particle[] = [];

    const createParticles = () => {
      const random = seededRandom();
      const count = width < 760 ? 42 : 72;
      particles = Array.from({ length: count }, (_, index) => ({
        angle: random() * Math.PI * 2,
        orbit: 0.66 + random() * 0.82,
        speed: (0.018 + random() * 0.042) * (index % 3 === 0 ? -1 : 1),
        phase: random() * Math.PI * 2,
        size: 0.65 + random() * 1.45,
        alpha: 0.28 + random() * 0.52,
        violet: index % 7 === 0,
      }));
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, width, height);
      const mobile = width < 760;
      const centerX = width * (mobile ? 0.62 : 0.74);
      const centerY = height * (mobile ? 0.56 : 0.5);
      const sculptureRadius = Math.min(width * (mobile ? 0.57 : 0.25), height * 0.39);
      const seconds = (now - startedAt) / 1000;
      for (const particle of particles) {
        const theta = particle.angle + seconds * particle.speed;
        const pulse = Math.sin(seconds * 0.46 + particle.phase) * sculptureRadius * 0.035;
        const orbit = sculptureRadius * particle.orbit + pulse;
        const x = centerX + Math.cos(theta) * orbit + Math.sin(seconds * 0.23 + particle.phase) * 5;
        const y = centerY + Math.sin(theta) * orbit * (mobile ? 0.9 : 0.72) + Math.cos(seconds * 0.19 + particle.phase) * 7;
        const shimmer = 0.72 + Math.sin(seconds * 0.9 + particle.phase) * 0.28;
        const alpha = particle.alpha * shimmer;
        const color = particle.violet ? themed("190, 177, 255", "b") : themed("166, 250, 246", "a");

        const trailLength = 7 + particle.size * 5;
        context.beginPath();
        context.moveTo(x - Math.cos(theta) * trailLength, y - Math.sin(theta) * trailLength * 0.72);
        context.lineTo(x, y);
        context.strokeStyle = `rgba(${color}, ${alpha * 0.24})`;
        context.lineWidth = 0.65;
        context.stroke();

        context.beginPath();
        context.arc(x, y, particle.size * 4.6, 0, Math.PI * 2);
        context.fillStyle = `rgba(${color}, ${alpha * 0.045})`;
        context.fill();

        context.beginPath();
        context.arc(x, y, particle.size * 2.4, 0, Math.PI * 2);
        context.fillStyle = `rgba(${color}, ${alpha * 0.12})`;
        context.fill();

        context.beginPath();
        context.arc(x, y, particle.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(${color}, ${alpha})`;
        context.fill();
      }
    };

    const render = (now: number) => {
      frame = 0;
      if (disposed || !visible || document.hidden || scrolling) return;
      if (now - lastPaint >= 1000 / 30 || paused) {
        draw(now);
        lastPaint = now;
      }
      if (!paused) frame = requestAnimationFrame(render);
    };

    const schedule = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render);
    };

    const handleScroll = () => {
      scrolling = true;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      window.clearTimeout(scrollResumeTimer);
      scrollResumeTimer = window.setTimeout(() => {
        scrolling = false;
        schedule();
      }, 120);
    };

    const resize = () => {
      width = element.clientWidth;
      height = element.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      element.width = Math.round(width * dpr);
      element.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
      schedule();
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });

    resizeObserver.observe(element);
    intersectionObserver.observe(element);
    document.addEventListener("visibilitychange", schedule);
    window.addEventListener(THEME_CHANGE_EVENT, schedule);
    window.addEventListener("scroll", handleScroll, { passive: true });
    resize();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.clearTimeout(scrollResumeTimer);
      document.removeEventListener("visibilitychange", schedule);
      window.removeEventListener(THEME_CHANGE_EVENT, schedule);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [paused]);

  return <canvas ref={canvas} className="story-particles" aria-hidden="true" />;
}
