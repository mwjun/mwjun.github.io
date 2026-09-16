import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>=";

// Decodes from random glyphs each time it becomes active. Screen readers get the plain text.
export default function ScrambleText({ text, active, still = false }: { text: string; active: boolean; still?: boolean }) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (!active || still) {
      setShown(text);
      return;
    }
    const characters = [...text];
    const settle = characters.map((_, i) => (i / characters.length) * 0.65 + Math.random() * 0.3);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = (now - start) / 900;
      setShown(characters.map((character, i) => (character === " " || progress >= settle[i] ? character : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(""));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, still, text]);

  return <><span className="sr-only">{text}</span><span aria-hidden="true">{shown}</span></>;
}
