import { extractFromImage, extractFromText } from "@lib/extractionClient";
import { getSettings, saveDraft } from "@lib/storage";
import type { EventDraft } from "@shared/types";

const CONTEXT_MENU_ID = "snapsort.create-event";
const SIDE_PANEL_PATH = "sidepanel.html";

type ScreenshotSelectionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  devicePixelRatio: number;
};

type RuntimeRequestMessage =
  | { type: "SNAPSORT_START_SCREENSHOT_MODE" }
  | { type: "SNAPSORT_SCREENSHOT_SELECTED"; rect: ScreenshotSelectionRect };

function mergeWarnings(...warningSets: Array<string[] | undefined>): string[] {
  return [...new Set(warningSets.flatMap((warnings) => warnings ?? []))];
}

function createPendingDraft(sourceText: string, sourceUrl?: string, pageTitle?: string): EventDraft {
  return {
    id: crypto.randomUUID(),
    title: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "",
    endTime: "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: "",
    description: "",
    isAllDay: false,
    calendarId: "primary",
    sourceType: "selected_text",
    sourceText,
    sourceUrl,
    pageTitle,
    warnings: [],
    createdAt: new Date().toISOString()
  };
}

function createDraftFromExtraction(
  extractedEvent: Omit<EventDraft, "id" | "sourceType" | "createdAt">,
  sourceText: string,
  sourceUrl?: string,
  pageTitle?: string
): EventDraft {
  return {
    id: crypto.randomUUID(),
    ...extractedEvent,
    sourceType: "selected_text",
    sourceText,
    sourceUrl,
    pageTitle,
    createdAt: new Date().toISOString(),
    warnings: extractedEvent.warnings ?? []
  };
}

function createPendingScreenshotDraft(sourceImageBase64: string): EventDraft {
  return {
    id: crypto.randomUUID(),
    title: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "",
    endTime: "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: "",
    description: "",
    isAllDay: false,
    calendarId: "primary",
    sourceType: "screenshot",
    sourceImageBase64,
    warnings: ["Extracting event details from screenshot..."],
    createdAt: new Date().toISOString()
  };
}

function createScreenshotDraftFromExtraction(
  extractedEvent: Omit<EventDraft, "id" | "sourceType" | "createdAt">,
  sourceImageBase64: string
): EventDraft {
  return {
    id: crypto.randomUUID(),
    ...extractedEvent,
    sourceType: "screenshot",
    sourceImageBase64,
    createdAt: new Date().toISOString(),
    warnings: extractedEvent.warnings ?? []
  };
}

function openSidePanelForTab(tab: chrome.tabs.Tab): void {
  if (tab.windowId !== undefined) {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch((error) => {
      console.warn("SnapSort: sidePanel.open:", error);
    });
    return;
  }

  if (tab.id !== undefined) {
    chrome.sidePanel.open({ tabId: tab.id }).catch((error) => {
      console.warn("SnapSort: sidePanel.open:", error);
    });
  }
}

async function configureSnapSortPanel(tabId: number): Promise<void> {
  await chrome.sidePanel.setOptions({
    tabId,
    path: SIDE_PANEL_PATH,
    enabled: true
  });
}

