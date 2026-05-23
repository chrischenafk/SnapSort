const OVERLAY_ID = "snapsort-screenshot-overlay";
const MIN_SELECTION_SIZE = 10;

let cleanupOverlay: (() => void) | null = null;

type Point = { x: number; y: number };

function createOverlayElements(): {
  overlay: HTMLDivElement;
  selectionBox: HTMLDivElement;
  instructions: HTMLDivElement;
} {
  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    cursor: "crosshair",
    background: "rgba(15, 23, 42, 0.35)",
    userSelect: "none"
  });

  const instructions = document.createElement("div");
  instructions.textContent = "Drag to select event details. Press Esc to cancel.";
  Object.assign(instructions.style, {
    position: "fixed",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "8px 12px",
    borderRadius: "8px",
    background: "rgba(15, 23, 42, 0.9)",
    color: "#ffffff",
    fontSize: "13px",
    fontFamily: "sans-serif"
  });

  const selectionBox = document.createElement("div");
  Object.assign(selectionBox.style, {
    position: "fixed",
    border: "2px solid #3b82f6",
    background: "rgba(59, 130, 246, 0.20)",
    pointerEvents: "none",
    display: "none"
  });

  overlay.appendChild(instructions);
  overlay.appendChild(selectionBox);
  return { overlay, selectionBox, instructions };
}

function setSelectionBox(selectionBox: HTMLDivElement, start: Point, current: Point): { x: number; y: number; width: number; height: number } {
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);

  Object.assign(selectionBox.style, {
    display: "block",
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`
  });

  return { x, y, width, height };
}

export function startScreenshotOverlay(): void {
  cancelScreenshotOverlay();

  const { overlay, selectionBox } = createOverlayElements();
  let dragStart: Point | null = null;
  let currentSelection: { x: number; y: number; width: number; height: number } | null = null;

  const onMouseDown = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    dragStart = { x: event.clientX, y: event.clientY };
    currentSelection = setSelectionBox(selectionBox, dragStart, dragStart);
  };

  const onMouseMove = (event: MouseEvent): void => {
    if (!dragStart) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    currentSelection = setSelectionBox(selectionBox, dragStart, { x: event.clientX, y: event.clientY });
  };

  const onMouseUp = (event: MouseEvent): void => {
    if (!dragStart || !currentSelection) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const finalSelection = setSelectionBox(selectionBox, dragStart, { x: event.clientX, y: event.clientY });
    const isTooSmall = finalSelection.width < MIN_SELECTION_SIZE || finalSelection.height < MIN_SELECTION_SIZE;
    const dpr = window.devicePixelRatio || 1;

    cancelScreenshotOverlay();

    if (isTooSmall) {
      return;
    }

    void chrome.runtime.sendMessage({
      type: "SNAPSORT_SCREENSHOT_SELECTED",
      rect: {
        ...finalSelection,
        devicePixelRatio: dpr
      }
    });
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    cancelScreenshotOverlay();
  };

  const preventPointer = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  overlay.addEventListener("mousedown", onMouseDown, true);
  overlay.addEventListener("mousemove", onMouseMove, true);
  overlay.addEventListener("mouseup", onMouseUp, true);
  overlay.addEventListener("click", preventPointer, true);
  overlay.addEventListener("dblclick", preventPointer, true);
  window.addEventListener("keydown", onKeyDown, true);
  document.body.appendChild(overlay);

  cleanupOverlay = () => {
    overlay.removeEventListener("mousedown", onMouseDown, true);
    overlay.removeEventListener("mousemove", onMouseMove, true);
    overlay.removeEventListener("mouseup", onMouseUp, true);
    overlay.removeEventListener("click", preventPointer, true);
    overlay.removeEventListener("dblclick", preventPointer, true);
    window.removeEventListener("keydown", onKeyDown, true);
    overlay.remove();
    cleanupOverlay = null;
  };
}

export function cancelScreenshotOverlay(): void {
  cleanupOverlay?.();
}
