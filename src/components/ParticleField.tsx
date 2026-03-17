import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 300; // down from 500
const CONNECTION_DIST = 120; // tighter radius = fewer connection checks
const CELL_SIZE = CONNECTION_DIST;
const TWO_PI = Math.PI * 2;

// Pre-compute static color strings to avoid per-frame allocations
const PARTICLE_COLORS: string[] = [];
for (let i = 0; i < 64; i++) {
  PARTICLE_COLORS.push(`hsla(185,80%,55%,${(i / 63 * 0.5 + 0.1).toFixed(3)})`);
}
const CONNECTION_COLORS: string[] = [];
for (let i = 0; i < 32; i++) {
  CONNECTION_COLORS.push(`hsla(185,80%,55%,${(0.25 * (i / 31)).toFixed(3)})`);
}

const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let initialized = false;
    let lastTime = 0;

    // Typed arrays for particle data
    const px = new Float32Array(PARTICLE_COUNT);
    const py = new Float32Array(PARTICLE_COUNT);
    const vx = new Float32Array(PARTICLE_COUNT);
    const vy = new Float32Array(PARTICLE_COUNT);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const colorIndices = new Uint8Array(PARTICLE_COUNT);

    const initParticles = (w: number, h: number) => {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        px[i] = Math.random() * w;
        py[i] = Math.random() * h;
        vx[i] = (Math.random() - 0.5) * 0.3;
        vy[i] = (Math.random() - 0.5) * 0.3;
        sizes[i] = Math.random() * 2 + 0.5;
        colorIndices[i] = (Math.random() * 63) | 0;
      }
      initialized = true;
    };

    // Spatial hash
    let gridCols = 0;
    let gridRows = 0;
    let cellStarts: Int32Array = new Int32Array(0);
    let cellCounts: Int32Array = new Int32Array(0);
    let sortedIndices: Int32Array = new Int32Array(PARTICLE_COUNT);

    const allocGrid = () => {
      gridCols = Math.ceil(canvas.width / CELL_SIZE) + 1;
      gridRows = Math.ceil(canvas.height / CELL_SIZE) + 1;
      const totalCells = gridCols * gridRows;
      cellStarts = new Int32Array(totalCells);
      cellCounts = new Int32Array(totalCells);
    };

    let resizeTimeout: number | undefined;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR at 2
      const w = window.innerWidth;
      const h = window.innerHeight;
      const oldW = canvas.width / (canvas.dataset.dpr ? +canvas.dataset.dpr : 1);
      const oldH = canvas.height / (canvas.dataset.dpr ? +canvas.dataset.dpr : 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.dataset.dpr = String(dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!initialized) {
        initParticles(w, h);
      } else if (oldW > 0 && oldH > 0) {
        const sx = w / oldW;
        const sy = h / oldH;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          px[i] *= sx;
          py[i] *= sy;
        }
      }
      allocGrid();
    };
    resize();
    const throttledResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resize, 150);
    };
    window.addEventListener("resize", throttledResize);

    const dist2Max = CONNECTION_DIST * CONNECTION_DIST;

    const draw = (now: number) => {
      // Delta-time based movement for consistent speed across refresh rates
      const dt = lastTime ? Math.min(now - lastTime, 33.33) : 16.67; // cap at ~30fps delta
      const dtFactor = dt / 16.67; // normalize to 60fps baseline
      lastTime = now;

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Update positions with delta-time
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        px[i] += vx[i] * dtFactor;
        py[i] += vy[i] * dtFactor;
        if (px[i] < 0) px[i] = w;
        else if (px[i] > w) px[i] = 0;
        if (py[i] < 0) py[i] = h;
        else if (py[i] > h) py[i] = 0;
      }

      // Build spatial hash
      cellCounts.fill(0);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const col = Math.min((px[i] / CELL_SIZE) | 0, gridCols - 1);
        const row = Math.min((py[i] / CELL_SIZE) | 0, gridRows - 1);
        cellCounts[row * gridCols + col]++;
      }
      let sum = 0;
      const totalCells = gridCols * gridRows;
      for (let c = 0; c < totalCells; c++) {
        cellStarts[c] = sum;
        sum += cellCounts[c];
        cellCounts[c] = 0;
      }
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const col = Math.min((px[i] / CELL_SIZE) | 0, gridCols - 1);
        const row = Math.min((py[i] / CELL_SIZE) | 0, gridRows - 1);
        const cell = row * gridCols + col;
        sortedIndices[cellStarts[cell] + cellCounts[cell]] = i;
        cellCounts[cell]++;
      }

      // Batch draw particles — group by color to reduce state changes
      for (let ci = 0; ci < 64; ci++) {
        ctx.fillStyle = PARTICLE_COLORS[ci];
        ctx.beginPath();
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          if (colorIndices[i] !== ci) continue;
          ctx.moveTo(px[i] + sizes[i], py[i]);
          ctx.arc(px[i], py[i], sizes[i], 0, TWO_PI);
        }
        ctx.fill();
      }

      // Draw connections — batch lines by color bucket
      ctx.lineWidth = 0.5;
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const cell = row * gridCols + col;
          const start = cellStarts[cell];
          const count = cellCounts[cell];
          if (count === 0) continue;

          for (let dr = 0; dr <= 1; dr++) {
            const nRow = row + dr;
            if (nRow >= gridRows) continue;
            const dcStart = dr === 0 ? col : col - 1;
            const dcEnd = col + 1;

            for (let nc = dcStart; nc <= dcEnd; nc++) {
              if (nc < 0 || nc >= gridCols) continue;
              const nCell = nRow * gridCols + nc;
              const nStart = cellStarts[nCell];
              const nCount = cellCounts[nCell];
              if (nCount === 0) continue;

              const isSameCell = dr === 0 && nc === col;

              for (let a = 0; a < count; a++) {
                const idxA = sortedIndices[start + a];
                const ax = px[idxA], ay = py[idxA];
                const bIdx = isSameCell ? a + 1 : 0;

                for (let b = bIdx; b < nCount; b++) {
                  const idxB = sortedIndices[nStart + b];
                  const ddx = ax - px[idxB];
                  const ddy = ay - py[idxB];
                  const d2 = ddx * ddx + ddy * ddy;
                  if (d2 < dist2Max) {
                    const ci = ((1 - Math.sqrt(d2) / CONNECTION_DIST) * 31) | 0;
                    ctx.strokeStyle = CONNECTION_COLORS[ci];
                    ctx.beginPath();
                    ctx.moveTo(ax, ay);
                    ctx.lineTo(px[idxB], py[idxB]);
                    ctx.stroke();
                  }
                }
              }
            }
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", throttledResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

export default ParticleField;
