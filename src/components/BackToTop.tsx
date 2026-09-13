import { ArrowUp } from "lucide-react";
import "@/styles/back-to-top.css";

export default function BackToTop() {
  return (
    <div className="page-end">
      <a href="#top" className="page-back-to-top">Back to top <ArrowUp size={15} aria-hidden="true" /></a>
    </div>
  );
}
