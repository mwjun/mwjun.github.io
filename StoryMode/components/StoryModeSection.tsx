import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

const storyParagraphs = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer ullamcorper, enim id varius iaculis, arcu neque posuere justo, vel viverra sem massa quis nibh. Nulla facilisi. Curabitur consequat luctus eros, non posuere nunc feugiat in.",
  "Suspendisse potenti. Sed vel nunc tristique, mollis justo sed, tincidunt nunc. Quisque at gravida lorem. Morbi eget arcu nec lacus feugiat convallis. Proin faucibus ligula eget quam tincidunt, vitae feugiat lorem vestibulum.",
  "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Duis a volutpat sem. Donec commodo lorem eu lorem tincidunt, at facilisis eros posuere. Nunc et augue feugiat, luctus lectus in, ullamcorper velit.",
  "Vivamus eu est elit. Nam ut lacus ligula. Aenean luctus lacinia est, sit amet pulvinar augue hendrerit in. Integer blandit libero at hendrerit tempor. Nulla volutpat orci vitae leo volutpat, at luctus nibh consequat.",
];

const StoryModeSection = () => {
  const navigate = useNavigate();
  const introRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: introRef,
    offset: ["start start", "end start"],
  });

  const tunnelScale = useTransform(scrollYProgress, [0, 0.7], [1, prefersReducedMotion ? 1 : 1.45]);
  const tunnelRotate = useTransform(scrollYProgress, [0, 0.7], [0, prefersReducedMotion ? 0 : -14]);
  const bgLayerY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -200]);
  const midLayerY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -360]);
  const frontLayerY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -560]);
  const introOpacity = useTransform(scrollYProgress, [0.55, 0.78], [1, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0.7, 0.95], [0, 1]);

  return (
    <section className="story-mode-root relative overflow-x-clip">
      <button
        type="button"
        aria-label="Exit story mode"
        onClick={() => navigate("/about")}
        className="story-close-button"
      >
        ×
      </button>

      <div ref={introRef} className="relative min-h-[220vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <motion.div className="story-vignette" style={{ opacity: introOpacity }} />

          <motion.div className="story-tunnel-bg" style={{ y: bgLayerY, scale: tunnelScale, rotate: tunnelRotate }} />

          <motion.div className="story-object-layer story-object-layer-back" style={{ y: midLayerY, opacity: introOpacity }}>
            <div className="story-object orb orb-a" />
            <div className="story-object orb orb-b" />
            <div className="story-object bar bar-a" />
            <div className="story-object bar bar-b" />
          </motion.div>

          <motion.div className="story-object-layer story-object-layer-front" style={{ y: frontLayerY, opacity: introOpacity }}>
            <div className="story-object orb orb-c" />
            <div className="story-object orb orb-d" />
            <div className="story-object bar bar-c" />
            <div className="story-object bar bar-d" />
          </motion.div>

          <motion.div className="story-intro-copy" style={{ opacity: introOpacity }}>
            <p className="story-label">// STORY MODE</p>
            <h1 className="story-title">
              Entering <span className="shine-animation glow-text">My Journey</span>
            </h1>
            <p className="story-subtitle">Scroll down to move deeper into the story.</p>
          </motion.div>
        </div>
      </div>

      <motion.div className="relative z-20 mx-auto max-w-3xl px-6 pb-28 -mt-24 md:-mt-32" style={{ opacity: contentOpacity }}>
        <article className="card-glass rounded-3xl p-8 md:p-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            The Beginning <span className="shine-animation glow-text">of the Story</span>
          </h2>
          <div className="space-y-6 text-base md:text-lg text-muted-foreground leading-relaxed">
            {storyParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      </motion.div>
    </section>
  );
};

export default StoryModeSection;
