import { extractFromText } from "@lib/extractionClient";
import { clearDraft, getSettings, saveDraft } from "@lib/storage";
import type { EventDraft } from "@shared/types";

const CONTEXT_MENU_ID = "snapsort.create-event";

function mergeWarnings(...warningSets: Array<string[] | undefined>): string[] {
  return [...new Set(warningSets.flatMap((warnings) => warnings ?? []))];
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

  const settings = await getSettings();
  await openSnapSortPanel(tab.id);

  try {
    const extraction = await extractFromText({
      text: info.selectionText,
      pageTitle: tab.title,
      sourceUrl: tab.url,
      timeZone: settings.defaultTimeZone,
      currentDate: new Date().toISOString().slice(0, 10)
    });

    const draft = createDraftFromExtraction(extraction.event, info.selectionText, tab.url, tab.title);
    await saveDraft({
      ...draft,
      warnings: mergeWarnings(draft.warnings, extraction.warnings)
    });
  } catch (_error) {
    await clearDraft();
  }
});