async function enableSidePanelOnActionClick(): Promise<void> {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

async function processSelectedText(
  tabId: number,
  selectionText: string,
  sourceUrl?: string,
  pageTitle?: string
): Promise<void> {
  await configureSnapSortPanel(tabId);
  await saveDraft(createPendingDraft(selectionText, sourceUrl, pageTitle));

  try {
    const settings = await getSettings();
    const extraction = await extractFromText({
      text: selectionText,
      pageTitle,
      sourceUrl,
      timeZone: settings.defaultTimeZone,
      currentDate: new Date().toISOString().slice(0, 10)
    });

    const draft = createDraftFromExtraction(extraction.event, selectionText, sourceUrl, pageTitle);
    await saveDraft({
      ...draft,
      warnings: mergeWarnings(draft.warnings, extraction.warnings)
    });
  } catch (error) {
    console.error("SnapSort text extraction failed:", error);
    await saveDraft({
      ...createPendingDraft(selectionText, sourceUrl, pageTitle),
      warnings: ["Failed to extract event details. Make sure the backend is running on http://localhost:8787."]
    });
  }
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((response) => response.blob());
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function cropScreenshotDataUrl(dataUrl: string, rect: ScreenshotSelectionRect): Promise<string> {
  if (typeof OffscreenCanvas === "undefined") {
    throw new Error("Screenshot cropping is not supported in this browser context.");
  }

  const imageBlob = await dataUrlToBlob(dataUrl);
  const imageBitmap = await createImageBitmap(imageBlob);

  const dpr = rect.devicePixelRatio > 0 ? rect.devicePixelRatio : 1;
  const sourceX = Math.max(0, Math.round(rect.x * dpr));
  const sourceY = Math.max(0, Math.round(rect.y * dpr));
  const sourceWidth = Math.max(1, Math.round(rect.width * dpr));
  const sourceHeight = Math.max(1, Math.round(rect.height * dpr));

  const clampedWidth = Math.min(sourceWidth, imageBitmap.width - sourceX);
  const clampedHeight = Math.min(sourceHeight, imageBitmap.height - sourceY);

  if (clampedWidth <= 0 || clampedHeight <= 0) {
    throw new Error("Screenshot selection is outside of the visible viewport.");
  }

  const canvas = new OffscreenCanvas(clampedWidth, clampedHeight);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to initialize screenshot crop context.");
  }

  context.drawImage(imageBitmap, sourceX, sourceY, clampedWidth, clampedHeight, 0, 0, clampedWidth, clampedHeight);
  const croppedBlob = await canvas.convertToBlob({ type: "image/png" });
  const croppedBuffer = await croppedBlob.arrayBuffer();
  const croppedBase64 = arrayBufferToBase64(croppedBuffer);

  imageBitmap.close();
  return `data:image/png;base64,${croppedBase64}`;
}

async function processScreenshotSelection(tab: chrome.tabs.Tab, rect: ScreenshotSelectionRect): Promise<void> {
  if (tab.id === undefined) {
    throw new Error("Unable to process screenshot: missing tab id.");
  }

  await configureSnapSortPanel(tab.id);

  if (tab.windowId === undefined) {
    throw new Error("Unable to process screenshot: missing window id.");
  }

  const visibleCapture = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  const croppedImageDataUrl = await cropScreenshotDataUrl(visibleCapture, rect);
  const pendingDraft = createPendingScreenshotDraft(croppedImageDataUrl);
  await saveDraft(pendingDraft);

  try {
    const settings = await getSettings();
    const extraction = await extractFromImage({
      imageBase64: croppedImageDataUrl,
      timeZone: settings.defaultTimeZone,
      currentDate: new Date().toISOString().slice(0, 10)
    });

    const draft = createScreenshotDraftFromExtraction(extraction.event, croppedImageDataUrl);
    await saveDraft({
      ...draft,
      warnings: mergeWarnings(draft.warnings, extraction.warnings)
    });
  } catch (error) {
    console.error("SnapSort screenshot extraction failed:", error);
    await saveDraft({
      ...pendingDraft,
      warnings: ["Failed to extract event details from screenshot. Make sure the backend is running on http://localhost:8787."]
    });
  }
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tabs[0] ?? null;
}

async function startScreenshotModeFromSidePanel(): Promise<void> {
  const activeTab = await getActiveTab();
  if (!activeTab || activeTab.id === undefined) {
    throw new Error("No active tab found to start screenshot capture.");
  }

  await configureSnapSortPanel(activeTab.id);
  openSidePanelForTab(activeTab);
  await chrome.tabs.sendMessage(activeTab.id, { type: "SNAPSORT_SCREENSHOT_START" });
}

chrome.runtime.onInstalled.addListener(() => {
  void enableSidePanelOnActionClick().catch((error) => {
    console.warn("SnapSort: failed to enable openPanelOnActionClick:", error);
  });

  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Create Calendar Event with SnapSort",
    contexts: ["selection"]
  });
});

// Toolbar icon: Chrome opens the side panel via setPanelBehavior (proper user gesture).
// No manual sidePanel.open() here — that caused uncaught gesture errors.

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id || !info.selectionText) {
    return;
  }

  // sidePanel.open() must run synchronously in this user-gesture handler before
  // any async work (storage/fetch/promise chains), or Chrome rejects it.
  openSidePanelForTab(tab);

  const tabId = tab.id;
  const selectionText = info.selectionText;
  const sourceUrl = tab.url;
  const pageTitle = tab.title;

  void processSelectedText(tabId, selectionText, sourceUrl, pageTitle);
});

chrome.runtime.onMessage.addListener((message: RuntimeRequestMessage, sender, sendResponse) => {
  if (message.type === "SNAPSORT_START_SCREENSHOT_MODE") {
    void startScreenshotModeFromSidePanel()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        const errorMessage = error instanceof Error ? error.message : "Failed to start screenshot mode.";
        sendResponse({ ok: false, error: errorMessage });
      });
    return true;
  }

  if (message.type === "SNAPSORT_SCREENSHOT_SELECTED") {
    if (!sender.tab) {
      void saveDraft({
        ...createPendingDraft(""),
        warnings: ["Failed to capture screenshot: missing sender tab context."]
      });
      return false;
    }

    void processScreenshotSelection(sender.tab, message.rect).catch((error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to process screenshot selection.";
      void saveDraft({
        ...createPendingScreenshotDraft(""),
        warnings: [errorMessage]
      });
    });
  }

  return false;
});
