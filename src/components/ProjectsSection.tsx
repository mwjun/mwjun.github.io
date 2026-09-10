import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { projects } from "@/data/projects";
import "@/styles/collections.css";

const categories = ["All work", "Web experiences", "AI & data", "Games", "Portfolio evolution"];

function ProjectArtwork({ category, variant }: { category: string; variant: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-7, 7]);
  const scale = useTransform(scrollYProgress, [0, 1], [.96, 1.08]);
  return <div ref={ref} className={`work-art art-${categories.indexOf(category)}`} aria-hidden="true">
    <motion.svg viewBox="0 0 600 280" fill="none" style={{ rotate: reduced ? 0 : rotate, scale: reduced ? 1 : scale }}>
      {category === "AI & data" ? Array.from({ length: 16 }, (_, i) => <ellipse key={i} cx="300" cy="140" rx={50 + i * 9} ry={25 + i * 5} transform={`rotate(${i * 11 + variant * 20} 300 140)`} />) :
        category === "Games" ? Array.from({ length: 9 }, (_, i) => <rect key={i} x={225 - i * 9} y={65 - i * 3} width={150 + i * 18} height={150 + i * 6} rx="3" transform={`rotate(${45 + i * 3} 300 140)`} />) :
        Array.from({ length: 7 }, (_, i) => <g key={i} transform={`translate(${130 + i * 22} ${35 + i * 14})`}><rect width="220" height="145" rx="5" /><path d="M0 25H220M20 50H110M20 65H150M20 80H90M135 100H200M135 115H185" /><circle cx="13" cy="13" r="2" /></g>)}
    </motion.svg>
    <span>{category === "Portfolio evolution" ? "AN EVOLVING PRACTICE" : category.toUpperCase()}</span>
  </div>;
}

export default function ProjectsSection() {
  const [category, setCategory] = useState("All work");
  const reduced = useReducedMotion();
  const visible = projects.filter(project => category === "All work" || project.category === category);
  return <div className="collection-page work-page">
    <header className="collection-intro">
      <p className="collection-eyebrow">THE WORK</p>
      <h1>Curiosity, <em>put to work.</em></h1>
      <div className="collection-intro-bottom"><p>From intelligent systems to everyday experiences.<br />A collection of things I’ve built, explored, and kept improving.</p><a href="#project-library" className="collection-link">Explore the collection <ArrowRight size={18} /></a></div>
    </header>
    <section id="project-library" className="collection-library" aria-label="Project collection">
      <div className="collection-toolbar"><div className="collection-filters" role="group" aria-label="Filter projects">{categories.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><p className="collection-count" role="status">{visible.length} projects</p></div>
      <motion.div layout={!reduced} className="work-grid">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map(project => <motion.article layout={!reduced} key={project.title} className="work-card" initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: reduced ? 1 : .98 }} transition={{ duration: .24, ease: "easeOut" }}>
            <ProjectArtwork category={project.category} variant={projects.indexOf(project)} />
            <div className="work-card-copy"><p className="collection-eyebrow">{project.category}</p><h2>{project.title}</h2><p className="work-description">{project.description}</p><ul className="collection-tags" aria-label="Technology stack">{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
              {project.link ? <a href={project.link} target="_blank" rel="noopener noreferrer" className="collection-link" aria-label={`View ${project.title} (opens in a new tab)`}>{project.category === "Portfolio evolution" ? "Explore this version" : project.link.includes("github.com") ? "Explore the code" : "Visit project"}<ArrowUpRight size={18} /></a> : <span className="work-note">Project overview</span>}
            </div>
          </motion.article>)}
        </AnimatePresence>
      </motion.div>
    </section>
    <div className="collection-outro"><div><p className="collection-eyebrow">BEHIND THE WORK</p><h2>The tools. <em>The thinking.</em></h2></div><Link to="/skills" className="collection-link">Explore my skills <ArrowUpRight size={20} /></Link></div>
  </div>;
}
