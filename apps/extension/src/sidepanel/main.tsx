import React from "react";
import { createRoot } from "react-dom/client";
import { SidePanelApp } from "./SidePanelApp";
import "./styles.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Unable to find side panel root element.");
}

createRoot(container).render(
  <React.StrictMode>
    <SidePanelApp />
  </React.StrictMode>
);
