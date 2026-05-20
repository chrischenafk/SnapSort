import { extractFromText } from "@lib/extractionClient";
import { clearDraft, getSettings, saveDraft } from "@lib/storage";
import type { EventDraft } from "@shared/types";

const CONTEXT_MENU_ID = "snapsort.create-event";

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

async function openSnapSortPanel(tabId: number): Promise<void> {
  await chrome.sidePanel.setOptions({
    tabId,
    path: "sidepanel.html",
    enabled: true
  });
  await chrome.sidePanel.open({ tabId });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Create Calendar Event with SnapSort",
    contexts: ["selection"]
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) {
    return;
  }
  await openSnapSortPanel(tab.id);
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id || !info.selectionText) {
    return;
  }

  const tabId = tab.id;
  const selectionText = info.selectionText;

  // sidePanel.open() must run before other awaits or Chrome drops the user gesture.
  try {
    await openSnapSortPanel(tabId);
  } catch (error) {
    console.error("SnapSort failed to open side panel:", error);
    return;
  }

  await saveDraft(createPendingDraft(selectionText, tab.url, tab.title));

  try {
    const settings = await getSettings();
    const extraction = await extractFromText({
      text: selectionText,
      pageTitle: tab.title,
      sourceUrl: tab.url,
      timeZone: settings.defaultTimeZone,
      currentDate: new Date().toISOString().slice(0, 10)
    });

    const draft = createDraftFromExtraction(extraction.event, selectionText, tab.url, tab.title);
    await saveDraft({
      ...draft,
      warnings: mergeWarnings(draft.warnings, extraction.warnings)
    });
  } catch (error) {
    console.error("SnapSort text extraction failed:", error);
    await saveDraft({
      ...createPendingDraft(selectionText, tab.url, tab.title),
      warnings: ["Failed to extract event details. Make sure the backend is running on http://localhost:8787."]
    });
  }
});
