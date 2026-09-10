import { useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Pause, Play } from "lucide-react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { Link } from "react-router-dom";
import ScrollSculpture from "./ScrollSculpture";

const chapters = ["The introduction", "The approach", "The impact"];

const HeroSection = () => {
  const container = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [chapter, setChapter] = useState(0);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (value) => setChapter(value < 0.29 ? 0 : value < 0.7 ? 1 : 2));

  return (
    <section ref={container} id="story" className="cinematic-story" aria-label="My story">
      <div className="story-stage" aria-hidden="true">
        <div className="story-ambient" />
        <ScrollSculpture progress={scrollYProgress} paused={paused || !!reducedMotion} />
        <div className="scene-coordinate scene-coordinate-top">{['POSSIBILITY', 'CONNECTION', 'IMPACT'][chapter]}</div>
        <div className="scene-coordinate scene-coordinate-bottom">IDEAS → SYSTEMS → EXPERIENCES</div>
        <div className="scene-vignette" />
      </div>
      <div className="story-chapter chapter-intro">
        <div className="chapter-copy">
          <p className="eyebrow hero-eyebrow"><span className="eyebrow-kicker"><span className="eyebrow-line" /> MATTHEW JUN</span><span className="eyebrow-roles">FULLSTACK SOFTWARE DEVELOPER · AI ENGINEER · CLOUD ENGINEER · DATA PROFESSIONAL</span></p>
          <h1>Complexity<br />into <span className={`serif-accent serif-shine${paused ? ' is-paused' : ''}`}>possibility.</span></h1>
          <p className="hero-description">Full-stack engineering, amplified through applied AI.<br className="desktop-break" /> Grounded in data science, with range across business channels.</p>
          <div className="hero-actions">
            <a href="#work" className="primary-link">Explore my work <ArrowDown size={17} /></a>
            <a href="/Matthew_Jun.pdf" download className="quiet-link">Résumé <ArrowUpRight size={16} /></a>
          </div>
        </div>
        <div className="intro-bottom"><a href="#approach" className="scroll-prompt"><span className="scroll-track"><span /></span> SCROLL TO UNFOLD THE STORY</a><span>BASED IN ORANGE COUNTY, CA</span></div>
      </div>
      <div id="approach" className="story-chapter">
        <div className="chapter-copy">
          <p className="eyebrow">THE APPROACH</p>
          <h2>People first.<br /><span className="serif-accent">Systems second.</span></h2>
          <p className="chapter-description">My path to software wasn't a straight line. It ran through creative work, e-commerce, education, and understanding how people think.</p>
          <p className="chapter-description secondary-description">Today, I connect those perspectives to build interfaces, services, and AI workflows that make complex things feel simple.</p>
          <Link to="/about" className="text-link">The story behind the code <ArrowUpRight size={18} /></Link>
        </div>
      </div>
      <div id="impact" className="story-chapter">
        <div className="chapter-copy">
          <p className="eyebrow">THE IMPACT</p>
          <h2>Built with intent.<br /><span className="serif-accent">Measured in impact.</span></h2>
          <p className="chapter-description">From using data to grow e-commerce revenue to building software at Konami and Boeing, I care about what happens after the code ships.</p>
          <div className="impact-proof"><div><strong>10+</strong><span>years across industries</span></div><div><strong>7-figure</strong><span>monthly e-commerce revenue</span></div></div>
          <p className="proof-caption">Data insights helped grow monthly e-commerce revenue from $175K to seven figures.</p>
        </div>
      </div>
      <div className="story-controls">
        <div className="chapter-progress" aria-label={chapters[chapter]}><div>{chapters.map((name, i) => <a key={name} href={['#story', '#approach', '#impact'][i]} aria-label={name} aria-current={i === chapter ? 'step' : undefined} className={i === chapter ? 'is-active' : ''} />)}</div></div>
        {!reducedMotion && <button type="button" onClick={() => setPaused(!paused)} className="motion-toggle" aria-pressed={paused} aria-label={paused ? "Enable scene motion" : "Pause scene motion"}>{paused ? <Play size={14} /> : <Pause size={14} />}<span>{paused ? 'Motion paused' : 'Pause motion'}</span></button>}
      </div>
    </section>
  );
};
export default HeroSection;
