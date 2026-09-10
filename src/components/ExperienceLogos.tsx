import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import "@/styles/experience-logos.css";

const companies = [
  { name: "Boeing", image: "/brands/boeing.png", width: 300, height: 110, className: "logo-boeing" },
  { name: "KPMG", image: "/brands/kpmg.svg", width: 77, height: 30, className: "logo-kpmg" },
  { name: "Konami", image: "/brands/konami.png", width: 260, height: 74, className: "logo-konami" },
];

export default function ExperienceLogos() {
  return (
    <section className="experience-logos" aria-labelledby="experience-label">
      <h3 id="experience-label" className="small-meta">EXPERIENCE ACROSS</h3>
      <ul className="company-logos">
        {companies.map(company => (
          <li className="company-logo" key={company.name}>
            <img src={company.image} width={company.width} height={company.height} className={company.className} alt={company.name} loading="lazy" />
          </li>
        ))}
      </ul>
      <Link to="/about" className="text-link">My experience <ArrowUpRight size={16} /></Link>
    </section>
  );
}
