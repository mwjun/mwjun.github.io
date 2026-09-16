import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import HelixTimeline3D from "./HelixTimeline3D";
import SiteFooter from "./SiteFooter";
import { timeline } from "@/data/timeline";
import "@/styles/portfolio.css";
import "@/styles/about.css";

export default function AboutSection() {
  return (
    <div className="portfolio-home about-page">
      <section className="about-intro" aria-labelledby="about-title">
        <div className="about-intro-grid">
          <h1 id="about-title">The story<br /><span className="serif-accent">behind the code.</span></h1>
          <div className="about-intro-copy">
            <p>My path to software has taken me through creative work, commerce, classrooms, and understanding people. Every chapter brings a different perspective to the way I build.</p>
            <p>Today, that means full-stack development, applied AI, and a curiosity that keeps me moving forward.</p>
            <div className="about-intro-actions"><a href="/Matthew_Jun.pdf" download className="quiet-link">Download résumé <ArrowDownToLine size={16} /></a></div>
          </div>
        </div>
        <div className="about-context"><span>ORANGE COUNTY, CALIFORNIA</span><span>ENGLISH & KOREAN</span><span>FULL STACK · AI · DESIGN</span></div>
      </section>

      <h2 className="sr-only">My career and education</h2>
      <HelixTimeline3D timeline={timeline} />

      <section className="about-perspective content-section" aria-labelledby="perspective-title">
        <p className="eyebrow">WHAT I BRING WITH ME</p>
        <div className="about-perspective-grid">
          <div><h2 id="perspective-title">Different chapters.<br /><span className="serif-accent">A broader perspective.</span></h2><p className="about-perspective-copy">Development, data, design, and understanding people all belong in the same conversation. I bring an analytical approach to connecting them.</p><Link to="/skills" className="text-link">Explore my toolkit <ArrowUpRight size={18} /></Link></div>
          <div className="about-results"><div><strong>10+</strong><span>years across industries</span><p>Insurance, healthcare, e-commerce, entertainment, hospitality, and IT.</p></div><div><strong>7-figure</strong><span>monthly e-commerce revenue</span><p>Data insights helped grow monthly revenue from $175K to seven figures.</p></div><div><strong>Full stack + AI</strong><span>not limited to one role</span><p>Interfaces, backend services, data, cloud, and AI, so I can take an idea from design to deployment.</p></div><div><strong>Mentor</strong><span>learning well and teaching well</span><p>I mentor new team members and help them get up to speed, and I take pride in explaining things clearly, from code to complex ideas.</p></div></div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
