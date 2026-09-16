import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Menu } from "lucide-react";
import { motion, useScroll } from "framer-motion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import "@/styles/navigation.css";

// Story, Work, About, and Contact are parts of the one-page home; each home section names its part with data-nav.
const items = [
  { label: 'Story', to: '/', section: 'story' },
  { label: 'Work', to: '/#work', section: 'work' },
  { label: 'About', to: '/#about', section: 'about' },
  { label: 'Skills', to: '/skills' },
  { label: 'Contact', to: '/#contact', section: 'contact' },
];

const Navbar = () => {
  const { pathname, hash } = useLocation();
  const menuNavigated = useRef(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [homeSection, setHomeSection] = useState("story");
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    if (pathname !== "/") return;
    let frame = 0;
    // The current part is the last home section whose top has passed 45% of the way down the screen.
    const updateSection = () => {
      frame = 0;
      let current = "story";
      for (const section of document.querySelectorAll<HTMLElement>("[data-nav]")) {
        if (section.getBoundingClientRect().top <= window.innerHeight * 0.45) current = section.dataset.nav ?? current;
      }
      setHomeSection(current);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateSection);
    };
    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [pathname, hash]);

  const isActive = (item: (typeof items)[number]) => (item.section ? pathname === "/" && homeSection === item.section : pathname === item.to);

  return <header className="site-header">
    <nav className="site-nav" aria-label="Main navigation">
      <Link to="/" className="site-brand" aria-label="Matthew Jun, Home"><span className="brand-monogram">mj<span>.</span></span><span className="brand-name">Matthew Jun</span></Link>
      <div className="desktop-navigation">{items.map(item => <Link key={item.label} to={item.to} aria-current={isActive(item) ? 'page' : undefined}>{item.label}</Link>)}</div>
      <a href="/Matthew_Jun.pdf" download className="nav-resume">Résumé <ArrowUpRight size={15} /></a>
      <div className="mobile-navigation"><Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open navigation"><Menu size={23} /></Button></SheetTrigger><SheetContent side="right" className="mobile-menu" onCloseAutoFocus={(event) => { if (menuNavigated.current) { event.preventDefault(); menuNavigated.current = false; } }}><SheetHeader><SheetTitle>Matthew Jun</SheetTitle><SheetDescription>Explore the story, work, and everything in between.</SheetDescription></SheetHeader><div className="mobile-menu-links">{items.map(item => <Link key={item.label} to={item.to} aria-current={isActive(item) ? 'page' : undefined} onClick={() => { menuNavigated.current = true; setMobileOpen(false); }}>{item.label}<ArrowUpRight size={20} /></Link>)}<a href="/Matthew_Jun.pdf" download onClick={() => setMobileOpen(false)}>Download résumé <ArrowUpRight size={20} /></a></div></SheetContent></Sheet></div>
    </nav>
    <motion.div className="reading-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
  </header>;
};
export default Navbar;
