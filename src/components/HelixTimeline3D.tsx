import { useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Pause, Play } from "lucide-react";
import JourneyHelix from "./JourneyHelix";
import JourneyParticles from "./JourneyParticles";

export type TimelineItem = { period?: string; title: string; company: string; chapter: string };

function Milestone({ item, index, active, registerCard }: { item: TimelineItem; index: number; active: boolean; registerCard: (element: HTMLElement | null) => void }) {
  return (
    <li id={`milestone-${index}`} className={`journey-item${active ? " milestone-active" : ""}`}>
      <article ref={registerCard} className="milestone-card" aria-labelledby={`milestone-title-${index}`}>
        <p className="milestone-chapter">{item.chapter}</p>
        {item.period && <p className="milestone-period">{item.period.replace(/ - /g, " to ")}</p>}
        <h3 id={`milestone-title-${index}`}>{item.company}</h3>
        <p className="milestone-role">{item.title}</p>
      </article>
    </li>
  );
}

export default function HelixTimeline3D({ timeline }: { timeline: TimelineItem[] }) {
  const container = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start start", "end end"] });
  const position = useTransform(scrollYProgress, value => value * Math.max(0, timeline.length - 1));
  useMotionValueEvent(position, "change", value => setActive(Math.round(value)));
  if (!timeline.length) return null;

  return (
    <div ref={container} id="journey" className="career-journey">
      <div className="journey-scene" aria-hidden="true">
        {!reducedMotion && <JourneyHelix position={position} count={timeline.length} paused={paused} cards={cards} />}
        {!reducedMotion && <JourneyParticles paused={paused} />}
        <div className="journey-shade" />
      </div>
      <ol className="journey-milestones" aria-label="Career and education timeline">
        {timeline.map((item, i) => <Milestone key={`${item.company}-${item.period ?? item.chapter}`} item={item} index={i} active={active === i} registerCard={element => { cards.current[i] = element; }} />)}
      </ol>
      <div className="journey-controls">
        {!reducedMotion && <button type="button" className="motion-toggle" aria-pressed={paused} aria-label={paused ? "Enable journey motion" : "Pause journey motion"} onClick={() => setPaused(!paused)}>{paused ? <Play size={14} /> : <Pause size={14} />}<span>{paused ? "Motion paused" : "Pause motion"}</span></button>}
      </div>
    </div>
  );
}
