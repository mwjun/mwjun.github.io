import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { skillGroups } from "@/data/skills";

const nodes = skillGroups.flatMap((group, groupIndex) => group.skills.map((skill, index) => ({ skill, category: group.category, groupIndex, index })));
const colors = ["#b9e9e6", "#c0b8ef", "#a5c9ef", "#e4c4aa", "#9cd9bc", "#d5b6d6"];

export default function SkillConstellation({ matches, filtering }: { matches: string[]; filtering: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const turn = useTransform(scrollYProgress, [0, 1], [-18, 18]);
  const rotate = useSpring(turn, { stiffness: 90, damping: 30 });
  return <div className="skill-constellation" ref={ref} aria-hidden="true">
    <div className="constellation-aura" />
    <motion.svg viewBox="0 0 600 500" fill="none" style={{ rotate: reduced ? 0 : rotate }}>
      {[0, 1, 2, 3, 4, 5].map(i => <ellipse key={i} cx="300" cy="250" rx="224" ry={75 + i * 8} transform={`rotate(${i * 30} 300 250)`} stroke={colors[i]} strokeOpacity=".15" />)}
      {nodes.map((node, index) => {
        const theta = index * 2.39996;
        const radius = 42 + Math.sqrt(index / nodes.length) * 186;
        const selected = matches.includes(node.skill);
        // Keep each discovery near its own place in the atom as the results change.
        const focusedRadius = 85 + Math.sqrt(index / nodes.length) * 75;
        const displayRadius = filtering && selected ? focusedRadius : radius;
        const x = 300 + Math.cos(theta) * displayRadius;
        const y = 250 + Math.sin(theta) * displayRadius * .85;
        return <motion.g key={`${node.category}-${node.skill}`} initial={false} animate={{ x, y, opacity: filtering && !selected ? .12 : 1 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 135, damping: 24 }}>
          <circle r={selected && filtering ? 13 : 8} fill={colors[node.groupIndex]} fillOpacity=".08" />
          <circle r={selected && filtering ? 4 : 2.3} fill={colors[node.groupIndex]} />
        </motion.g>;
      })}
      <circle cx="300" cy="250" r="30" stroke="#b9e9e6" strokeOpacity=".5" />
    </motion.svg>
  </div>;
}
