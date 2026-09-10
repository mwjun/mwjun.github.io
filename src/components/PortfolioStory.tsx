import { ArrowDown, ArrowUpRight, ArrowUp, Github, Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import ExperienceLogos from "./ExperienceLogos";

const projects = [
  { category: 'COMMERCE / FULL STACK', name: 'Brushmo', description: 'A full-stack commerce website for American Excel Enterprise, connecting the customer experience with the systems behind it.', stack: ['React', 'Node.js', 'PostgreSQL'], url: 'https://brushmo.com' },
  { category: 'INSURANCE / WEB EXPERIENCE', name: 'JSL Benefits', description: 'Making insurance easier to navigate, with responsive interfaces and secure quote-request flows.', stack: ['React', 'PHP', 'PostgreSQL'], url: 'https://jslbenefits.com' },
];
const capabilities = [
  { title: 'The experience', text: 'Interfaces that make the complex approachable.', stack: 'React · TypeScript · UX / UI' },
  { title: 'The foundation', text: 'Services and data that hold everything together.', stack: 'Node.js · Python · SQL · Cloud' },
  { title: 'The intelligence', text: 'AI connected to practical, everyday workflows.', stack: 'LLMs · Agents · Automation' },
];

export default function PortfolioStory() {
  return (
    <>
      <section id="work" className="selected-work content-section" aria-labelledby="work-title">
        <div className="section-topline"><p className="eyebrow">SELECTED WORK</p><span className="small-meta">IDEAS, MADE REAL</span></div>
        <div className="section-heading"><h2 id="work-title">A little curiosity.<br /><span className="serif-accent">A lot of building.</span></h2><Link to="/projects" className="text-link">All projects <ArrowUpRight size={18} /></Link></div>
        <a className="featured-project" href="https://github.com/mwjun/NeuralVision" target="_blank" rel="noopener noreferrer" aria-label="Explore NeuralVision on GitHub (opens in a new tab)">
          <div className="featured-visual"><img src={heroBg} alt="A luminous neural network visualizing connections in a brain" loading="lazy" width="1920" height="1080" /><span className="visual-caption">COMPUTER VISION / MACHINE LEARNING</span></div>
          <div className="featured-copy"><div className="project-title-row"><h3>NeuralVision</h3><span className="project-arrow"><ArrowUpRight size={23} /></span></div><p>Teaching machines to see.<br />Real-time object detection and scene understanding, powered by custom transformer models.</p><div className="project-tags"><span>PyTorch</span><span>ONNX</span><span>React</span><span>WebGL</span></div><span className="project-bottom-link">Explore the code <ArrowUpRight size={16} /></span></div>
        </a>
        <div className="project-pair">{projects.map(project => <a className="project-tile" key={project.name} href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${project.name} (opens in a new tab)`}><div className="tile-top"><span className="small-meta">{project.category}</span></div><div className="project-title-row"><h3>{project.name}</h3><span className="project-arrow"><ArrowUpRight size={23} /></span></div><p>{project.description}</p><div className="project-tags">{project.stack.map(tag => <span key={tag}>{tag}</span>)}</div></a>)}</div>
      </section>
      <section id="practice" className="practice-section content-section" aria-labelledby="practice-title">
        <div className="section-topline"><p className="eyebrow">HOW I BUILD</p><Link to="/skills" className="text-link">The full toolkit <ArrowUpRight size={18} /></Link></div>
        <h2 id="practice-title">The whole picture.<br /><span className="serif-accent">Down to the details.</span></h2>
        <div className="capability-grid">{capabilities.map(item => <div className="capability" key={item.title}><h3>{item.title}</h3><p>{item.text}</p><span className="capability-stack">{item.stack}</span></div>)}</div>
        <ExperienceLogos />
      </section>
      <section id="contact" className="home-contact content-section" aria-labelledby="contact-title">
        <div className="section-topline"><p className="eyebrow">THE NEXT CHAPTER</p><span className="small-meta">LET'S MAKE IT A GOOD ONE</span></div>
        <h2 id="contact-title">Something in mind?<br /><a href="mailto:Jun.w.matthew@gmail.com" className="serif-accent">Let's build it. <ArrowUpRight aria-hidden="true" /></a></h2>
        <div className="contact-details"><p>Have a project, a role, or a question?<br />I'd love to hear what you're thinking.</p><a href="mailto:Jun.w.matthew@gmail.com" className="email-link">Jun.w.matthew@gmail.com <ArrowUpRight size={18} /></a></div>
        <div className="contact-links"><a href="mailto:Jun.w.matthew@gmail.com"><Mail size={17} /> Email</a><a href="https://github.com/mwjun" target="_blank" rel="noopener noreferrer" aria-label="GitHub (opens in a new tab)"><Github size={17} /> GitHub</a><a href="https://www.linkedin.com/in/matt-jun-72a520319/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn (opens in a new tab)"><Linkedin size={17} /> LinkedIn</a><a href="/Matthew_Jun.pdf" download><ArrowDown size={17} /> Résumé</a><Link to="/contact">Contact details <ArrowUpRight size={17} /></Link></div>
      </section>
      <footer className="home-footer"><a href="#story" className="footer-name">Matthew Jun<span>Thoughtfully engineered.</span></a><p>© {new Date().getFullYear()} Matthew Jun</p><a href="#story" className="back-to-top">Back to top <ArrowUp size={15} /></a></footer>
    </>
  );
}
