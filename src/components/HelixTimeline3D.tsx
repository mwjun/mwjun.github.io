import { useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import JourneyHelix from "./JourneyHelix";

export type TimelineItem = { period: string; title: string; company: string; chapter: string; future?: boolean };

function Milestone({ item, index, active, registerCard }: { item: TimelineItem; index: number; active: boolean; registerCard: (element: HTMLElement | null) => void }) {
  return (
    <li id={`milestone-${index}`} className={`journey-item${active ? " milestone-active" : ""}`}>
      <article ref={registerCard} className="milestone-card" aria-labelledby={`milestone-title-${index}`}>
        <p className="milestone-chapter">{item.chapter}</p>
        <p className="milestone-period">{item.period.replace(/ - /g, " — ")}</p>
        <h3 id={`milestone-title-${index}`}>{item.company}</h3>
        <p className="milestone-role">{item.title}</p>
        {item.future && <Link to="/contact" className="text-link">Let's talk about it <ArrowUpRight size={18} /></Link>}
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
        <div className="journey-shade" />
        <div className="journey-scene-label"><span>THE JOURNEY</span><p>Always learning.<br /><em>Always becoming.</em></p></div>
      </div>
      <ol className="journey-milestones" aria-label="Career and education timeline">
        {timeline.map((item, i) => <Milestone key={`${item.company}-${item.period}`} item={item} index={i} active={active === i} registerCard={element => { cards.current[i] = element; }} />)}
      </ol>
      <div className="journey-controls">
        <a href={`#milestone-${timeline.length - 1}`} className="journey-skip">Skip to the next chapter <ArrowDown size={14} /></a>
        {!reducedMotion && <button type="button" className="motion-toggle" aria-pressed={paused} aria-label={paused ? "Enable helix motion" : "Pause helix motion"} onClick={() => setPaused(!paused)}>{paused ? <Play size={14} /> : <Pause size={14} />}<span>{paused ? "Motion paused" : "Pause motion"}</span></button>}
      </div>
    </div>
  );
}
