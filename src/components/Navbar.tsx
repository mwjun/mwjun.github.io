import { useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "About", path: "/about" },
  { label: "Projects", path: "/projects" },
  { label: "Skills", path: "/skills" },
  { label: "Contact", path: "/contact" },
];

const NavLink = ({
  item,
  isActive,
  onClick,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
  onClick: () => void;
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {isActive && (
      <motion.div
        layoutId="nav-indicator"
        className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20 -z-10"
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    )}
    {item.label}
  </motion.button>
);

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (path: string) => {
    window.scrollTo(0, 0);
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-5 backdrop-blur-lg bg-background/70 border-b border-border/30"
      style={{ willChange: "transform" }}
      aria-label="Main navigation"
    >
      <motion.div
        className="text-2xl font-bold text-gradient cursor-pointer select-none"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400 }}
        onClick={() => {
          window.scrollTo(0, 0);
          navigate("/");
        }}
        onKeyDown={(e) => e.key === "Enter" && (window.scrollTo(0, 0), navigate("/"))}
        role="button"
        tabIndex={0}
        aria-label="Matthew Jun - Home"
      >
        MJ
      </motion.div>

      {/* Desktop nav */}
      <LayoutGroup>
        <div className="hidden sm:flex relative gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              isActive={location.pathname === item.path}
              onClick={() => {
                window.scrollTo(0, 0);
                navigate(item.path);
              }}
            />
          ))}
        </div>
      </LayoutGroup>

      {/* Mobile menu - only render when tabs are hidden */}
      <div className="sm:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
        <SheetContent side="right" className="w-[280px] sm:w-[320px]">
          <SheetHeader>
            <SheetTitle className="text-left">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 mt-8">
            <button
              onClick={() => handleNavClick("/")}
              className={`text-left px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                location.pathname === "/"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              Home
            </button>
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.path)}
                className={`text-left px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navbar;
