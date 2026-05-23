export type ScreenshotSelection = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export function startScreenshotOverlay(): void {
  // Milestone 6 will implement overlay rendering and selection behavior.
  // Placeholder exists so content script can call a typed entrypoint.
  console.debug("SnapSort screenshot overlay placeholder started.");
}

export function cancelScreenshotOverlay(): void {
  console.debug("SnapSort screenshot overlay placeholder cancelled.");
}
