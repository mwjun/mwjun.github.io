import "@/styles/experience-logos.css";

const companies = [
  { name: "Boeing", image: "/brands/boeing.png?v=2", width: 228, height: 53, className: "logo-boeing" },
  { name: "Konami", image: "/brands/konami.png?v=2", width: 200, height: 34, className: "logo-konami" },
  { name: "KPMG", image: "/brands/kpmg.svg", width: 77, height: 30, className: "logo-kpmg" },
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
    </section>
  );
}
