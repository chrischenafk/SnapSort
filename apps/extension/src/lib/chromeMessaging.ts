import type { EventDraft } from "@shared/types";

export type RuntimeMessage =
  | { type: "SNAPSORT_SELECTED_TEXT"; payload: { text: string; pageTitle?: string; sourceUrl?: string } }
  | { type: "SNAPSORT_SCREENSHOT_START" }
  | { type: "SNAPSORT_SCREENSHOT_CANCEL" }
  | { type: "SNAPSORT_EVENT_DRAFT_READY"; payload: EventDraft }
  | { type: "SNAPSORT_CLEAR_DRAFT" };

export async function sendRuntimeMessage(message: RuntimeMessage): Promise<void> {
  await chrome.runtime.sendMessage(message);
}

export function addRuntimeListener(
  listener: (
    message: RuntimeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => void
): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    listener(message as RuntimeMessage, sender, sendResponse);
    return false;
  });
}
