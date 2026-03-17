import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {

  const wordVariants = {
    hidden: { opacity: 0, y: 50, rotateX: -90 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        delay: 0.8 + i * 0.12,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    }),
  };

  const title = "Hi, I'm Matthew Jun";
  const words = title.split(" ");

  return (
    <section className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.45 }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      >
        <img src={heroBg} alt="" className="w-full h-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </motion.div>

      {/* Floating orbs — GPU-composited with will-change, blur-2xl (cheaper than 3xl) */}
      <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-primary/5 blur-2xl"
          animate={{ x: [0, 50, -30, 0], y: [0, -40, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ top: "10%", left: "10%", willChange: "transform" }}
        />
        <motion.div
          className="absolute w-72 h-72 rounded-full bg-accent/5 blur-2xl"
          animate={{ x: [0, -30, 50, 0], y: [0, 30, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ bottom: "20%", right: "15%", willChange: "transform" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex flex-wrap gap-2 justify-center"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-primary/30 text-primary text-sm font-mono-tech tracking-wider glow-primary">
            Full Stack Engineer
          </span>
          <span className="inline-block px-4 py-1.5 rounded-full border border-primary/30 text-primary text-sm font-mono-tech tracking-wider glow-primary">
            AI Engineer
          </span>
          <span className="inline-block px-4 py-1.5 rounded-full border border-primary/30 text-primary text-sm font-mono-tech tracking-wider glow-primary">
            Data Professional
          </span>
        </motion.div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-8" style={{ perspective: "1000px" }}>
          {words.map((word, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={wordVariants}
              initial="hidden"
              animate="visible"
              className={`inline-block ${["Matthew", "Jun"].includes(word) ? "text-gradient-shine glow-text" : ""}`}
              style={word === "Jun" ? { animationDelay: "-0.12s" } : undefined}
            >
              {word}{i < words.length - 1 ? "\u00A0" : ""}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Welcome to my portfolio. Full stack engineer, AI engineer & data professional. Turning data into
          insights and ideas into pixel-perfect experiences.
        </motion.p>
      </div>
    </section>
  );
};

export default HeroSection;
