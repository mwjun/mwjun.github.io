import type { CSSProperties } from "react";

type AmbientParticle = {
  x: number;
  y: number;
  midX: number;
  midY: number;
  driftX: number;
  driftY: number;
  size: number;
  duration: number;
  delay: number;
  alpha: number;
  softAlpha: number;
  violet: boolean;
};

type ParticleStyle = CSSProperties & {
  "--particle-x": string;
  "--particle-y": string;
  "--particle-mid-x": string;
  "--particle-mid-y": string;
  "--particle-drift-x": string;
  "--particle-drift-y": string;
  "--particle-size": string;
  "--particle-duration": string;
  "--particle-delay": string;
  "--particle-alpha": string;
  "--particle-soft-alpha": string;
};

const seededRandom = () => {
  let seed = 0x71e11a;
  return () => {
    seed = Math.imul(seed ^ (seed >>> 15), seed | 1);
    seed ^= seed + Math.imul(seed ^ (seed >>> 7), seed | 61);
    return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
  };
};

const createParticles = (): AmbientParticle[] => {
  const random = seededRandom();
  return Array.from({ length: 24 }, (_, index) => {
    const direction = random() > 0.5 ? 1 : -1;
    const driftX = direction * (40 + random() * 110);
    const driftY = -(130 + random() * 220);
    const alpha = 0.48 + random() * 0.36;
    return {
      x: 4 + random() * 92,
      y: 12 + random() * 80,
      midX: driftX * 0.5 + direction * (12 + random() * 24),
      midY: driftY * 0.52,
      driftX,
      driftY,
      size: 2 + random() * 2.2,
      duration: 9 + random() * 9,
      delay: -random() * 18,
      alpha,
      softAlpha: alpha * 0.68,
      violet: index % 3 === 1,
    };
  });
};

const PARTICLES = createParticles();

/** Ambient particles use CSS transforms so they never share the helix scroll loop. */
export default function JourneyParticles({ paused }: { paused: boolean }) {
  return (
    <div className={`journey-particles${paused ? " is-paused" : ""}`} aria-hidden="true">
      {PARTICLES.map((particle, index) => {
        const style: ParticleStyle = {
          "--particle-x": `${particle.x}%`,
          "--particle-y": `${particle.y}%`,
          "--particle-mid-x": `${particle.midX}px`,
          "--particle-mid-y": `${particle.midY}px`,
          "--particle-drift-x": `${particle.driftX}px`,
          "--particle-drift-y": `${particle.driftY}px`,
          "--particle-size": `${particle.size}px`,
          "--particle-duration": `${particle.duration}s`,
          "--particle-delay": `${particle.delay}s`,
          "--particle-alpha": `${particle.alpha}`,
          "--particle-soft-alpha": `${particle.softAlpha}`,
        };
        return <span key={index} className={`journey-particle${particle.violet ? " is-violet" : ""}`} style={style} />;
      })}
    </div>
  );
}
