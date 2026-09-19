import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft, Search, X } from "lucide-react";
import { CATEGORIES, CATEGORY_COLORS, SKILLS, rankSkills } from "@/lab/skillSearch";
import { createSkillSphere, type SkillSphere } from "@/lab/skillSphere";
import "@/styles/test-skills.css";

type Status = "loading" | "ready" | "fallback";

// v4 skills: a full-screen sphere of skills. Separate from the v3 Skills page, which keeps its atom.
export default function TestSkills() {
  const still = !!useReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const labels = useRef<(HTMLElement | null)[]>([]);
  const sphere = useRef<SkillSphere | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [shown, setShown] = useState(0);

  const results = useMemo(() => rankSkills(query, category), [query, category]);
  const focused = !!query.trim() || !!category;

  useEffect(() => {
    if (!canvas.current) return;
    const instance = createSkillSphere({
      canvas: canvas.current,
      labels: labels.current,
      reducedMotion: still,
      onPick: entry => {
        setQuery(entry.skill);
        setCategory(null);
      },
      // Clicking or tapping away from the dots leaves the selection, the same as Escape or the clear button.
      onDismiss: () => {
        setQuery("");
        setCategory(null);
      },
      onVisibleCount: setShown,
    });
    sphere.current = instance;
    setStatus(instance ? "ready" : "fallback");
    return () => {
      instance?.dispose();
      sphere.current = null;
    };
  }, [still]);

  useEffect(() => {
    sphere.current?.setResults(results, focused);
  }, [results, focused, status]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && event.target.closest("input, textarea");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        input.current?.focus();
      }
      if (event.key === "Escape" && (query || category)) {
        setQuery("");
        setCategory(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [query, category]);

  const statusText = !focused
    ? `${SKILLS.length} skills across ${CATEGORIES.length} disciplines`
    : !results.length
      ? "No skills match that yet"
      : status === "ready" && shown < results.length
        ? `${results.length} skills · showing the top ${shown}`
        : `${results.length} ${results.length === 1 ? "skill" : "skills"}`;

  return (
    <div className={`ts-page is-${status}${focused ? " is-focused" : ""}`}>
      <section className="ts-stage" aria-labelledby="ts-title">
        <h1 id="ts-title" className="sr-only">Skills</h1>
        <canvas ref={canvas} className="ts-canvas" aria-hidden="true" />
        <div className="ts-labels" aria-hidden="true">
          {SKILLS.map(entry => <span key={entry.index} ref={element => { labels.current[entry.index] = element; }} className="ts-label" style={{ "--dot": CATEGORY_COLORS[entry.groupIndex] } as React.CSSProperties}>{entry.skill}</span>)}
        </div>
        <Link to="/" className="ts-back"><ArrowLeft size={14} aria-hidden="true" /> Back to the story</Link>

        <div className="ts-ui">
          <div className="ts-search">
            <Search size={18} aria-hidden="true" />
            <label className="sr-only" htmlFor="ts-query">Search skills</label>
            <input id="ts-query" ref={input} type="search" value={query} autoComplete="off" spellCheck={false} placeholder="Find a skill, tool, or discipline" onChange={event => setQuery(event.target.value)} />
            {(query || category) && <button type="button" onClick={() => { setQuery(""); setCategory(null); input.current?.focus(); }} aria-label="Clear search"><X size={17} /></button>}
          </div>
          <p className="ts-status" role="status" aria-atomic="true">{statusText}</p>
          <div className="ts-chips" role="group" aria-label="Filter skills by discipline">
            {CATEGORIES.map((item, i) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(category === item ? null : item)} style={{ "--dot": CATEGORY_COLORS[i] } as React.CSSProperties}>{item}</button>)}
          </div>
        </div>

        {/* The sphere is visual only; this list carries the results for screen readers and the no-WebGL layout. */}
        <ul className="ts-results" aria-label="Matching skills">
          {(focused ? results : SKILLS).map(entry => <li key={entry.index}><span style={{ background: CATEGORY_COLORS[entry.groupIndex] }} aria-hidden="true" />{entry.skill}<small>{entry.category}</small></li>)}
        </ul>
      </section>
    </div>
  );
}
