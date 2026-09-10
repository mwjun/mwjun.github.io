import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

const TAU = Math.PI * 2;
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Scroll scrubs a deterministic geometry and camera sequence. Rendering stops at rest. */
export default function ScrollSculpture({ progress, paused }: { progress: MotionValue<number>; paused: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const current = useRef(progress.get());
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d", { alpha: true });
    if (!el || !ctx) return;
    let width = 0, height = 0, frame = 0;
    let visible = true, disposed = false;
    const frozenProgress = current.current;

    function draw(p: number) {
      ctx!.clearRect(0, 0, width, height);
      const mobile = width < 760;
      const cx = width * (mobile ? 0.62 : 0.74);
      const cy = height * (mobile ? 0.56 : 0.5);
      const radius = Math.min(width * (mobile ? 0.57 : 0.25), height * 0.39);
      const helix = smooth((p - 0.15) / 0.29);
      const globe = smooth((p - 0.58) / 0.29);
      const yaw = -0.35 + p * 3.7, tilt = 0.55 - p * 0.85;
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw), cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const lines = mobile ? 36 : 56, samples = mobile ? 66 : 90;
      const halo = ctx!.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.6);
      halo.addColorStop(0, `rgba(38, 156, 165, ${0.07 + globe * 0.025})`);
      halo.addColorStop(0.6, "rgba(55, 111, 160, 0.035)");
      halo.addColorStop(1, "rgba(10, 14, 21, 0)");
      ctx!.fillStyle = halo;
      ctx!.fillRect(0, 0, width, height);
      const project = (x: number, y: number, z: number) => {
        const rx = x * cosY + z * sinY, rz = -x * sinY + z * cosY;
        const ry = y * cosT - rz * sinT, depth = y * sinT + rz * cosT;
        const perspective = 3.9 / (3.9 - depth);
        return { x: cx + rx * radius * perspective, y: cy + ry * radius * perspective, z: depth };
      };
      for (let i = 0; i < (mobile ? 45 : 100); i++) {
        const x = ((i * 0.61803398875) % 1) * width, y = ((i * 0.381966 + 0.14) % 1) * height;
        ctx!.fillStyle = `rgba(175, 220, 230, ${0.12 + (i % 4) * 0.05})`;
        ctx!.fillRect(x, y, i % 7 === 0 ? 1.5 : 0.8, i % 7 === 0 ? 1.5 : 0.8);
      }
      // Corresponding points interpolate between a braided torus, double helix, and sphere.
      for (let line = 0; line < lines; line++) {
        const v = line / lines * TAU;
        let previous: ReturnType<typeof project> | null = null;
        for (let step = 0; step <= samples; step++) {
          const t = step / samples, u = t * TAU, twist = v + u * 3, tube = 0.29;
          const tx = (0.79 + tube * Math.cos(twist)) * Math.cos(u);
          const ty = (0.79 + tube * Math.cos(twist)) * Math.sin(u), tz = tube * Math.sin(twist);
          const angle = t * TAU * 1.7 + (line % 2) * Math.PI;
          const hx = Math.cos(angle) * (0.49 + 0.12 * Math.cos(v)), hy = (t - 0.5) * 2.3;
          const hz = Math.sin(angle) * (0.49 + 0.12 * Math.cos(v)) + 0.12 * Math.sin(v);
          const latitude = t * Math.PI;
          const sx = Math.sin(latitude) * Math.cos(v + u * 0.12), sy = Math.cos(latitude), sz = Math.sin(latitude) * Math.sin(v + u * 0.12);
          const point = project(mix(mix(tx, hx, helix), sx, globe), mix(mix(ty, hy, helix), sy, globe), mix(mix(tz, hz, helix), sz, globe));
          const depth = clamp((point.z + 1.1) / 2.2);
          if (previous) {
            ctx!.beginPath(); ctx!.moveTo(previous.x, previous.y); ctx!.lineTo(point.x, point.y);
            ctx!.strokeStyle = line % 7 === 0 ? `rgba(184, 175, 246, ${0.12 + depth * 0.57})` : `rgba(${Math.round(83 + depth * 90)}, ${Math.round(166 + depth * 70)}, ${Math.round(183 + depth * 64)}, ${0.055 + depth * 0.43})`;
            ctx!.lineWidth = (line % 7 === 0 ? 0.95 : 0.65) * (0.7 + depth * 0.5);
            ctx!.stroke();
          }
          if (step % 9 === 0 && line % 3 === 0) {
            ctx!.beginPath(); ctx!.arc(point.x, point.y, 0.7 + depth * 1.1, 0, TAU);
            ctx!.fillStyle = `rgba(197, 248, 246, ${0.25 + depth * 0.7})`; ctx!.fill();
          }
          previous = point;
        }
      }
    }
    function render() {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const target = paused ? frozenProgress : progress.get();
      current.current += (target - current.current) * 0.16;
      if (Math.abs(target - current.current) < 0.0001) current.current = target;
      draw(current.current);
      if (current.current !== target) frame = requestAnimationFrame(render);
    }
    function schedule() { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render); }
    function resize() {
      const bounds = el!.getBoundingClientRect(); width = bounds.width; height = bounds.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      el!.width = Math.round(width * dpr); el!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0); schedule();
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(el);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); }); observer.observe(el);
    const unsubscribe = paused ? () => {} : progress.on("change", schedule);
    document.addEventListener("visibilitychange", schedule);
    resize();
    return () => { disposed = true; cancelAnimationFrame(frame); resizeObserver.disconnect(); observer.disconnect(); unsubscribe(); document.removeEventListener("visibilitychange", schedule); };
  }, [progress, paused]);
  return <canvas className="scroll-sculpture" ref={canvas} aria-hidden="true" />;
}
