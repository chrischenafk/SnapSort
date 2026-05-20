import React from "react";
import { createRoot } from "react-dom/client";
import { OptionsApp } from "./OptionsApp";
import "../sidepanel/styles.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Unable to find options root element.");
}

createRoot(container).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>
);
