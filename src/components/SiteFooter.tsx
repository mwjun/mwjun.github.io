import { ArrowUp } from "lucide-react";
import "@/styles/site-footer.css";

export default function SiteFooter({ topHref = "#top" }: { topHref?: string }) {
  return (
    <footer className="site-footer">
      <a href={topHref} className="footer-name">Matthew Jun<span>Thoughtfully engineered.</span></a>
      <p>© {new Date().getFullYear()} Matthew Jun</p>
      <a href={topHref} className="back-to-top">Back to top <ArrowUp size={15} aria-hidden="true" /></a>
    </footer>
  );
}
