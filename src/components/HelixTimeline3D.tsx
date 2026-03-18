import { useEffect, useRef, useCallback, useState, useLayoutEffect } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

type TimelineItem = { period: string; title: string; company: string };

// Detect mobile/low-power devices once at module load
const IS_MOBILE = typeof window !== "undefined" &&
  (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);

const HELIX_RADIUS = 44;
const HELIX_PITCH = 180;
const NODE_SPACING = 110;
const CAMERA_DIST = 400;
const ROTATION_PERIOD = 20000;
const REVEAL_DURATION = 1800;
const SAMPLE_STEP = IS_MOBILE ? 12 : 8; // wider step on mobile for fewer draw calls
const NODE_RADIUS = 7;
const TOP_PAD = 100;

const AMBIENT_COUNT = IS_MOBILE ? 8 : 20;
const STREAK_COUNT = IS_MOBILE ? 6 : 16;
const STREAK_LEN = 28;
const STREAK_STEPS = IS_MOBILE ? 4 : 6;
const EDGE_FADE_PX = 40;
const STRAND_EDGE_PX = 50;
const TWO_PI = Math.PI * 2;

// Pre-computed HSLA color cache — avoids string allocation every frame
const _colorCache = new Map<string, string>();
function hsla(h: number, s: number, l: number, a: number): string {
  const key = `${h | 0},${s | 0},${l | 0},${(a * 1000) | 0}`;
  let c = _colorCache.get(key);
  if (!c) {
    c = `hsla(${h | 0},${s}%,${l}%,${a.toFixed(3)})`;
    _colorCache.set(key, c);
  }
  return c;
}

// Scroll-driven zoom/pan constants
const ZOOM_IN_END = 0.18; // longer zoom-in phase
const REVEAL_GAP = 0.28; // first node doesn't appear until here (gap after zoom)
const ZOOM_OUT_START = 0.82;
const SCROLL_MULT = 3;

