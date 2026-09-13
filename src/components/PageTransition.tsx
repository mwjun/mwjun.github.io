import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import "@/styles/page-transition.css";

export default function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const content = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = content.current;
    if (!element) return;
    element.classList.remove("is-transitioning");
    void element.offsetWidth;
    element.classList.add("is-transitioning");
  }, [pathname]);

  return (
    <div className="page-transition-viewport">
      <div ref={content} className="page-transition-content page-transition-cascade is-transitioning" data-page-transition="cascade">
        {children}
      </div>
    </div>
  );
}
