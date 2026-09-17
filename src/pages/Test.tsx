import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowDown, Github, Linkedin, Mail } from "lucide-react";
import ScrambleText from "@/components/ScrambleText";
import SiteFooter from "@/components/SiteFooter";
import { timeline } from "@/data/timeline";
import { createLabEngine, type LabCard } from "@/lab/engine";
import { INTRO, LAST_SCENE, NAV_ANCHORS, ORDERED_PROJECTS, PROJECT_CATEGORIES, categoryStop, closingLine, closingReveal, closingStep, copyBurn, copyVisibility, stopScene } from "@/lab/timeline";
import "@/styles/lab.css";

// Every project from the Work page, grouped by category in the order the network shows them.
const cards: LabCard[] = ORDERED_PROJECTS.map(project => ({ title: project.title, category: project.category, tags: project.tags, link: project.link }));

type Status = "loading" | "ready" | "fallback";

// A zero-size marker the navigation links scroll to, placed so that landing on it puts the scene at that point.
const NavAnchor = ({ id }: { id: keyof typeof NAV_ANCHORS }) => <span id={id} className="lab-anchor" style={{ top: `${NAV_ANCHORS[id].at * 100}%` }} />;

export default function Test() {
  const still = !!useReducedMotion();
  const page = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scenes = useRef<(HTMLElement | null)[]>([]);
  const hudDepth = useRef<HTMLSpanElement>(null);
  const hudProgress = useRef<HTMLElement>(null);
  const jumpToScene = useRef<(s: number) => void>(() => undefined);
  const [status, setStatus] = useState<Status>("loading");
  const [active, setActive] = useState(0);
  // How far through the closing sequence the scroll has reached, so each line decodes as it arrives.
  const [closing, setClosing] = useState(0);
  const [hovered, setHovered] = useState<LabCard | null>(null);

  useEffect(() => {
    const sections = scenes.current.filter((element): element is HTMLElement => !!element);
    let tops: number[] = [];
    let spans: number[] = [];
    const measure = () => {
      tops = sections.map(element => element.getBoundingClientRect().top + window.scrollY);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      // The last section runs to the bottom of the page so the final scene always completes.
      spans = sections.map((_, i) => Math.max(1, i < LAST_SCENE ? tops[i + 1] - tops[i] : maxScroll - tops[i]));
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (page.current) observer?.observe(page.current);

    const sceneCoordinate = () => {
      const y = window.scrollY;
      for (let i = LAST_SCENE; i > 0; i--) if (y >= tops[i]) return i + Math.min(1, (y - tops[i]) / spans[i]);
      return Math.min(1, Math.max(0, y / (spans[0] || 1)));
    };
    // The inverse of sceneCoordinate: scroll so the scene sits at s.
    jumpToScene.current = s => {
      const i = Math.min(LAST_SCENE, Math.max(0, Math.floor(s)));
      window.scrollTo({ top: tops[i] + (s - i) * spans[i], behavior: still ? "auto" : "smooth" });
    };

    // Arriving with a hash (from another page, or after the page chunk loaded) lands on its anchor once it exists.
    const arrival = window.location.hash ? requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "instant" })) : 0;

    let shown = -1;
    let shownClosing = -1;
    const engine = canvas.current && createLabEngine({
      canvas: canvas.current,
      reducedMotion: still,
      cards,
      milestones: timeline,
      sceneCoordinate,
      onReady: () => setStatus("ready"),
      onHoverCard: setHovered,
      // Private repositories have nothing to open. Everything else opens in a new tab, so coming back doesn't mean
      // scrolling the whole story again.
      onOpenCard: card => {
        if (card.link) window.open(card.link, "_blank", "noopener,noreferrer");
      },
      onFrame: ({ s, cameraY, introTime }) => {
        // The scroll cue waits until the opening word has finished spelling POSSIBILITY.
        page.current?.classList.toggle("is-open", introTime >= INTRO.end);
        let best = 0;
        let bestVisibility = -1;
        sections.forEach((element, i) => {
          const visibility = copyVisibility(i, s, LAST_SCENE);
          element.style.setProperty("--reveal", visibility.toFixed(3));
          element.style.setProperty("--burn", copyBurn(i, s, LAST_SCENE).toFixed(3));
          if (visibility > bestVisibility) {
            bestVisibility = visibility;
            best = i;
          }
        });
        const closingSection = sections[LAST_SCENE];
        if (closingSection) {
          closingSection.style.setProperty("--line1", closingLine(0, s).toFixed(3));
          closingSection.style.setProperty("--line2", closingLine(1, s).toFixed(3));
          closingSection.style.setProperty("--settle", closingReveal(s).toFixed(3));
          closingSection.style.setProperty("--closing", closingReveal(s).toFixed(3));
        }
        const step = closingStep(s);
        if (step !== shownClosing) {
          shownClosing = step;
          setClosing(step);
        }
        if (best !== shown && bestVisibility > 0.4) {
          shown = best;
          setActive(best);
        }
        if (hudDepth.current) hudDepth.current.textContent = `Y ${cameraY < 0 ? "−" : "+"}${Math.abs(cameraY).toFixed(1)}`;
        // The hairline fills as the whole story is scrolled, so the end is never a surprise.
        if (hudProgress.current) hudProgress.current.style.transform = `scaleX(${(s / (LAST_SCENE + 1)).toFixed(4)})`;
      },
    });
    if (!engine) setStatus("fallback");
    return () => {
      cancelAnimationFrame(arrival);
      observer?.disconnect();
      engine?.dispose();
    };
  }, [still]);

  const sceneRef = (index: number) => (element: HTMLElement | null) => {
    scenes.current[index] = element;
  };
  const decoding = (index: number) => status === "ready" && active === index;
  // With the network running, a category scrolls to its first stop; without it, to the project list.
  const openCategory = (category: string) => {
    if (status === "fallback") document.getElementById("lab-projects")?.scrollIntoView({ behavior: still ? "auto" : "smooth" });
    else jumpToScene.current(stopScene(categoryStop(category)));
  };

  return (
    <div ref={page} className={`lab-page is-${status}${hovered?.link ? " is-card-hover" : ""}`}>
      <div className="lab-stage" aria-hidden="true"><canvas ref={canvas} /></div>
      <div className="lab-loader" aria-hidden="true"><span>Loading scene</span><i /></div>
      <div className="lab-hud" aria-hidden="true">
        <div className="lab-hud-progress"><i ref={hudProgress} /></div>
        <div className="lab-hud-depth"><span ref={hudDepth}>Y +0.0</span></div>
        <div className={`lab-hud-card${hovered ? " is-visible" : ""}`}>{hovered ? `${hovered.link ? "Open" : "Private repository"} · ${hovered.title}` : ""}</div>
      </div>

      <section ref={sceneRef(0)} className="lab-scene lab-scene-intro" data-nav="story" aria-labelledby="lab-title">
        <div className="lab-frame">
          <h1 id="lab-title" className="lab-title"><span className="lab-title-lead">Complexity into</span> <span className="lab-title-word">possibility.</span></h1>
          <div className="lab-intro-bottom">
            <p className="lab-kicker lab-roles">Fullstack software developer · AI engineer · Cloud engineer · Data professional</p>
            <p className="lab-body lab-intro-body">Full-stack engineering, amplified through applied AI. Grounded in data science, with range across business channels.</p>
          </div>
          <p className="lab-cue"><i /><span>Keep scrolling</span></p>
        </div>
      </section>

      <section ref={sceneRef(1)} className="lab-scene lab-scene-timeline" data-nav="about" aria-labelledby="lab-timeline">
        <NavAnchor id="about" />
        <div className="lab-frame lab-frame-center lab-frame-middle">
          <div className="lab-copy">
            <p className="lab-kicker">The climb so far</p>
            <h2 id="lab-timeline" className="lab-heading"><span><ScrambleText text="Every chapter" active={decoding(1)} still={still} /></span><span className="lab-accent"><ScrambleText text="built the next one." active={decoding(1)} still={still} /></span></h2>
            {/* The milestone cards live in the 3D scene; this list carries the same content for screen readers and the no-WebGL layout. */}
            <ol className="lab-milestones sr-only" aria-label="Career and education timeline">
              {timeline.map(item => <li key={`${item.company}-${item.period ?? item.chapter}`}><span>{item.period}</span><strong>{item.company}</strong><span>{item.title}</span></li>)}
            </ol>
          </div>
        </div>
      </section>

      <section ref={sceneRef(2)} className="lab-scene lab-scene-work" data-nav="work" aria-labelledby="lab-work">
        <NavAnchor id="work" />
        <div className="lab-frame">
          <div className="lab-copy">
            <p className="lab-kicker">Selected work</p>
            <h2 id="lab-work" className="lab-heading"><span><ScrambleText text="What are you" active={decoding(2)} still={still} /></span><span className="lab-accent"><ScrambleText text="looking for?" active={decoding(2)} still={still} /></span></h2>
            <ul className="lab-links">{PROJECT_CATEGORIES.map(category => <li key={category}><button type="button" onClick={() => openCategory(category)}>{category}</button></li>)}</ul>
            <ul id="lab-projects" className="lab-projects sr-only" aria-label="Projects">{cards.map(card => <li key={card.title}>{card.link ? <a href={card.link} target="_blank" rel="noopener noreferrer">{card.title}</a> : card.title}, {card.category}</li>)}</ul>
            <p className="lab-hint">Pick one, or keep scrolling</p>
          </div>
        </div>
      </section>

      <section ref={sceneRef(3)} className="lab-scene lab-scene-contact" data-nav="contact" aria-labelledby="lab-contact">
        <NavAnchor id="contact" />
        <div className="lab-frame lab-frame-center">
          <div className="lab-copy">
            <h2 id="lab-contact" className="lab-heading"><span className="lab-line lab-line-1"><ScrambleText text="The rest of the story" active={status === "ready" && closing >= 1} still={still} /></span><span className="lab-accent lab-line lab-line-2"><ScrambleText text="isn't written yet." active={status === "ready" && closing >= 2} still={still} /></span></h2>
            <p className="lab-closing">So let's make it a good one.</p>
            <div className="lab-cta-row">
              <a href="/skills" target="_blank" rel="noopener noreferrer" className="lab-cta">Check my skillset</a>
            </div>
            <div className="lab-contact-links">
              <a href="mailto:Jun.w.matthew@gmail.com"><Mail size={15} aria-hidden="true" /> Email</a>
              <a href="https://github.com/mwjun" target="_blank" rel="noopener noreferrer" aria-label="GitHub (opens in a new tab)"><Github size={15} aria-hidden="true" /> GitHub</a>
              <a href="https://www.linkedin.com/in/matt-jun-72a520319/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn (opens in a new tab)"><Linkedin size={15} aria-hidden="true" /> LinkedIn</a>
              <a href="/Matthew_Jun.pdf" download><ArrowDown size={15} aria-hidden="true" /> Résumé</a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
