import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import HelixTimeline3D from "./HelixTimeline3D";

const stats = [
  {
    label: "7 figure results",
    value: "7-figure",
    description: "E-Commerce revenue from $175K to 7 figures monthly through data insights.",
  },
  {
    label: "Years Experience",
    value: "10+",
    description: "Exposure to a variety of industries: Insurance, Healthcare, E-commerce, Entertainment, Hospitality, IT.",
  },
  {
    label: "AI Tools & LLMs",
    value: "Master",
    description: "OpenAI, Cursor, Claude, Perplexity, Gemini, Copilot, Midjourney, Jasper, Llama, Mistral, n8n, Agents, Zapier, Make, and more.",
  },
  {
    label: "Strategist",
    value: "Analytical",
    valueHighlight: "Analytical",
    description: "Precision and critical thinking across dev, data analysis, user experience, and product design.",
  },
];

const timeline = [
  { period: "2014 - 2018", title: "Data Analyst / Web Developer", company: "American Excel Enterprise" },
  { period: "2018 - 2019", title: "Web Developer / Marketing Specialist", company: "JSL Benefits" },
  { period: "2019 - 2022", title: "A.S. Computer Science", company: "Fullerton College" },
  { period: "2022 - 2024", title: "SI Math Instructor", company: "Fullerton College" },
  { period: "2023 - 2024", title: "B.S. in Computer Science", company: "California State University of Fullerton" },
  { period: "2024 - present", title: "Behavioral Therapist", company: "First Step Learning" },
  { period: "2025 - present", title: "Full Stack Developer", company: "Konami Digital Entertainment (KDE-US)" },
  { period: "??? - future", title: "???", company: "To be continued..." },
];

const skills = [
  "Frontend Development",
  "Backend Development",
  "UX/UI Design",
  "SQL / Relational Database Design",
  "Networking",
  "AI tools",
  "Prompt Engineering",
  "Quantitative and Data Analysis",
  "Marketing",
];

const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <div className="grid md:grid-cols-2 gap-16 items-start mb-20">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Information <span className="text-gradient-shine">About Me</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-muted-foreground leading-relaxed text-lg mb-6"
            >
              My LinkedIn profile and résumé cover the formal career details; this
              page shares the story behind the bullet points. You'll find
              reflections on the experiences that shaped my path. If you prefer a
              concise overview, feel free to download my CV.
            </motion.p>
            <motion.a
              href="/Matthew_Jun.pdf"
              target="_blank"
              rel="noopener noreferrer"
              download="Matthew_Jun.pdf"
              aria-label="Download Matthew Jun's resume (PDF)"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px hsla(185, 80%, 55%, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="inline-block px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm tracking-wide glow-primary transition-all duration-300"
            >
              Download CV
            </motion.a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{
                  delay: 0.3 + i * 0.1,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                className="card-glass-strong rounded-2xl p-6 text-center group hover:border-primary/30 transition-all duration-500"
              >
                <div className="text-2xl font-bold mb-2">
                  {stat.valueHighlight ? (
                    <>
                      <span className="text-gradient-shine">{stat.valueHighlight}</span>
                      {stat.value !== stat.valueHighlight && <> {stat.value}</>}
                    </>
                  ) : (
                    <span className="text-gradient">{stat.value}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-mono-tech tracking-wider uppercase mb-2">
                  {stat.label}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {stat.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* My Skills */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20"
        >
          <h3 className="text-2xl font-bold mb-6">
            My <span className="text-gradient-shine">Skills</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, i) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{
                  delay: 0.7 + i * 0.03,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="px-4 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm font-medium text-foreground"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Timeline heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h3 className="text-2xl font-bold mb-6">
            My <span className="text-gradient-shine">Timeline</span>
          </h3>
        </motion.div>
      </div>

      {/* Helix outside max-w container so sticky works (no parent transforms) */}
      <div className="max-w-6xl mx-auto">
        <HelixTimeline3D timeline={timeline} isInView={isInView} />
      </div>
    </section>
  );
};

export default AboutSection;
