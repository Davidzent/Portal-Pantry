import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./pantry.css";
import PantryApp from "./PantryApp.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PantryApp />
  </StrictMode>,
);
