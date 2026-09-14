import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ContactSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-5xl font-bold mb-6"
        >
          Ready to Work{" "}
          <span className="text-gradient-shine">Together?</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-muted-foreground text-lg mb-12 max-w-2xl"
        >
          If you have any questions or concerns, please don't hesitate to reach
          out. I'll be happy to assist you. Talk to you soon.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 mb-12 max-w-md"
        >
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-xs font-mono-tech text-primary tracking-wider uppercase w-24 shrink-0">
              Location
            </span>
            <span className="text-foreground">Orange County, CA (Willing to Relocate)</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-xs font-mono-tech text-primary tracking-wider uppercase w-24 shrink-0">
              Email
            </span>
            <a
              href="mailto:Jun.w.matthew@gmail.com"
              className="text-foreground hover:text-primary transition-colors"
            >
              Jun.w.matthew@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-xs font-mono-tech text-primary tracking-wider uppercase w-24 shrink-0">
              Mobile
            </span>
            <a
              href="tel:5622055834"
              className="text-foreground hover:text-primary transition-colors"
            >
              562-205-5834
            </a>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-xs font-mono-tech text-primary tracking-wider uppercase w-24 shrink-0">
              Languages
            </span>
            <span className="text-foreground">Korean, English</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-start items-start"
        >
          <motion.a
            href="mailto:Jun.w.matthew@gmail.com"
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px hsla(185, 80%, 55%, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 rounded-xl card-glass border-primary/50 bg-primary/10 text-primary font-semibold tracking-wide glow-primary transition-all duration-300 inline-block hover:border-primary/70 hover:bg-primary/20"
          >
            Send Email
          </motion.a>
          <motion.a
            href="https://github.com/mwjun"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Matthew Jun on GitHub (opens in new tab)"
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px hsla(185, 80%, 55%, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 rounded-xl card-glass text-primary font-semibold tracking-wide glow-primary transition-all duration-300 inline-block hover:border-primary/50 hover:bg-primary/5"
          >
            GitHub
          </motion.a>
          <motion.a
            href="https://www.linkedin.com/in/matt-jun-72a520319/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Matthew Jun on LinkedIn (opens in new tab)"
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px hsla(185, 80%, 55%, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 rounded-xl card-glass text-primary font-semibold tracking-wide glow-primary transition-all duration-300 inline-block hover:border-primary/50 hover:bg-primary/5"
          >
            LinkedIn
          </motion.a>
          <motion.a
            href="/Matthew_Jun.pdf"
            target="_blank"
            rel="noopener noreferrer"
            download="Matthew_Jun.pdf"
            aria-label="Download Matthew Jun's resume (PDF)"
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px hsla(185, 80%, 55%, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 rounded-xl bg-primary text-primary-foreground font-semibold tracking-wide glow-primary transition-all duration-300 inline-block hover:opacity-90"
          >
            Download CV
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
