import type { EventDraft, UserSettings } from "@shared/types";

export const SETTINGS_STORAGE_KEY = "snapsort.settings";
export const DRAFT_STORAGE_KEY = "snapsort.draft";

export const defaultSettings: UserSettings = {
  defaultCalendarId: "primary",
  defaultTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  defaultDurationMinutes: 60,
  includeSourceInDescription: true,
  customInstructions: ""
};

export async function getDraft(): Promise<EventDraft | null> {
  const stored = await chrome.storage.session.get(DRAFT_STORAGE_KEY);
  return (stored[DRAFT_STORAGE_KEY] as EventDraft | undefined) ?? null;
}

export async function saveDraft(draft: EventDraft): Promise<void> {
  await chrome.storage.session.set({ [DRAFT_STORAGE_KEY]: draft });
}

export async function clearDraft(): Promise<void> {
  await chrome.storage.session.remove(DRAFT_STORAGE_KEY);
}

export async function getSettings(): Promise<UserSettings> {
  const stored = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  const storedSettings = (stored[SETTINGS_STORAGE_KEY] as Partial<UserSettings> | undefined) ?? {};
  return {
    ...defaultSettings,
    ...storedSettings
  };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: settings });
}
