import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { HELIX_MORPH, SPHERE_MORPH } from "@/lib/sculptureShapes";
import ScrollSculpture from "./ScrollSculpture";
import StoryParticles from "./StoryParticles";

const chapters = ["The introduction", "The approach", "The impact"];
const INTRO_MORPH_SECONDS = 3.9;
const INTRO_COPY_DELAY_MS = 3500;
const smoothRange = (value: number, start: number, end: number) => {
  const progress = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return progress * progress * (3 - 2 * progress);
};
const getStoryCopyTravel = () => typeof window === "undefined" ? 96 : Math.min(160, Math.max(72, window.innerWidth * 0.09));

// Set once the intro plays through (or is scrolled past), so returning to Story skips it until the next page load.
let introFinished = false;

const shouldSkipInitialIntro = () => typeof window !== "undefined" &&
  (introFinished || (window.location.hash !== "" && window.location.hash !== "#story") || window.scrollY > 4);

const HeroSection = () => {
  const container = useRef<HTMLElement>(null);
  const introCopy = useRef<HTMLDivElement>(null);
  const introChapter = useRef<HTMLDivElement>(null);
  const introVisual = useRef<HTMLDivElement>(null);
  const introParticles = useRef<HTMLDivElement>(null);
  const approachCopy = useRef<HTMLDivElement>(null);
  const impactCopy = useRef<HTMLDivElement>(null);
  const primaryVignette = useRef<HTMLDivElement>(null);
  const alternateVignette = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [introSkipped, setIntroSkipped] = useState(shouldSkipInitialIntro);
  const [introReady, setIntroReady] = useState(shouldSkipInitialIntro);
  const [introComplete, setIntroComplete] = useState(shouldSkipInitialIntro);
  const introMorphProgress = useMotionValue(introSkipped ? 1 : 0);
  const introMorphAnimation = useRef<{ stop: () => void } | null>(null);
  const introReadyTimer = useRef<number | undefined>(undefined);
  const introCompleteTimer = useRef<number | undefined>(undefined);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start start", "end end"] });

  const stopIntroTiming = () => {
    introMorphAnimation.current?.stop();
    if (introReadyTimer.current !== undefined) window.clearTimeout(introReadyTimer.current);
    if (introCompleteTimer.current !== undefined) window.clearTimeout(introCompleteTimer.current);
    introReadyTimer.current = undefined;
    introCompleteTimer.current = undefined;
  };

  const updateStoryChoreography = useCallback((value: number) => {
    const motionDisabled = !!reducedMotion;
    const copyTravel = getStoryCopyTravel();
    const introVisibility = motionDisabled ? 1 : 1 - smoothRange(value, 0.03, 0.11);
    const approachReveal = motionDisabled ? 1 : smoothRange(value, 0.24, 0.3);
    const approachExit = motionDisabled ? 1 : 1 - smoothRange(value, 0.52, 0.58);
    const impactReveal = motionDisabled ? 1 : smoothRange(value, 0.66, 0.76);
    const impactExit = motionDisabled ? 1 : 1 - smoothRange(value, 0.96, 1);
    if (introChapter.current) {
      introChapter.current.style.opacity = String(introVisibility);
    }
    if (approachCopy.current) {
      const approachVisibility = approachReveal * approachExit;
      approachCopy.current.style.opacity = String(approachVisibility);
      approachCopy.current.style.transform = motionDisabled ? "none" : `translate3d(${(approachReveal - 1) * copyTravel}px, 0, 0)`;
      approachCopy.current.style.pointerEvents = approachVisibility > 0.05 ? "auto" : "none";
    }
    if (impactCopy.current) {
      const impactVisibility = impactReveal * impactExit;
      impactCopy.current.style.opacity = String(impactVisibility);
      impactCopy.current.style.transform = motionDisabled ? "none" : `translate3d(${(1 - impactReveal) * copyTravel}px, 0, 0)`;
      impactCopy.current.style.pointerEvents = impactVisibility > 0.05 ? "auto" : "none";
    }

    const approachScene = smoothRange(value, HELIX_MORPH.start, HELIX_MORPH.end) * (1 - smoothRange(value, SPHERE_MORPH.start, SPHERE_MORPH.end));
    if (primaryVignette.current) primaryVignette.current.style.opacity = String(1 - approachScene);
    if (alternateVignette.current) alternateVignette.current.style.opacity = String(approachScene);
  }, [reducedMotion]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setChapter(value < 0.24 ? 0 : value < 0.66 ? 1 : 2);
    updateStoryChoreography(value);
  });

  useEffect(() => {
    updateStoryChoreography(scrollYProgress.get());
  }, [scrollYProgress, updateStoryChoreography]);

  useEffect(() => {
    if (reducedMotion || introSkipped) {
      introMorphProgress.set(1);
      setIntroReady(true);
      setIntroComplete(true);
      return;
    }
    stopIntroTiming();
    introMorphAnimation.current = animate(introMorphProgress, 1, { duration: INTRO_MORPH_SECONDS, ease: "linear" });
    introReadyTimer.current = window.setTimeout(() => setIntroReady(true), INTRO_COPY_DELAY_MS);
    introCompleteTimer.current = window.setTimeout(() => {
      introFinished = true;
      setIntroComplete(true);
    }, INTRO_MORPH_SECONDS * 1000);
    return () => {
      stopIntroTiming();
    };
  }, [introSkipped, reducedMotion, introMorphProgress]);

  useEffect(() => {
    if (introComplete || introSkipped || reducedMotion) return;
    const finishIntro = () => {
      introFinished = true;
      stopIntroTiming();
      introMorphProgress.set(1);
      [introVisual.current, introParticles.current].forEach((element) => {
        element?.getAnimations().forEach((animation) => animation.finish());
      });
      setIntroSkipped(true);
      setIntroReady(true);
      setIntroComplete(true);
    };
    window.addEventListener("scroll", finishIntro, { passive: true, once: true });
    return () => window.removeEventListener("scroll", finishIntro);
  }, [introComplete, introSkipped, reducedMotion, introMorphProgress]);

  useEffect(() => {
    if (introCopy.current) introCopy.current.inert = !introReady;
  }, [introReady]);

  return (
    <section ref={container} id="story" className={`cinematic-story${introSkipped ? " is-intro-skipped" : ""}`} aria-label="My story">
      <div className="story-stage" aria-hidden="true">
        <div className="story-ambient intro-ambient" />
        <div ref={introVisual} className="intro-visual-sequence">
          <ScrollSculpture progress={scrollYProgress} introProgress={introMorphProgress} paused={paused || !!reducedMotion} />
        </div>
        <div ref={introParticles} className="intro-particle-sequence">
          <StoryParticles paused={paused || !!reducedMotion} />
        </div>
        <div className="scene-coordinate scene-coordinate-top">{['POSSIBILITY', 'CONNECTION', 'IMPACT'][chapter]}</div>
        <div className="scene-coordinate scene-coordinate-bottom">IDEAS → SYSTEMS → EXPERIENCES</div>
        <div className="scene-vignette scene-vignette-base" />
        <div ref={primaryVignette} className="scene-vignette scene-vignette-left" style={{ opacity: 1 }} />
        <div ref={alternateVignette} className="scene-vignette scene-vignette-right" style={{ opacity: 0 }} />
      </div>
      <div ref={introChapter} className="story-chapter chapter-intro">
        <div ref={introCopy} className="chapter-copy intro-copy" aria-hidden={!introReady}>
          <p className="eyebrow hero-eyebrow"><span className="eyebrow-roles">FULLSTACK SOFTWARE DEVELOPER · AI ENGINEER · CLOUD ENGINEER · DATA PROFESSIONAL</span></p>
          <h1>Complexity<br />into <span className={`serif-accent serif-shine${paused ? ' is-paused' : ''}`}>possibility.</span></h1>
          <p className="hero-description">Full-stack engineering, amplified through applied AI.<br className="desktop-break" /> Grounded in data science, with range across business channels.</p>
        </div>
        <div className="intro-bottom intro-bottom-entrance"><a href="#approach" className="scroll-prompt"><span className="scroll-track"><span /></span> SCROLL TO UNFOLD THE STORY</a></div>
      </div>
      <div id="approach" className="story-chapter">
        <div ref={approachCopy} className="chapter-copy chapter-copy-right scroll-reveal-copy" style={reducedMotion ? undefined : { opacity: 0, transform: `translate3d(${-getStoryCopyTravel()}px, 0, 0)`, pointerEvents: "none" }}>
          <p className="eyebrow">THE APPROACH</p>
          <h2>Work backwards.<br /><span className="serif-accent">Start with the user.</span></h2>
          <p className="chapter-description">Before I plan a database or an API, I figure out what using the product should feel like.</p>
          <p className="chapter-description secondary-description">Then I build the system around that experience, so people never have to work around the system.</p>
        </div>
      </div>
      <div id="impact" className="story-chapter">
        <div ref={impactCopy} className="chapter-copy scroll-reveal-copy" style={reducedMotion ? undefined : { opacity: 0, transform: `translate3d(${getStoryCopyTravel()}px, 0, 0)`, pointerEvents: "none" }}>
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
