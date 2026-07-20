import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import CaseStudy from "./CaseStudy";
import { initSmoothScroll } from "./lib/lenis";

initSmoothScroll();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CaseStudy />
  </StrictMode>,
);
