import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { HELIX_MORPH, SCULPTURE_SHAPES, SPHERE_MORPH } from "@/lib/sculptureShapes";

const TAU = Math.PI * 2;
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const HELIX_MORPH_START = HELIX_MORPH.start;
const HELIX_MORPH_END = HELIX_MORPH.end;
const SPHERE_MORPH_START = SPHERE_MORPH.start;
const SPHERE_MORPH_END = SPHERE_MORPH.end;

const shapeYaw = [0.4, 0.62, -0.1, 0.18, -0.15, -0.35];
const shapeTilt = [0.12, 0.24, 0.52, 0.14, 0.38, 0.55];
const shapeCache = new Map<string, Float32Array[]>();

// Depth is quantized so each segment reuses a prebuilt color instead of formatting and parsing a new string.
const DEPTH_LEVELS = 32;
function buildLevels<T>(value: (depth: number) => T) {
  return Array.from({ length: DEPTH_LEVELS }, (_, level) => value((level + 0.5) / DEPTH_LEVELS));
}
const palettes = [false, true].map(mobile => ({
  accent: buildLevels(depth => `rgba(196, 187, 255, ${mobile ? 0.2 + depth * 0.72 : 0.13 + depth * 0.59})`),
  base: buildLevels(depth => `rgba(${Math.round(83 + depth * 100)}, ${Math.round(176 + depth * 70)}, ${Math.round(193 + depth * 62)}, ${mobile ? 0.09 + depth * 0.56 : 0.06 + depth * 0.45})`),
  accentWidth: buildLevels(depth => (mobile ? 1.08 : 0.98) * (0.7 + depth * 0.5)),
  baseWidth: buildLevels(depth => (mobile ? 0.78 : 0.67) * (0.7 + depth * 0.5)),
  dot: buildLevels(depth => `rgba(207, 255, 253, ${mobile ? 0.38 + depth * 0.62 : 0.27 + depth * 0.7})`),
}));

function geometryFor(lines: number, samples: number) {
  const cacheKey = `${lines}:${samples}`;
  const cached = shapeCache.get(cacheKey);
  if (cached) return cached;

  const pointCount = lines * (samples + 1);
  const shapes = SCULPTURE_SHAPES.map(() => new Float32Array(pointCount * 3));
  for (let line = 0; line < lines; line++) {
    const v = line / lines * TAU;
    const q = lines > 1 ? (line / (lines - 1)) * 2 - 1 : 0;
    for (let step = 0; step <= samples; step++) {
      const t = step / samples;
      const u = t * TAU;
      const offset = (line * (samples + 1) + step) * 3;

      const latitude = t * Math.PI;
      const longitude = v + u * 0.12;
      const sinLatitude = Math.sin(latitude);
      const sx = sinLatitude * Math.cos(longitude);
      const sy = Math.cos(latitude);
      const sz = sinLatitude * Math.sin(longitude);
      shapes[0][offset] = sx;
      shapes[0][offset + 1] = sy;
      shapes[0][offset + 2] = sz;

      const maxAxis = Math.max(Math.abs(sx), Math.abs(sy), Math.abs(sz), 0.00001);
      const cubeScale = 0.68 / maxAxis;
      shapes[1][offset] = sx * cubeScale;
      shapes[1][offset + 1] = sy * cubeScale;
      shapes[1][offset + 2] = sz * cubeScale;

      shapes[2][offset] = 0.92 * (2 * t - 1);
      shapes[2][offset + 1] = 0.66 * q;
      shapes[2][offset + 2] = 0.22 * Math.sin(1.5 * u + 1.6 * q) + 0.08 * Math.sin(Math.PI * q);

      const angle = t * TAU * 1.7 + (line % 2) * Math.PI;
      shapes[3][offset] = Math.cos(angle) * (0.49 + 0.12 * Math.cos(v));
      shapes[3][offset + 1] = (t - 0.5) * 2.3;
      shapes[3][offset + 2] = Math.sin(angle) * (0.49 + 0.12 * Math.cos(v)) + 0.12 * Math.sin(v);

      const ribbonWidth = 0.3 * q;
      const ribbonRadius = 0.63 + ribbonWidth * Math.cos(u * 0.5);
      shapes[4][offset] = ribbonRadius * Math.cos(u);
      shapes[4][offset + 1] = 1.1 * ribbonWidth * Math.sin(u * 0.5);
      shapes[4][offset + 2] = ribbonRadius * Math.sin(u);

      const twist = v + u * 3;
      const tube = 0.29;
      shapes[5][offset] = (0.79 + tube * Math.cos(twist)) * Math.cos(u);
      shapes[5][offset + 1] = (0.79 + tube * Math.cos(twist)) * Math.sin(u);
      shapes[5][offset + 2] = tube * Math.sin(twist);
    }
  }
  shapeCache.set(cacheKey, shapes);
  return shapes;
}

// The intro morphs through every shape in order and ends on the donut that the scroll sequence starts from.
function introShapeState(intro: number) {
  const last = SCULPTURE_SHAPES.length - 1;
  const phase = intro * last;
  const base = Math.floor(phase);
  const from = Math.min(last - 1, Math.max(0, base));
  return { from, to: from + 1, amount: smooth(phase - base) };
}

