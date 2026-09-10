import { useEffect, useRef, type RefObject } from "react";
import type { MotionValue } from "framer-motion";
import { getTimelineAnchor } from "@/lib/timeline-anchor";

const TAU = Math.PI * 2;
const SPACING = 1.55;
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** Travel and camera orbit are both controlled by timeline position. */
export default function JourneyHelix({ position, count, paused, cards }: { position: MotionValue<number>; count: number; paused: boolean; cards?: RefObject<(HTMLElement | null)[]> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderedPosition = useRef(position.get());

  useEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext("2d");
    if (!element || !ctx) return;
    let width = 0, height = 0, frame = 0, lastTime = 0;
    let visible = true, disposed = false;
    const frozen = renderedPosition.current;

    function draw(value: number) {
      const mobile = width < 760;
      // Batch layout reads before drawing. Each endpoint belongs to its own card,
      // including while the camera catches up and the sticky scene enters/exits.
      const bounds = element!.getBoundingClientRect();
      const anchors = mobile ? [] : (cards?.current ?? []).map(card => card ? getTimelineAnchor(bounds, card.getBoundingClientRect(), window.innerHeight) : null);
      ctx!.clearRect(0, 0, width, height);
      const unit = Math.min(height * 0.235, width * (mobile ? 0.34 : 0.2));
      const cx = width * (mobile ? 0.42 : 0.31), cy = height * 0.5;
      const cameraY = value * SPACING;
      const rotation = -value * 0.57 + 0.35;
      const project = (y: number, phase = 0, filament = 0) => {
        const angle = y * 1.22 + rotation + phase;
        const radius = 0.94 + filament * 0.018;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const perspective = 4.8 / (4.8 - z);
        return { x: cx + x * unit * perspective, y: cy + ((y - cameraY) + x * 0.1) * unit * perspective, z };
      };
      const alphaAt = (y: number, z: number) => {
        const edge = clamp(1 - Math.abs(y - cy) / (height * 0.5));
        return edge * (0.28 + (z + 1) * 0.31);
      };
      const halo = ctx!.createRadialGradient(cx, cy, 0, cx, cy, unit * 2.2);
      halo.addColorStop(0, "rgba(62, 151, 161, .2)");
      halo.addColorStop(1, "rgba(8, 11, 16, 0)");
      ctx!.fillStyle = halo; ctx!.fillRect(0, 0, width, height);

      // Two whole-strand glow passes, rather than a blur on every segment.
      for (let strand = 0; strand < 2; strand++) {
        ctx!.beginPath();
        for (let step = 0; step <= 150; step++) {
          const point = project(cameraY - 4 + step / 150 * 8, strand * Math.PI);
          if (step === 0) ctx!.moveTo(point.x, point.y);
          else ctx!.lineTo(point.x, point.y);
        }
        ctx!.strokeStyle = strand === 0 ? "rgba(101, 226, 219, .07)" : "rgba(167, 140, 248, .07)";
        ctx!.lineWidth = mobile ? 9 : 15; ctx!.stroke();
        ctx!.shadowColor = strand === 0 ? "#79e6de" : "#aa93ed";
        ctx!.shadowBlur = mobile ? 8 : 16;
        ctx!.strokeStyle = strand === 0 ? "rgba(129, 239, 229, .48)" : "rgba(179, 157, 250, .42)";
        ctx!.lineWidth = 2.5; ctx!.stroke();
        ctx!.shadowBlur = 0;
        ctx!.shadowColor = "transparent";
      }

      // Cross ties make the rotation and downward travel legible between milestones.
      const start = Math.floor((cameraY - 4) / 0.16) * 0.16;
      for (let y = start; y < cameraY + 4; y += 0.16) {
        const a = project(y), b = project(y, Math.PI);
        const alpha = alphaAt((a.y + b.y) / 2, 0) * 0.35;
        ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y);
        ctx!.strokeStyle = `rgba(126, 164, 194, ${alpha})`; ctx!.lineWidth = 0.7; ctx!.stroke();
      }
      for (let strand = 0; strand < 2; strand++) {
        for (let filament = -3; filament <= 3; filament++) {
          let previous = project(cameraY - 4, strand * Math.PI, filament);
          for (let step = 1; step <= (mobile ? 130 : 190); step++) {
            const y = cameraY - 4 + step / (mobile ? 130 : 190) * 8;
            const next = project(y, strand * Math.PI, filament);
            ctx!.beginPath(); ctx!.moveTo(previous.x, previous.y); ctx!.lineTo(next.x, next.y);
            const alpha = alphaAt(next.y, next.z) * (filament === 0 ? 1 : 0.52);
            ctx!.strokeStyle = strand === 0 ? `rgba(171, 235, 229, ${alpha})` : `rgba(168, 154, 229, ${alpha})`;
            ctx!.lineWidth = filament === 0 ? 1.8 : 0.7; ctx!.stroke();
            previous = next;
          }
        }
      }

      // Light accents travel along the strands as the visitor scrolls; no idle loop.
      for (let strand = 0; strand < 2; strand++) {
        for (let bead = 0; bead < 5; bead++) {
          const y = cameraY - 3 + ((bead * 1.2 + value * 0.42) % 6);
          const point = project(y, strand * Math.PI);
          const alpha = alphaAt(point.y, point.z);
          ctx!.beginPath(); ctx!.arc(point.x, point.y, 4, 0, TAU);
          ctx!.fillStyle = `rgba(168, 239, 232, ${alpha * 0.2})`; ctx!.fill();
          ctx!.beginPath(); ctx!.arc(point.x, point.y, 1.5, 0, TAU);
          ctx!.fillStyle = `rgba(221, 255, 249, ${alpha})`; ctx!.fill();
        }
      }
      const active = Math.round(value);
      // Milestones occupy real positions on the helix; future nodes orbit into view.
      for (let i = 0; i < count; i++) {
        if (Math.abs(i - value) > 3) continue;
        const point = project(i * SPACING);
        const alpha = alphaAt(point.y, point.z);
        const selected = i === active;
        const anchor = anchors[i];
        if (anchor && alpha > 0.02 && anchor.x > point.x + 14) {
          const elbowX = point.x + (anchor.x - point.x) * 0.55;
          ctx!.beginPath(); ctx!.moveTo(point.x, point.y);
          ctx!.lineTo(elbowX, point.y);
          ctx!.lineTo(anchor.x - 12, anchor.y);
          ctx!.lineTo(anchor.x, anchor.y);
          ctx!.strokeStyle = `rgba(186, 235, 235, ${Math.max(0.2, alpha * 0.85)})`;
          ctx!.lineWidth = 1; ctx!.stroke();
          ctx!.beginPath(); ctx!.arc(anchor.x, anchor.y, 3, 0, TAU);
          ctx!.fillStyle = "#c9f6ef"; ctx!.fill();
        }
        if (selected) {
          const aura = ctx!.createRadialGradient(point.x, point.y, 0, point.x, point.y, 28);
          aura.addColorStop(0, `rgba(151, 245, 230, ${alpha * 0.45})`);
          aura.addColorStop(1, "rgba(151, 245, 230, 0)");
          ctx!.fillStyle = aura; ctx!.fillRect(point.x - 28, point.y - 28, 56, 56);
        }
        ctx!.beginPath(); ctx!.arc(point.x, point.y, selected ? 15 : 8, 0, TAU);
        ctx!.strokeStyle = `rgba(185, 233, 230, ${alpha * 0.7})`; ctx!.lineWidth = 1; ctx!.stroke();
        ctx!.beginPath(); ctx!.arc(point.x, point.y, selected ? 5 : 2.5, 0, TAU);
        ctx!.fillStyle = `rgba(211, 247, 241, ${Math.min(1, alpha + 0.2)})`; ctx!.fill();
      }
    }

    function render(now: number) {
      frame = 0;
      if (disposed || !visible || document.hidden) { lastTime = 0; return; }
      const dt = lastTime ? Math.min(50, now - lastTime) : 16.67;
      lastTime = now;
      const target = paused ? frozen : position.get();
      renderedPosition.current += (target - renderedPosition.current) * (1 - Math.exp(-dt / 85));
      if (Math.abs(target - renderedPosition.current) < 0.0005) renderedPosition.current = target;
      draw(renderedPosition.current);
      if (renderedPosition.current !== target) frame = requestAnimationFrame(render);
      else lastTime = 0;
    }
    function schedule() {
      if (!disposed && !frame && visible && !document.hidden) frame = requestAnimationFrame(render);
    }
    function resize() {
      const bounds = element!.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      const dpr = Math.min(window.devicePixelRatio || 1, width < 760 ? 1.25 : 1.75);
      element!.width = Math.round(width * dpr); element!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0); schedule();
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element);
    // Fonts, wrapping, and card-height changes can move the anchor without a scroll.
    const cardObserver = new ResizeObserver(schedule);
    cards?.current?.forEach(card => { if (card) cardObserver.observe(card); });
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); }); observer.observe(element);
    const unsubscribe = paused ? () => {} : position.on("change", schedule);
    // Native scrolling still moves cards at clamped progress 0/1 and while paused.
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    resize();
    return () => { disposed = true; cancelAnimationFrame(frame); resizeObserver.disconnect(); cardObserver.disconnect(); observer.disconnect(); unsubscribe(); window.removeEventListener("scroll", schedule); document.removeEventListener("visibilitychange", schedule); };
  }, [position, count, paused, cards]);

  return <canvas ref={canvas} className="journey-canvas" aria-hidden="true" />;
}
