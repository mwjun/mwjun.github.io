import { ReactNode } from "react";
import ParticleField from "@/components/ParticleField";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";

const PageLayout = ({ children }: { children: ReactNode }) => (
  <div className="relative min-h-screen bg-background noise-bg grid-bg">
    <ParticleField />
    <Navbar />
    <main className="relative z-10 pt-20">
      <PageTransition>{children}</PageTransition>
    </main>
  </div>
);

export default PageLayout;
