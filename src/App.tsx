import { lazy, Suspense, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import ParticleField from "@/components/ParticleField";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import Index from "./pages/Index";
const About = lazy(() => import("./pages/About"));
const Projects = lazy(() => import("./pages/Projects"));
const Skills = lazy(() => import("./pages/Skills"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();
const titles: Record<string, string> = { '/': 'Software Developer & Creative Problem Solver', '/about': 'About', '/projects': 'Projects', '/skills': 'Skills', '/contact': 'Contact' };

const AppContent = () => {
  const { pathname, hash, key } = useLocation();
  const previousLocation = useRef({ pathname, hash });
  const isHome = pathname === '/';
  const hasCinematicScene = isHome || ['/about', '/projects', '/skills'].includes(pathname);
  useEffect(() => {
    const navigated = previousLocation.current.pathname !== pathname || previousLocation.current.hash !== hash;
    previousLocation.current = { pathname, hash };
    document.title = `Matthew Jun | ${titles[pathname] || 'Page not found'}`;
    const frame = requestAnimationFrame(() => {
      if (hash) {
        const target = document.getElementById(hash.slice(1));
        if (target) {
          target.scrollIntoView({ behavior: 'instant' });
          if (navigated) {
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
          }
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (navigated) document.getElementById('main-content')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash, key]);

  return <div className={`relative min-h-screen bg-background ${hasCinematicScene ? '' : 'noise-bg grid-bg'}`}>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground">Skip to content</a>
    {!hasCinematicScene && <ParticleField />}
    <Navbar />
    <main id="main-content" tabIndex={-1} className={`relative z-10 ${isHome ? '' : 'pt-20'}`}>
      <PageTransition>
        <Suspense fallback={<div role="status" className="min-h-[70vh] flex items-center justify-center text-muted-foreground">Loading page…</div>}>
          <Routes><Route path="/" element={<Index />} /><Route path="/about" element={<About />} /><Route path="/projects" element={<Projects />} /><Route path="/skills" element={<Skills />} /><Route path="/contact" element={<Contact />} /><Route path="*" element={<NotFound />} /></Routes>
        </Suspense>
      </PageTransition>
    </main>
  </div>;
};
const App = () => <QueryClientProvider client={queryClient}><TooltipProvider><MotionConfig reducedMotion="user"><Toaster /><Sonner /><BrowserRouter><AppContent /></BrowserRouter></MotionConfig></TooltipProvider></QueryClientProvider>;
export default App;
