import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const projects = [
  // Existing projects (keeping the new design style)
  {
    title: "NeuralVision",
    description:
      "Real-time object detection and scene understanding powered by custom transformer models.",
    tags: ["PyTorch", "ONNX", "React", "WebGL", "Docker"],
    gradient: "from-primary/20 to-accent/20",
    borderGlow: "hover:border-primary/40",
    link: "https://github.com/mwjun/NeuralVision",
  },
  {
    title: "SynthMind",
    description:
      "Conversational AI platform with multi-modal understanding. Processes text, images, and audio in a unified architecture.",
    tags: ["LLM", "FastAPI", "TypeScript", "Redis"],
    gradient: "from-accent/20 to-glow-warm/20",
    borderGlow: "hover:border-accent/40",
  },
  {
    title: "DataForge",
    description:
      "Automated ML pipeline builder that reduces model training time by 60%. Drag-and-drop interface for data scientists.",
    tags: ["Kubernetes", "Airflow", "React", "PostgreSQL"],
    gradient: "from-glow-warm/20 to-primary/20",
    borderGlow: "hover:border-glow-warm/40",
  },
  {
    title: "QuantumPredict",
    description:
      "Financial prediction engine using ensemble methods and real-time market data.",
    tags: ["TensorFlow", "Kafka", "Go", "TimescaleDB"],
    gradient: "from-primary/20 to-primary/5",
    borderGlow: "hover:border-primary/40",
  },
  // Old portfolio projects
  {
    title: "Website Portfolio (Previous Version)",
    description:
      "Earlier portfolio built with vanilla JavaScript and MVC architecture. Responsive design, dark/light theme, interactive timeline, and audio feedback. No frameworks—pure HTML5, CSS3/SCSS, and ES6 modules.",
    tags: ["HTML5", "CSS3", "SCSS", "Vanilla JavaScript", "ES6 Modules"],
    gradient: "from-primary/20 to-accent/20",
    borderGlow: "hover:border-primary/40",
    link: "https://matthew-w-jun.vercel.app/",
  },
  {
    title: "TutoRial",
    description:
      "Action RPG capstone project using Godot 4 Engine. C# and GDScript with Blender and Mixamo for 3D creation. State machines, UML design patterns, AGILE/SCRUM, JIRA.",
    tags: ["C#", "GDScript", "Godot 4", "Blender", "Mixamo"],
    gradient: "from-primary/20 to-accent/20",
    borderGlow: "hover:border-primary/40",
  },
  {
    title: "TraderBot v3",
    description:
      "Stock backtesting application to simulate various trading strategies and possible returns. MVC design with yfinance, Pandas, Tkinter, AWS S3, and CI/CD pipelines.",
    tags: ["Python", "yfinance", "Pandas", "Tkinter", "AWS S3"],
    gradient: "from-accent/20 to-glow-warm/20",
    borderGlow: "hover:border-accent/40",
  },
  {
    title: "Brushmo",
    description:
      "Website created for American Excel Enterprise. Full-stack with React, Node.js, PostgreSQL, MongoDB, and CI/CD pipelines.",
    tags: ["JavaScript", "Python", "PHP", "React", "Node.js", "PostgreSQL"],
    gradient: "from-glow-warm/20 to-primary/20",
    borderGlow: "hover:border-glow-warm/40",
    link: "https://brushmo.com",
  },
  {
    title: "JSL Benefits",
    description:
      "Website created for JSL Benefits. Secure quote-request flows, responsive design, PostgreSQL for policyholder records.",
    tags: ["JavaScript", "Python", "PHP", "React", "Node.js", "PostgreSQL"],
    gradient: "from-primary/20 to-accent/20",
    borderGlow: "hover:border-primary/40",
    link: "https://jslbenefits.com",
  },
  {
    title: "Vessel Church OC",
    description:
      "Website created for Vessel Church OC. Modern stack with React, Node.js, PostgreSQL, MongoDB, and CI/CD.",
    tags: ["JavaScript", "Python", "PHP", "React", "Node.js", "PostgreSQL"],
    gradient: "from-accent/20 to-primary/20",
    borderGlow: "hover:border-accent/40",
    link: "https://vesselchurchoc.com",
  },
];

const ProjectsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="projects" className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          My <span className="text-gradient-shine">Portfolio</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-muted-foreground mb-16 max-w-2xl"
        >
          Here is some of my work using various programming languages and tools.
        </motion.p>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project, i) => {
            const content = (
              <>
              <div
                className={`w-full h-2 rounded-full bg-gradient-to-r ${project.gradient} mb-6 group-hover:h-3 transition-all duration-500`}
              />
              <h3 className="text-2xl font-bold mb-3 group-hover:text-gradient transition-all duration-300">
                {project.title}
                {project.link && (
                  <span className="ml-2 text-sm text-muted-foreground" aria-hidden="true">↗</span>
                )}
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {project.description}
              </p>
              <p className="text-xs font-mono-tech text-primary tracking-wider uppercase mb-2">
                Featured Stack
              </p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-mono-tech bg-secondary text-secondary-foreground border border-border/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              </>
            );
            return (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                delay: 0.3 + i * 0.08,
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
              className={`group card-glass rounded-2xl p-8 transition-all duration-500 ${project.link ? "cursor-pointer" : ""} ${project.borderGlow}`}
            >
              {project.link ? (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${project.title} (opens in new tab)`}
                  className="block no-underline text-inherit"
                >
                  {content}
                </a>
              ) : (
                content
              )}
            </motion.div>
          );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