// While the intro scales this canvas up, its rectangle is visible on screen, so fade the glow and lines out before the edges.
function softenEdges(ctx: CanvasRenderingContext2D, width: number, height: number, fadeX: number, fadeY: number) {
  const erase = (x0: number, y0: number, x1: number, y1: number) => {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
    gradient.addColorStop(0.25, "rgba(0, 0, 0, 0.84)");
    gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.5)");
    gradient.addColorStop(0.75, "rgba(0, 0, 0, 0.16)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0) || width, Math.abs(y1 - y0) || height);
  };
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  erase(0, 0, fadeX, 0);
  erase(width, 0, width - fadeX, 0);
  erase(0, 0, 0, fadeY);
  erase(0, height, 0, height - fadeY);
  ctx.restore();
}

type ScrollSculptureProps = {
  progress: MotionValue<number>;
  introProgress: MotionValue<number>;
  paused: boolean;
};

/** Scroll scrubs the geometry, camera, and final sphere rotation. Rendering stops at rest. */
export default function ScrollSculpture({ progress, introProgress, paused }: ScrollSculptureProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const current = useRef(progress.get());
  const exitProgress = useRef(0);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d", { alpha: true });
    if (!el || !ctx) return;
    let width = 0, height = 0, frame = 0;
    let exitTarget = exitProgress.current;
    let exitDirty = true;
    let visible = true, disposed = false;
    const frozenProgress = current.current;

    function draw(p: number, exit: number) {
      const intro = clamp(introProgress.get());
      const introActive = intro < 0.9999;
      const normalHelix = smooth((p - HELIX_MORPH_START) / (HELIX_MORPH_END - HELIX_MORPH_START));
      const normalGlobe = smooth((p - SPHERE_MORPH_START) / (SPHERE_MORPH_END - SPHERE_MORPH_START));
      const selected = introShapeState(intro);
      const yaw = introActive ? mix(shapeYaw[selected.from], shapeYaw[selected.to], selected.amount) : -0.35 + p * 3.7;
      const tilt = introActive ? mix(shapeTilt[selected.from], shapeTilt[selected.to], selected.amount) : 0.55 - p * 0.85;

      ctx!.clearRect(0, 0, width, height);
      const mobile = width < 760;
      const rightCenter = mobile ? 0.62 : 0.74;
      const leftCenter = mobile ? 0.38 : 0.24;
      const centerAfterFirstMorph = mix(rightCenter, leftCenter, normalHelix);
      const cx = width * mix(centerAfterFirstMorph, rightCenter, normalGlobe);
      const cy = height * (mobile ? 0.56 : 0.5);
      const radius = Math.min(width * (mobile ? 0.57 : 0.25), height * 0.39);
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw), cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const lines = mobile ? 36 : 56;
      const samples = mobile ? 66 : 90;
      const shapes = geometryFor(lines, samples);
      const palette = palettes[mobile ? 1 : 0];
      let lastStroke = "", lastWidth = -1;
      const sphereArrival = smooth((p - SPHERE_MORPH_START) / (1 - SPHERE_MORPH_START));
      const spin = sphereArrival * TAU * 0.7 + exit * TAU * 0.7;
      const cosSpin = Math.cos(spin), sinSpin = Math.sin(spin);
      const halo = ctx!.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.6);
      const introHalo = 0.12 * (1 - smooth(p / 0.18));
      const shapeGlow = Math.max(introHalo, normalGlobe * 0.04);
      halo.addColorStop(0, `rgba(38, 176, 184, ${mobile ? 0.12 + shapeGlow : 0.08 + shapeGlow * 0.75})`);
      halo.addColorStop(0.6, mobile ? "rgba(71, 137, 191, 0.06)" : "rgba(55, 111, 160, 0.04)");
      halo.addColorStop(0.8, mobile ? "rgba(71, 137, 191, 0.018)" : "rgba(55, 111, 160, 0.012)");
      halo.addColorStop(1, "rgba(10, 14, 21, 0)");
      ctx!.fillStyle = halo;
      ctx!.fillRect(0, 0, width, height);
      const project = (x: number, y: number, z: number) => {
        const rx = x * cosY + z * sinY, rz = -x * sinY + z * cosY;
        const ry = y * cosT - rz * sinT, depth = y * sinT + rz * cosT;
        const perspective = 3.9 / (3.9 - depth);
        return { x: cx + rx * radius * perspective, y: cy + ry * radius * perspective, z: depth };
      };
      for (let line = 0; line < lines; line++) {
        let previous: ReturnType<typeof project> | null = null;
        for (let step = 0; step <= samples; step++) {
          const offset = (line * (samples + 1) + step) * 3;
          const sphereX = shapes[0][offset], sphereY = shapes[0][offset + 1], sphereZ = shapes[0][offset + 2];
          const spunSphereX = sphereX * cosSpin + sphereZ * sinSpin;
          const spunSphereZ = -sphereX * sinSpin + sphereZ * cosSpin;
          let x: number, y: number, z: number;
          if (introActive) {
            const fromX = selected.from === 0 ? spunSphereX : shapes[selected.from][offset];
            const fromY = selected.from === 0 ? sphereY : shapes[selected.from][offset + 1];
            const fromZ = selected.from === 0 ? spunSphereZ : shapes[selected.from][offset + 2];
            x = mix(fromX, shapes[selected.to][offset], selected.amount);
            y = mix(fromY, shapes[selected.to][offset + 1], selected.amount);
            z = mix(fromZ, shapes[selected.to][offset + 2], selected.amount);
          } else {
            x = mix(mix(shapes[5][offset], shapes[3][offset], normalHelix), spunSphereX, normalGlobe);
            y = mix(mix(shapes[5][offset + 1], shapes[3][offset + 1], normalHelix), sphereY, normalGlobe);
            z = mix(mix(shapes[5][offset + 2], shapes[3][offset + 2], normalHelix), spunSphereZ, normalGlobe);
          }
          const point = project(x, y, z);
          const depth = clamp((point.z + 1.1) / 2.2);
          const level = Math.min(DEPTH_LEVELS - 1, Math.floor(depth * DEPTH_LEVELS));
          if (previous) {
            ctx!.beginPath(); ctx!.moveTo(previous.x, previous.y); ctx!.lineTo(point.x, point.y);
            const accent = line % 7 === 0;
            const stroke = (accent ? palette.accent : palette.base)[level];
            const width = (accent ? palette.accentWidth : palette.baseWidth)[level];
            if (stroke !== lastStroke) { ctx!.strokeStyle = stroke; lastStroke = stroke; }
            if (width !== lastWidth) { ctx!.lineWidth = width; lastWidth = width; }
            ctx!.stroke();
          }
          if (step % 9 === 0 && line % 3 === 0) {
            ctx!.beginPath(); ctx!.arc(point.x, point.y, 0.7 + depth * 1.1, 0, TAU);
            ctx!.fillStyle = palette.dot[level]; ctx!.fill();
          }
          previous = point;
        }
      }
      const edgeFade = introActive ? 1 - smooth((intro - 0.92) / 0.08) : 0;
      if (edgeFade > 0) softenEdges(ctx!, width, height, width * (mobile ? 0.24 : 0.08) * edgeFade, height * 0.06 * edgeFade);
    }
    function render() {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const target = paused ? frozenProgress : progress.get();
      if (exitDirty) measureExitProgress();
      current.current += (target - current.current) * 0.16;
      if (Math.abs(target - current.current) < 0.0001) current.current = target;
      const introActive = clamp(introProgress.get()) < 0.9999;
      const sphereStrength = introActive ? 0 : smooth((current.current - SPHERE_MORPH_START) / (SPHERE_MORPH_END - SPHERE_MORPH_START));
      if (sphereStrength > 0.01) {
        exitProgress.current += (exitTarget - exitProgress.current) * 0.16;
        if (Math.abs(exitTarget - exitProgress.current) < 0.0001) exitProgress.current = exitTarget;
      } else {
        exitProgress.current = exitTarget;
      }
      draw(current.current, exitProgress.current);
      if (current.current !== target || exitProgress.current !== exitTarget) frame = requestAnimationFrame(render);
    }
    function schedule() { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render); }
    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }
    function measureExitProgress() {
      exitDirty = false;
      if (!paused) {
        const story = el!.closest<HTMLElement>(".cinematic-story");
        const viewportHeight = Math.max(1, window.innerHeight || height);
        const scrollPastStory = story
          ? (viewportHeight - story.getBoundingClientRect().bottom) / viewportHeight
          : -el!.getBoundingClientRect().top / Math.max(1, height);
        exitTarget = progress.get() >= 0.999 ? clamp(scrollPastStory) : 0;
      }
    }
    function updateExitProgress() {
      exitDirty = true;
      schedule();
    }
    function resize() {
      width = el!.clientWidth; height = el!.clientHeight;
      // Capped at 1.5x: drawing at full retina resolution roughly doubles the cost of every frame.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      el!.width = Math.round(width * dpr); el!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      updateExitProgress();
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(el);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else stop();
    }); observer.observe(el);
    const unsubscribe = paused ? () => {} : progress.on("change", updateExitProgress);
    const unsubscribeIntro = paused ? () => {} : introProgress.on("change", schedule);
    const handleVisibility = () => { if (document.hidden) stop(); else updateExitProgress(); };
    document.addEventListener("visibilitychange", handleVisibility);
    if (!paused) window.addEventListener("scroll", updateExitProgress, { passive: true });
    resize();
    return () => {
      disposed = true;
      stop();
      resizeObserver.disconnect();
      observer.disconnect();
      unsubscribe();
      unsubscribeIntro();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (!paused) window.removeEventListener("scroll", updateExitProgress);
    };
  }, [progress, introProgress, paused]);

  return <canvas className="scroll-sculpture" ref={canvas} aria-hidden="true" />;
}
