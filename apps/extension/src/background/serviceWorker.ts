import { extractFromText } from "@lib/extractionClient";
import { getSettings, saveDraft } from "@lib/storage";
import type { EventDraft } from "@shared/types";

const CONTEXT_MENU_ID = "snapsort.create-event";
const SIDE_PANEL_PATH = "sidepanel.html";

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
