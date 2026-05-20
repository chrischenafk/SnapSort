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

function openSnapSortPanelFromGesture(tab: chrome.tabs.Tab): void {
  if (tab.windowId !== undefined) {
    void chrome.sidePanel.open({ windowId: tab.windowId });
    return;
  }

  if (tab.id !== undefined) {
    void chrome.sidePanel.open({ tabId: tab.id });
  }
}

async function configureSnapSortPanel(tabId: number): Promise<void> {
  await chrome.sidePanel.setOptions({
    tabId,
    path: SIDE_PANEL_PATH,
    enabled: true
  });
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
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Create Calendar Event with SnapSort",
    contexts: ["selection"]
  });
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) {
    return;
  }

  openSnapSortPanelFromGesture(tab);
  void configureSnapSortPanel(tab.id);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id || !info.selectionText) {
    return;
  }

  const tabId = tab.id;
  const selectionText = info.selectionText;
  const sourceUrl = tab.url;
  const pageTitle = tab.title;

  // open() must be invoked synchronously in this handler before any await.
  openSnapSortPanelFromGesture(tab);

  void processSelectedText(tabId, selectionText, sourceUrl, pageTitle);
});
