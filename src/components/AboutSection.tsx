import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import HelixTimeline3D, { type TimelineItem } from "./HelixTimeline3D";
import SiteFooter from "./SiteFooter";
import "@/styles/portfolio.css";
import "@/styles/about.css";

const timeline: TimelineItem[] = [
  { period: "2009 - 2010", title: "Telerecruiter", company: "American Red Cross", chapter: "A beginning in service" },
  { period: "2010 - 2012", title: "Cast Member / Parade Coordinator", company: "Disneyland Resort", chapter: "Creating experiences" },
  { period: "2012 - 2014", title: "Assistant Manager", company: "Family Discount", chapter: "People & responsibility" },
  { period: "2012 - 2014", title: "Freelance Photographer, Videographer, Editor & Graphic Designer", company: "Rank1Studios", chapter: "Creative roots" },
  { period: "2014 - 2018", title: "Data Analyst / Web Developer", company: "American Excel Enterprise", chapter: "Where data meets development" },
  { period: "2018 - 2019", title: "Web Developer / Marketing Specialist", company: "JSL Benefits", chapter: "Connecting business & technology" },
  { period: "2019 - 2022", title: "A.S. Computer Science", company: "Fullerton College", chapter: "Building the foundation" },
  { period: "2022 - 2024", title: "SI Math Instructor", company: "Fullerton College", chapter: "Learning through teaching" },
  { period: "2023 - 2024", title: "B.S. in Computer Science", company: "California State University, Fullerton", chapter: "Going deeper" },
  { period: "2024 - 2026", title: "Behavioral Therapist", company: "First Step Learning", chapter: "The human perspective" },
  { period: "2025 - present", title: "Full-Stack Developer", company: "Konami Digital Entertainment (KDE-US)", chapter: "Building secure game experiences" },
  { period: "2026 - present", title: "Software Developer", company: "Boeing", chapter: "A new horizon" },
  { title: "More to learn. More to build.", company: "The next chapter", chapter: "To be continued..." },
];

const skills = ["Frontend Development", "Backend Development", "UX/UI Design", "SQL / Relational Database Design", "Networking", "AI tools", "Prompt Engineering", "Quantitative and Data Analysis", "Marketing"];

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
          <div className="about-results"><div><strong>10+</strong><span>years across industries</span><p>Insurance, healthcare, e-commerce, entertainment, hospitality, and IT.</p></div><div><strong>7-figure</strong><span>monthly e-commerce revenue</span><p>Data insights helped grow monthly revenue from $175K to seven figures.</p></div></div>
        </div>
        <div className="about-skill-list" aria-label="Areas of expertise">{skills.map(skill => <span key={skill}>{skill}</span>)}</div>
      </section>
      <SiteFooter />
    </div>
  );
}
