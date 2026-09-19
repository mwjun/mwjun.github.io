import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X, ArrowUpRight } from "lucide-react";
import { skillGroups } from "@/data/skills";
import SkillConstellation from "./SkillConstellation";
import "@/styles/collections.css";

export default function SkillsSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Everything");
  const input = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();
  const normalized = query.trim().toLowerCase();
  const groups = skillGroups.filter(group => category === "Everything" || group.category === category).map(group => ({ ...group, skills: group.skills.filter(skill => skill.toLowerCase().includes(normalized) || group.category.toLowerCase().includes(normalized)) })).filter(group => group.skills.length);
  const matches = groups.flatMap(group => group.skills);
  const filtering = !!normalized || category !== "Everything";
  const reset = () => { setQuery(""); setCategory("Everything"); input.current?.focus(); };
  return <div className="collection-page skills-page">
    <header className="collection-intro skills-intro"><div><p className="collection-eyebrow">THE TOOLKIT</p><h1>Many disciplines.<br /><em>Connected thinking.</em></h1><p className="collection-description">The languages, tools, and ideas behind the work.<br />Explore the connections. Find what you’re looking for.</p></div></header>
    <section id="skill-library" className="collection-library skills-library" aria-label="Skills explorer">
      <div className="skills-exploration"><SkillConstellation matches={matches} filtering={filtering} /><div className="skill-results"><div className="skill-search-row"><div className="skill-search"><Search size={20} aria-hidden="true" /><label className="sr-only" htmlFor="skill-query">Search skills</label><input id="skill-query" ref={input} type="search" value={query} placeholder="Find a skill, tool, or discipline…" onChange={event => setQuery(event.target.value)} />{query && <button type="button" onClick={() => { setQuery(""); input.current?.focus(); }} aria-label="Clear search"><X size={18} /></button>}</div><p className="collection-count" role="status" aria-atomic="true">{matches.length} {matches.length === 1 ? "skill" : "skills"}{filtering ? " in focus" : " to explore"}</p></div>
      <div className="collection-filters skill-filters" role="group" aria-label="Filter skills by discipline">{["Everything", ...skillGroups.map(group => group.category)].map(item => <button type="button" key={item} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}</div>
      <motion.div layout={!reduced} className="skill-grid"><AnimatePresence initial={false} mode="popLayout">{groups.map(group => <motion.section layout={!reduced} key={group.category} className="skill-group" initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .22 }}>
        <div className="skill-group-heading"><span className={`discipline-dot discipline-${skillGroups.findIndex(item => item.category === group.category)}`} /><h2>{group.category}</h2><span>{group.skills.length}</span></div>
        <motion.ul layout={!reduced} className="skill-list"><AnimatePresence initial={false} mode="popLayout">{group.skills.map(skill => <motion.li layout={!reduced} key={skill} initial={reduced ? false : { opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }} className={normalized ? "skill-match" : undefined}>{skill}</motion.li>)}</AnimatePresence></motion.ul>
      </motion.section>)}</AnimatePresence></motion.div>
      {!matches.length && <div className="collection-empty"><Search size={28} /><h2>No connections found.</h2><p>Try a different term or explore another discipline.</p><button type="button" className="collection-link" onClick={reset}>Reset exploration <ArrowUpRight size={18} /></button></div>}
    </div></div></section>
  </div>;
}