// Pre-computed helpers: never allocate in render loop
function easeOutCubic(t: number) {
  const u = 1 - t;
  return 1 - u * u * u;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

// Pre-compute ambient particle data (module-level, stable across frames)
const ambientData = Array.from({ length: AMBIENT_COUNT }, () => ({
  xOff: (Math.random() - 0.5) * 2,
  yFrac: Math.random(),
  speed: 0.0003 + Math.random() * 0.0005,
  phase: Math.random() * TWO_PI,
  size: 0.8 + Math.random() * 1.2,
  baseAlpha: 0.08 + Math.random() * 0.15,
}));

// Pre-compute streak speeds and phases (module-level, stable)
const streakMeta = Array.from({ length: STREAK_COUNT }, (_, pi) => ({
  strand: pi % 2,
  speed: 0.04 + ((pi * 7 + 3) % 13) * 0.012,
  phase: (pi * 0.618033988) % 1,
  hue: pi % 2 === 0 ? 185 : 260,
  strandOffset: pi % 2 === 0 ? 0 : Math.PI,
}));

// Inv camera dist — multiply instead of divide in hot loop
const INV_CAMERA = 1 / CAMERA_DIST;

// Reusable color strings
const DARK_FILL = "hsla(220,25%,8%,1)";
const DARK_FILL_REVEALED = "hsla(220,25%,6%,1)";

/** Responsive max scale based on viewport width */
function getResponsiveScale(w: number) {
  if (w < 640) return 1.06;
  if (w < 1024) return 1.12;
  return 1.18;
}

const HelixTimeline3D = ({
  timeline,
  isInView,
}: {
  timeline: TimelineItem[];
  isInView: boolean;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const skipScrollAnimation = IS_MOBILE || !!prefersReducedMotion;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(0);
  const hasStarted = useRef(false);
  const [revealedNodes, setRevealedNodes] = useState<Set<number>>(() => {
    if (IS_MOBILE) {
      // On mobile, reveal all nodes immediately — no scroll-driven animation
      return new Set(Array.from({ length: timeline.length }, (_, i) => i));
    }
    return new Set();
  });
  const revealedRef = useRef<Set<number>>(revealedNodes);
  const [allRevealed, setAllRevealed] = useState(IS_MOBILE);
  const allRevealedRef = useRef(IS_MOBILE);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollTargetRef = useRef(0); // raw scroll position (target)
  const smoothedRef = useRef(0); // damped scroll position
  const lastFrameRef = useRef(0); // for delta-time lerp

  // Viewport tracking for responsive zoom + correct pan distance
  const vpHRef = useRef(typeof window !== "undefined" ? window.innerHeight : 800);
  const vpWRef = useRef(typeof window !== "undefined" ? window.innerWidth : 1280);
  const [maxScale, setMaxScale] = useState(() => getResponsiveScale(vpWRef.current));

  const nodeCount = timeline.length;
  const totalHeight = TOP_PAD + (nodeCount - 1) * NODE_SPACING + TOP_PAD;
  const scrollHeight = totalHeight * SCROLL_MULT;

  const handleReveal = useCallback((i: number) => {
    setRevealedNodes((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      revealedRef.current = next;
      return next;
    });
  }, []);

  // Track viewport size for responsive scale + pan calculations
  useEffect(() => {
    const update = () => {
      vpHRef.current = window.innerHeight;
      vpWRef.current = window.innerWidth;
      if (!allRevealedRef.current) {
        setMaxScale(getResponsiveScale(window.innerWidth));
      }
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Scroll resistance: intercept wheel events when the helix wrapper top is
  // near the viewport top (where sticky zoom begins). LEAD_PX = how many px
  // before the wrapper reaches the viewport top the drag kicks in.
  const LEAD_PX = 200;
  const SCROLL_SPEED = 0.2;
  useEffect(() => {
    if (skipScrollAnimation || allRevealedRef.current) return;
    // Temporarily disable smooth scroll inside drag zone so scrollBy is instant
    const onWheel = (e: WheelEvent) => {
      const wrapper = wrapperRef.current;
      if (!wrapper || allRevealedRef.current) return;
      const rect = wrapper.getBoundingClientRect();
      const inDragZone = rect.top < LEAD_PX && rect.bottom > 0;
      if (!inDragZone) return;
      e.preventDefault();
      // Override smooth scroll so our reduced delta applies instantly
      const prev = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollBy(0, e.deltaY * SCROLL_SPEED);
      document.documentElement.style.scrollBehavior = prev;
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  // Scroll tracking: raw target updated on scroll, smoothed via rAF lerp loop.
  // Damping speed: lower = more drag. ~1 gives ~3s catch-up feel.
  const SCROLL_DAMP_SPEED = 20;
  useEffect(() => {
    if (skipScrollAnimation || allRevealedRef.current) return;
    const onScroll = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const vpH = window.innerHeight;
      const scrollable = wrapper.offsetHeight - vpH;
      if (scrollable > 0) {
        scrollTargetRef.current = clamp01(-rect.top / scrollable);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // rAF loop: lerp smoothedRef toward scrollTargetRef (frame-rate independent)
    let rafId: number;
    const tick = (now: number) => {
      const dt = lastFrameRef.current ? now - lastFrameRef.current : 16;
      lastFrameRef.current = now;
      const target = scrollTargetRef.current;
      const prev = smoothedRef.current;
      // Exponential decay lerp — consistent across 60/120/144 Hz
      const alpha = 1 - Math.exp(-SCROLL_DAMP_SPEED * dt / 1000);
      const next = prev + (target - prev) * alpha;
      // Snap if close enough to avoid infinite tailing
      const final = Math.abs(next - target) < 0.0005 ? target : next;
      if (final !== prev) {
        smoothedRef.current = final;
        setScrollProgress(final);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Reveal nodes based on scroll progress
  // Nodes reveal between REVEAL_GAP and slightly before ZOOM_OUT_START
  // so the last node is visible before zoom-out begins
  const REVEAL_END = ZOOM_OUT_START - 0.05;
  useEffect(() => {
    if (skipScrollAnimation || allRevealedRef.current) return;

    const revealStart = REVEAL_GAP;
    const range = REVEAL_END - revealStart;

    for (let i = 0; i < nodeCount; i++) {
      const threshold = revealStart + (i / Math.max(1, nodeCount - 1)) * range;
      if (scrollProgress >= threshold && !revealedRef.current.has(i)) {
        handleReveal(i);
      }
    }

    // Don't collapse wrapper until zoom-out phase fully completes
    if (revealedRef.current.size >= nodeCount && scrollProgress >= 0.997) {
      allRevealedRef.current = true;
      setAllRevealed(true);
    }
  }, [scrollProgress, nodeCount, handleReveal]);

  // Reduced motion / mobile: reveal everything immediately
  useEffect(() => {
    if (skipScrollAnimation && !allRevealedRef.current) {
      for (let i = 0; i < nodeCount; i++) handleReveal(i);
      allRevealedRef.current = true;
      setAllRevealed(true);
    }
  }, [prefersReducedMotion, nodeCount, handleReveal]);

  // Bottom of the last node's card (approx)
  const lastNodeBottom = TOP_PAD + (nodeCount - 1) * NODE_SPACING - 22 + 90;

  // When allRevealed: collapse wrapper and scroll to match zoom-out end position
  // On tall viewports (vpH >= lastNodeBottom) the zoom-out ends with tY=0,
  // so scroll to wrapperTop. On short viewports, anchor ??? at viewport bottom.
  // Skip on mobile — no scroll-driven animation means no need to reposition.
  useLayoutEffect(() => {
    if (IS_MOBILE || !allRevealed || !wrapperRef.current) return;
    const wrapperTop =
      wrapperRef.current.getBoundingClientRect().top + window.scrollY;
    const vpH = window.innerHeight;
    const finalPan = Math.max(0, lastNodeBottom - vpH);
    window.scrollTo({
      top: wrapperTop + finalPan,
      behavior: "instant",
    });
  }, [allRevealed, lastNodeBottom]);

  // Compute CSS transforms for zoom/pan
  // maxPan uses viewport height so bottom nodes are always reachable
  const vpH = vpHRef.current;
  const maxPan = Math.max(0, lastNodeBottom - vpH / maxScale);
  // Negative initialPan shifts content DOWN during zoom so the "My Timeline"
  // heading has breathing room above the first node (no effect on static layout)
  const initialPan = -60;
  let scale = 1;
  let tY = 0;

  if (!allRevealed) {
    if (scrollProgress <= ZOOM_IN_END) {
      // Phase 1: Zoom in + ease toward initialPan to center first node
      const t = ZOOM_IN_END > 0 ? scrollProgress / ZOOM_IN_END : 0;
      const st = smoothstep(t);
      scale = 1 + st * (maxScale - 1);
      tY = -st * initialPan;
    } else if (scrollProgress <= REVEAL_GAP) {
      // Phase 2: Hold at full zoom, first node centered (the "gap" / cruise)
      scale = maxScale;
      tY = -initialPan;
    } else if (scrollProgress <= ZOOM_OUT_START) {
      // Phase 3: Pan down from initialPan to maxPan + reveal nodes
      scale = maxScale;
      const panT = smoothstep(
        (scrollProgress - REVEAL_GAP) / (ZOOM_OUT_START - REVEAL_GAP)
      );
      tY = -(initialPan + panT * (maxPan - initialPan));
    } else {
      // Phase 4: Zoom-out — stay at bottom (last node), only scale back down
      const t = smoothstep(
        (scrollProgress - ZOOM_OUT_START) / (1 - ZOOM_OUT_START)
      );
      scale = maxScale - t * (maxScale - 1);
      // Keep last node anchored at viewport bottom as scale decreases
      const currentPan = Math.max(0, lastNodeBottom - vpH / scale);
      tY = -currentPan;
    }
  }

  const render = useCallback(
    (elapsed: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 2);
      const w = container.offsetWidth;
      const h = totalHeight;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const rot = prefersReducedMotion
        ? Math.PI / 5
        : ((elapsed % ROTATION_PERIOD) / ROTATION_PERIOD) * TWO_PI;
      const reveal = prefersReducedMotion ? 1 : Math.min(1, elapsed / REVEAL_DURATION);
      const re = easeOutCubic(reveal);
      const topY = TOP_PAD;
      const bottomY = TOP_PAD + (nodeCount - 1) * NODE_SPACING;
      const helixSpan = bottomY - topY;
      const maxY = topY + helixSpan * re;
      const radius = w < 500 ? HELIX_RADIUS * 0.65 : HELIX_RADIUS;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // ======================================================
      // VERTICAL SPINE: feathered at ends
      // ======================================================
      if (maxY > topY) {
        const spineGrad = ctx.createLinearGradient(cx, topY, cx, maxY);
        spineGrad.addColorStop(0, "hsla(0,0%,100%,0)");
        spineGrad.addColorStop(0.06, "hsla(0,0%,100%,0.04)");
        spineGrad.addColorStop(0.94, "hsla(0,0%,100%,0.04)");
        spineGrad.addColorStop(1, "hsla(0,0%,100%,0)");
        ctx.beginPath();
        ctx.moveTo(cx, topY);
        ctx.lineTo(cx, maxY);
        ctx.strokeStyle = spineGrad;
        ctx.lineWidth = 6;
        ctx.stroke();

        const coreGrad = ctx.createLinearGradient(cx, topY, cx, maxY);
        coreGrad.addColorStop(0, "hsla(0,0%,100%,0)");
        coreGrad.addColorStop(0.06, "hsla(0,0%,100%,0.15)");
        coreGrad.addColorStop(0.94, "hsla(0,0%,100%,0.15)");
        coreGrad.addColorStop(1, "hsla(0,0%,100%,0)");
        ctx.beginPath();
        ctx.moveTo(cx, topY);
        ctx.lineTo(cx, maxY);
        ctx.strokeStyle = coreGrad;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Traveling beam
        if (!prefersReducedMotion) {
          const beamT = (elapsed % 4000) / 4000;
          const beamY = topY + (maxY - topY) * beamT;
          const beamTop = Math.max(topY, beamY - 60);

          if (beamY > beamTop) {
            const bGrad = ctx.createLinearGradient(cx, beamTop, cx, beamY);
            bGrad.addColorStop(0, "hsla(185,90%,75%,0)");
            bGrad.addColorStop(0.7, "hsla(185,90%,80%,0.25)");
            bGrad.addColorStop(1, "hsla(185,90%,90%,0.5)");
            ctx.beginPath();
            ctx.moveTo(cx, beamTop);
            ctx.lineTo(cx, beamY);
            ctx.strokeStyle = bGrad;
            ctx.lineWidth = 2;
            ctx.stroke();

            const hR = 8;
            const hGrad = ctx.createRadialGradient(cx, beamY, 0, cx, beamY, hR);
            hGrad.addColorStop(0, "hsla(185,90%,90%,0.4)");
            hGrad.addColorStop(0.5, "hsla(185,90%,75%,0.15)");
            hGrad.addColorStop(1, "hsla(185,90%,70%,0)");
            ctx.beginPath();
            ctx.arc(cx, beamY, hR, 0, TWO_PI);
            ctx.fillStyle = hGrad;
            ctx.fill();
          }
        }
      }

      // ======================================================
      // PASS 0: Ambient particles
      // ======================================================
      const spread = radius * 2.5;
      for (let i = 0; i < AMBIENT_COUNT; i++) {
        const p = ambientData[i];
        const travelY = (p.yFrac * helixSpan + elapsed * p.speed * 30) % helixSpan;
        const py = topY + travelY;
        if (py > maxY) continue;

        const sway = Math.sin(travelY * 0.02 + p.phase) * 10;
        const px = cx + p.xOff * spread + sway;
        const edgeFade = Math.min(1, (py - topY) / 30) * Math.min(1, (maxY - py) / 30);
        const alpha = p.baseAlpha * edgeFade * re;
        if (alpha < 0.005) continue;

        const aR = p.size + 1.5;
        const aGrad = ctx.createRadialGradient(px, py, 0, px, py, aR);
        aGrad.addColorStop(0, hsla(185, 80, 80, alpha));
        aGrad.addColorStop(1, "hsla(185,80%,70%,0)");
        ctx.beginPath();
        ctx.arc(px, py, aR, 0, TWO_PI);
        ctx.fillStyle = aGrad;
        ctx.fill();
      }

      // ======================================================
      // PASS 1: Helix strands: depth interleaved, edge feathered
      // ======================================================
      let prevAx = 0, prevAy = 0, prevBx = 0, prevBy = 0;
      let first = true;

      for (let y = topY; y <= maxY; y += SAMPLE_STEP) {
        const theta = ((y - topY) / HELIX_PITCH) * TWO_PI;
        const yFrac = helixSpan > 0 ? (y - topY) / helixSpan : 0;
        const ef = smoothstep(clamp01((y - topY) / STRAND_EDGE_PX)) * smoothstep(clamp01((maxY - y) / STRAND_EDGE_PX));

        const cosA = Math.cos(theta + rot);
        const sinA = Math.sin(theta + rot);
        const ax3d = radius * cosA;
        const az3d = radius * sinA;
        const aScale = CAMERA_DIST / (CAMERA_DIST + az3d);
        const asx = cx + ax3d * aScale;

        // Strand B = opposite side
        const bz3d = -az3d;
        const bScale = CAMERA_DIST / (CAMERA_DIST + bz3d);
        const bsx = cx - ax3d * bScale;

        const aHue = 185 + yFrac * 15;
        const bHue = 265 - yFrac * 20;

        if (!first) {
          const aFront = az3d > bz3d;

          // Avoid array allocation: use direct variables
          const bkSx = aFront ? bsx : asx;
          const bkPx = aFront ? prevBx : prevAx;
          const bkPy = aFront ? prevBy : prevAy;
          const bkScale = aFront ? bScale : aScale;
          const bkHue = aFront ? bHue : aHue;

          const ba = (0.12 + 0.25 * bkScale) * ef;

          if (ba > 0.005) {
            ctx.beginPath();
            ctx.moveTo(bkPx, bkPy);
            ctx.lineTo(bkSx, y);
            ctx.strokeStyle = hsla(bkHue, 75, 60, ba * 0.3);
            ctx.lineWidth = 10 * bkScale;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(bkPx, bkPy);
            ctx.lineTo(bkSx, y);
            ctx.strokeStyle = hsla(bkHue, 75, 60, ba);
            ctx.lineWidth = 1.8 * bkScale;
            ctx.stroke();
          }

          // Front strand
          const frSx = aFront ? asx : bsx;
          const frPx = aFront ? prevAx : prevBx;
          const frPy = aFront ? prevAy : prevBy;
          const frScale = aFront ? aScale : bScale;
          const frHue = aFront ? aHue : bHue;
          const fa = (0.3 + 0.5 * frScale) * ef;

          if (fa > 0.005) {
            ctx.beginPath();
            ctx.moveTo(frPx, frPy);
            ctx.lineTo(frSx, y);
            ctx.strokeStyle = hsla(frHue, 80, 62, fa * 0.3);
            ctx.lineWidth = 12 * frScale;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(frPx, frPy);
            ctx.lineTo(frSx, y);
            ctx.strokeStyle = hsla(frHue, 80, 65, fa * 0.5);
            ctx.lineWidth = 5 * frScale;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(frPx, frPy);
            ctx.lineTo(frSx, y);
            ctx.strokeStyle = hsla(frHue, 85, 75, fa);
            ctx.lineWidth = 2 * frScale;
            ctx.stroke();
          }
        }

        prevAx = asx; prevAy = y;
        prevBx = bsx; prevBy = y;
        first = false;
      }

      // ======================================================
      // PASS 2: Rungs
      // ======================================================
      ctx.setLineDash([3, 3]);
      for (let i = 0; i < nodeCount; i++) {
        const nodeY = topY + i * NODE_SPACING;
        if (nodeY > maxY) break;

        const theta = ((nodeY - topY) / HELIX_PITCH) * TWO_PI;
        const cosT = Math.cos(theta + rot);
        const sinT = Math.sin(theta + rot);
        const aScale = CAMERA_DIST / (CAMERA_DIST + radius * sinT);
        const asx = cx + radius * cosT * aScale;
        const bScale = CAMERA_DIST / (CAMERA_DIST - radius * sinT);
        const bsx = cx - radius * cosT * bScale;
        const avgScale = (aScale + bScale) / 2;
        const rungAlpha = 0.2 + 0.25 * avgScale;

        // Glow
        ctx.beginPath();
        ctx.moveTo(asx, nodeY);
        ctx.lineTo(bsx, nodeY);
        ctx.setLineDash([]);
        ctx.strokeStyle = hsla(200, 80, 65, rungAlpha * 0.2);
        ctx.lineWidth = 6 * avgScale;
        ctx.stroke();

        // Dashed core
        ctx.beginPath();
        ctx.moveTo(asx, nodeY);
        ctx.lineTo(bsx, nodeY);
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = hsla(200, 80, 70, rungAlpha);
        ctx.lineWidth = avgScale;
        ctx.stroke();

        // Endpoint dots
        ctx.beginPath();
        ctx.arc(asx, nodeY, 1.5 * aScale, 0, TWO_PI);
        ctx.fillStyle = hsla(200, 80, 75, 0.4 + 0.3 * aScale);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bsx, nodeY, 1.5 * bScale, 0, TWO_PI);
        ctx.fillStyle = hsla(200, 80, 75, 0.4 + 0.3 * bScale);
        ctx.fill();
      }
      ctx.setLineDash([]);

      // ======================================================
      // PASS 3: Neon streaks
      // ======================================================
      if (!prefersReducedMotion) {
        for (let pi = 0; pi < STREAK_COUNT; pi++) {
          const m = streakMeta[pi];
          const headOffset = (elapsed * m.speed + m.phase * helixSpan) % helixSpan;

          let prevSx = 0, prevSy = 0;
          for (let si = STREAK_STEPS; si >= 0; si--) {
            const t = si / STREAK_STEPS;
            const offsetY = headOffset - t * STREAK_LEN;
            const rawY = topY + ((offsetY % helixSpan) + helixSpan) % helixSpan;
            if (rawY > maxY) { prevSx = 0; prevSy = 0; continue; }

            const theta = ((rawY - topY) / HELIX_PITCH) * TWO_PI;
            const px3d = radius * Math.cos(theta + rot + m.strandOffset);
            const pz3d = radius * Math.sin(theta + rot + m.strandOffset);
            const pScale = CAMERA_DIST / (CAMERA_DIST + pz3d);
            const sx = cx + px3d * pScale;

            const edgeFade = smoothstep(clamp01((rawY - topY) / EDGE_FADE_PX)) *
                             smoothstep(clamp01((maxY - rawY) / EDGE_FADE_PX));
            const streakFade = (1 - t) * (1 - t);
            const alpha = streakFade * (0.3 + 0.6 * pScale) * edgeFade;

            if (prevSx !== 0 && prevSy !== 0 && alpha > 0.01) {
              ctx.beginPath();
              ctx.moveTo(prevSx, prevSy);
              ctx.lineTo(sx, rawY);
              ctx.strokeStyle = hsla(m.hue, 85, 65, alpha * 0.2);
              ctx.lineWidth = 6 * pScale;
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(prevSx, prevSy);
              ctx.lineTo(sx, rawY);
              ctx.strokeStyle = hsla(m.hue, 90, 80, alpha * 0.7);
              ctx.lineWidth = 1.5 * pScale;
              ctx.stroke();
            }

            prevSx = sx;
            prevSy = rawY;
          }
        }
      }

      // ======================================================
      // PASS 4: Scanning pulse (skipped on mobile)
      // ======================================================
      if (!prefersReducedMotion && !IS_MOBILE) {
        const scanY = topY + ((elapsed * 0.0003 * helixSpan) % helixSpan);
        if (scanY <= maxY) {
          const scanRx = radius + 20;
          const scanRy = 40;
          ctx.save();
          ctx.translate(cx, scanY);
          ctx.scale(scanRx, scanRy);
          const sGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
          sGrad.addColorStop(0, "hsla(185,90%,70%,0.07)");
          sGrad.addColorStop(0.6, "hsla(185,90%,70%,0.03)");
          sGrad.addColorStop(1, "hsla(185,90%,70%,0)");
          ctx.fillStyle = sGrad;
          ctx.beginPath();
          ctx.arc(0, 0, 1, 0, TWO_PI);
          ctx.fill();
          ctx.restore();
        }
      }

      // ======================================================
      // PASS 5: Branch lines: only for revealed nodes
      // ======================================================
      const revealed = revealedRef.current;
      for (let i = 0; i < nodeCount; i++) {
        if (!revealed.has(i)) continue;
        const nodeY = topY + i * NODE_SPACING;
        if (nodeY > maxY) continue;

        const isLeft = i % 2 === 0;
        const edgeX = isLeft ? cx - radius - 20 : cx + radius + 20;
        const targetX = isLeft ? 76 : w - 76;
        const curX = edgeX + (targetX - edgeX) * 1; // fully extended

        // Branch outer glow
        ctx.beginPath();
        ctx.moveTo(edgeX, nodeY);
        ctx.lineTo(curX, nodeY);
        ctx.strokeStyle = "hsla(185,80%,60%,0.08)";
        ctx.lineWidth = 6;
        ctx.stroke();

        // Branch core
        ctx.beginPath();
        ctx.moveTo(edgeX, nodeY);
        ctx.lineTo(curX, nodeY);
        ctx.strokeStyle = "hsla(185,80%,65%,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Traveling data pulse
        if (!prefersReducedMotion) {
          const dotT = ((elapsed + i * 400) % 1500) / 1500;
          const dotX = edgeX + (curX - edgeX) * dotT;
          const dotAlpha = 0.3 + 0.5 * Math.sin(dotT * Math.PI);
          ctx.beginPath();
          ctx.arc(dotX, nodeY, 1.5, 0, TWO_PI);
          ctx.fillStyle = hsla(185, 90, 80, dotAlpha);
          ctx.fill();
        }

        // Diamond endpoint
        ctx.beginPath();
        ctx.moveTo(curX, nodeY - 3);
        ctx.lineTo(curX + 3, nodeY);
        ctx.lineTo(curX, nodeY + 3);
        ctx.lineTo(curX - 3, nodeY);
        ctx.closePath();
        ctx.fillStyle = "hsla(185,80%,65%,0.5)";
        ctx.fill();
      }

      // ======================================================
      // PASS 6: Nodes: NO shadowBlur, manual glow only
      // ======================================================
      for (let i = 0; i < nodeCount; i++) {
        const nodeY = topY + i * NODE_SPACING;
        if (nodeY > maxY) continue;

        const nReveal = clamp01((re - (i / nodeCount) * 0.5) / 0.3);
        if (nReveal <= 0) continue;

        const isRevealed = revealed.has(i);
        const pulse = prefersReducedMotion ? 1 : 0.75 + 0.25 * Math.sin(elapsed * 0.0018 + i * 1.4);
        const r = NODE_RADIUS * nReveal;

        if (!isRevealed) {
          const pulseRing = prefersReducedMotion ? 1 : 0.5 + 0.5 * Math.sin(elapsed * 0.003 + i * 0.8);

          // Pulsing outer ring
          ctx.beginPath();
          ctx.arc(cx, nodeY, r + 10 * pulseRing, 0, TWO_PI);
          ctx.strokeStyle = hsla(200, 100, 70, 0.1 * pulseRing * nReveal);
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Neon ring
          const neonAlpha = 0.35 * nReveal;
          const neonGlowAlpha = neonAlpha * 0.3 * pulseRing;
          ctx.beginPath();
          ctx.arc(cx, nodeY, r + 4, 0, TWO_PI);
          ctx.strokeStyle = hsla(200, 100, 65, neonGlowAlpha);
          ctx.lineWidth = 8;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, nodeY, r + 4, 0, TWO_PI);
          ctx.strokeStyle = hsla(200, 100, 65, neonAlpha);
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Node fill
          ctx.beginPath();
          ctx.arc(cx, nodeY, r, 0, TWO_PI);
          ctx.fillStyle = DARK_FILL;
          ctx.fill();

          // Node border
          ctx.beginPath();
          ctx.arc(cx, nodeY, r, 0, TWO_PI);
          ctx.strokeStyle = hsla(200, 100, 70, 0.7 * nReveal);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          // Revealed: manual glow rings
          const outerAlpha = 0.06 * pulse * nReveal;
          ctx.beginPath();
          ctx.arc(cx, nodeY, r + 6, 0, TWO_PI);
          ctx.strokeStyle = hsla(185, 80, 60, outerAlpha);
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cx, nodeY, r + 3, 0, TWO_PI);
          ctx.strokeStyle = hsla(185, 80, 60, 0.12 * pulse * nReveal);
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Node fill
          ctx.beginPath();
          ctx.arc(cx, nodeY, r, 0, TWO_PI);
          ctx.fillStyle = DARK_FILL_REVEALED;
          ctx.fill();

          // Border glow
          const borderAlpha = 0.8 * pulse * nReveal;
          const glowAlpha = borderAlpha * 0.25;
          ctx.beginPath();
          ctx.arc(cx, nodeY, r, 0, TWO_PI);
          ctx.strokeStyle = hsla(185, 85, 60, glowAlpha);
          ctx.lineWidth = 6;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, nodeY, r, 0, TWO_PI);
          ctx.strokeStyle = hsla(185, 85, 65, borderAlpha);
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Inner dot
          ctx.beginPath();
          ctx.arc(cx, nodeY, r * 0.35, 0, TWO_PI);
          ctx.fillStyle = hsla(185, 90, 80, 0.6 * pulse * nReveal);
          ctx.fill();
        }
      }
    },
    [nodeCount, totalHeight, prefersReducedMotion]
  );

  useEffect(() => {
    if (!isInView) return;

    if (!hasStarted.current) {
      hasStarted.current = true;
      startTimeRef.current = performance.now();
    }

    if (prefersReducedMotion) {
      render(performance.now() - startTimeRef.current);
      return;
    }

    let id: number;
    const animate = (now: number) => {
      render(now - startTimeRef.current);
      id = requestAnimationFrame(animate);
    };
    id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [isInView, prefersReducedMotion, render]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      if (hasStarted.current && prefersReducedMotion) render(0);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [prefersReducedMotion, render]);

  return (
    <div
      ref={wrapperRef}
      style={{ height: allRevealed ? lastNodeBottom : scrollHeight }}
    >
      {/* Sticky viewport: clips the zoomed helix during animation, normal after */}
      <div
        style={{
          position: allRevealed ? "relative" : "sticky",
          top: 0,
          height: allRevealed ? lastNodeBottom : "100vh",
          overflowX: "visible",
          overflowY: allRevealed ? "visible" : "clip",
          isolation: "isolate",
        }}
      >
        {/* Transformable inner container */}
        <div
          ref={containerRef}
          className="relative w-full"
          style={{
            minHeight: totalHeight,
            transform: allRevealed
              ? "none"
              : `scale(${scale}) translateY(${tY}px)`,
            transformOrigin: "top center",
          }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            style={{ width: "100%", height: totalHeight }}
          />

          <AnimatePresence>
            {timeline.map((item, i) => {
              if (!revealedNodes.has(i)) return null;
              const isLeft = i % 2 === 0;
              const top = TOP_PAD + i * NODE_SPACING - 22;
              // Responsive card width: tighter gap on mobile
              const cardWidth = vpWRef.current < 640
                ? "calc(50% - 50px)"
                : "calc(50% - 90px)";

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isLeft ? -30 : 30, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: isLeft ? -20 : 20, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute z-10"
                  style={{
                    top,
                    ...(isLeft
                      ? { left: 8, width: cardWidth }
                      : { right: 8, width: cardWidth }),
                  }}
                >
                  <div
                    className={`card-glass rounded-xl px-5 py-3 border-border/50 ${
                      isLeft ? "text-right" : "text-left"
                    }`}
                  >
                    <span className="text-xs font-mono-tech text-primary tracking-wider block mb-1">
                      {item.period}
                    </span>
                    <span className="text-sm font-semibold block">
                      {item.title}
                    </span>
                    <span className="text-muted-foreground text-xs block">
                      {item.company}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default HelixTimeline3D;
