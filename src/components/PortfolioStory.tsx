import { ArrowDown, ArrowUpRight, ArrowUp, Github, Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import ExperienceLogos from "./ExperienceLogos";

const expertise = [
  {
    title: 'Software Engineering',
    text: 'Full-stack applications that connect thoughtful interfaces with dependable backend systems.',
    stack: 'React · Angular · TypeScript · Node.js · Django · .NET',
  },
  {
    title: 'AI Engineering',
    text: 'Practical AI systems built with language models, retrieval, computer vision, and intelligent automation.',
    stack: 'TensorFlow · PyTorch · LLMs · Multimodal RAG',
  },
  {
    title: 'Cloud & Data Engineering',
    text: 'Secure infrastructure and data workflows that turn operational information into useful systems.',
    stack: 'AWS · Terraform · Docker · Spark · SQL',
  },
];

export default function PortfolioStory() {
  return (
    <>
      <section id="practice" className="practice-section content-section" aria-labelledby="practice-title">
        <div className="section-topline">
          <p className="eyebrow">CORE EXPERTISE</p>
        </div>
        <div className="expertise-content">
          <h2 id="practice-title">Software. AI. Cloud.<br /><span className="serif-accent">Connecting the dots.</span></h2>
          <div className="capability-grid">{expertise.map(item => <article className="capability" key={item.title}><h3>{item.title}</h3><p>{item.text}</p><span className="capability-stack">{item.stack}</span></article>)}</div>
        </div>
        <ExperienceLogos />
      </section>
      <section id="contact" className="home-contact content-section" aria-labelledby="contact-title">
        <div className="section-topline">
          <p className="eyebrow">THE NEXT CHAPTER</p>
          <span className="small-meta">LET'S MAKE IT A GOOD ONE</span>
        </div>
        <div className="contact-closing">
          <h2 id="contact-title"><span className="contact-quote-first">How can I</span>{' '}<span className="contact-quote-second">best serve you?</span></h2>
          <a href="mailto:Jun.w.matthew@gmail.com" className="contact-closing-link">Tell me about it. <ArrowUpRight aria-hidden="true" /></a>
        </div>
        <div className="contact-links"><a href="mailto:Jun.w.matthew@gmail.com"><Mail size={17} /> Email</a><a href="https://github.com/mwjun" target="_blank" rel="noopener noreferrer" aria-label="GitHub (opens in a new tab)"><Github size={17} /> GitHub</a><a href="https://www.linkedin.com/in/matt-jun-72a520319/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn (opens in a new tab)"><Linkedin size={17} /> LinkedIn</a><a href="/Matthew_Jun.pdf" download><ArrowDown size={17} /> Résumé</a><Link to="/contact">Contact details <ArrowUpRight size={17} /></Link></div>
      </section>
      <footer className="home-footer"><a href="#story" className="footer-name">Matthew Jun<span>Thoughtfully engineered.</span></a><p>© {new Date().getFullYear()} Matthew Jun</p><a href="#story" className="back-to-top">Back to top <ArrowUp size={15} /></a></footer>
    </>
  );
}
