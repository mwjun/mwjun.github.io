import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Search } from "lucide-react";

const skillGroups = [
  {
    category: "AI / ML",
    skills: [
      "AI tools",
      "Alteryx",
      "Computer Vision",
      "Data Analysis",
      "Mathematical Modeling",
      "NLP",
      "ONNX",
      "Pandas",
      "Power BI",
      "Probability & Statistics",
      "PyTorch",
      "Reinforcement Learning",
      "Tableau",
      "TensorFlow",
      "Transformers",
    ],
  },
  {
    category: "Languages",
    skills: ["C", "C#", "C++", "Go", "Java", "JavaScript", "Kotlin", "Objective-C", "PHP", "Python", "R", "Ruby", "SQL", "Swift", "TypeScript"],
  },
  {
    category: "Frontend",
    skills: [
      "Framer Motion",
      "HTML5 & CSS",
      "Next.js",
      "React",
      "React 18",
      "React Router",
      "shadcn/ui",
      "Tailwind CSS",
      "Three.js",
      "UX/UI Design",
      "WebGL",
    ],
  },
  {
    category: "Backend",
    skills: [
      "Backend Development",
      "BigQuery",
      "FastAPI",
      "Kafka",
      "MongoDB",
      "MySQL",
      "Node.js",
      "NoSQL",
      "PostgreSQL",
      "Redis",
      "Relational Database Design",
      "Spark",
      "TimescaleDB",
      "Vector Databases",
    ],
  },
  {
    category: "Infrastructure",
    skills: [
      "Airflow",
      "AWS",
      "Azure",
      "Bash",
      "CI/CD",
      "Docker",
      "Firebase",
      "GCP",
      "Kubernetes",
      "Linux",
      "Linux CLI",
      "Networking",
      "Shell / CLI",
      "Subabase",
      "TCP/IP",
      "Terraform",
      "Vercel",
      "Vite",
    ],
  },
  {
    category: "Security",
    skills: [
      "Cryptography",
      "GPG",
      "HackTheBox",
      "Kleopatra",
      "Metasploit",
      "Pen Testing",
      "Wireshark",
    ],
  },
];

const SkillsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [searchQuery, setSearchQuery] = useState("");

  const matchesSkill = (skill: string) => {
    if (!searchQuery.trim()) return false;
    return skill.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const matchCount = searchQuery.trim()
    ? skillGroups.reduce((n, g) => n + g.skills.filter(matchesSkill).length, 0)
    : 0;

  return (
    <section id="skills" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-5xl font-bold"
          >
            My <span className="text-gradient-shine">Skills</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full sm:w-72"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/80 pointer-events-none" />
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border-2 border-border text-sm text-foreground placeholder:text-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all [color-scheme:dark]"
                aria-label="Search skills"
              />
            </div>
            {searchQuery.trim() && (
              <p className="mt-2 text-xs text-muted-foreground">
                {matchCount === 0
                  ? "No matches"
                  : `${matchCount} skill${matchCount === 1 ? "" : "s"} found`}
              </p>
            )}
          </motion.div>
        </div>

        {searchQuery.trim() && !skillGroups.some((g) => g.skills.some((s) => matchesSkill(s))) && (
          <p className="text-muted-foreground text-sm mb-6">
            No skills match &quot;{searchQuery}&quot;. Try a different term.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skillGroups.map((group, gi) => (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                delay: 0.3 + gi * 0.15,
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="card-glass rounded-2xl p-5"
            >
              <h3 className="text-sm font-mono-tech text-primary tracking-widest mb-4 uppercase">
                {group.category}
              </h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {Array.from({ length: Math.ceil(group.skills.length / 4) }, (_, colIdx) =>
                  group.skills.slice(colIdx * 4, colIdx * 4 + 4)
                ).map((column, colIdx) => (
                  <div key={colIdx} className="space-y-2 min-w-[120px]">
                    {column.map((skill, si) => (
                      <motion.div
                        key={skill}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{
                          opacity: {
                            delay: 0.5 + gi * 0.1 + (colIdx * 4 + si) * 0.05,
                            duration: 0.5,
                            ease: [0.16, 1, 0.3, 1],
                          },
                          x: { duration: 0.1 },
                        }}
                        whileHover={{ x: 6, transition: { duration: 0.1 } }}
                        className={`flex items-center gap-3 group cursor-default rounded-lg px-2 -mx-2 py-0.5 transition-all duration-300 ${
                          matchesSkill(skill)
                            ? "bg-primary/20 border border-primary/50 text-primary"
                            : ""
                        }`}
                      >
                        <motion.div
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            matchesSkill(skill)
                              ? "bg-primary shadow-[0_0_8px_hsl(185,80%,55%,0.6)]"
                              : "bg-primary/50 group-hover:bg-primary group-hover:shadow-[0_0_8px_hsl(185,80%,55%,0.5)]"
                          }`}
                        />
                        <span
                          className={`text-sm transition-colors duration-300 ${
                            matchesSkill(skill)
                              ? "text-primary font-medium"
                              : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          {skill}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
