import { useEffect, useMemo, useState } from "react";
import { EventForm } from "./components/EventForm";
import { clearDraft, DRAFT_STORAGE_KEY, getDraft } from "@lib/storage";
import type { EventDraft } from "@shared/types";

function createEmptyDraft(): EventDraft {
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
    sourceText: "",
    warnings: [],
    createdAt: new Date().toISOString()
  };
}

export function SidePanelApp(): JSX.Element {
  const [draft, setDraft] = useState<EventDraft>(createEmptyDraft);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("loading");
  const isExtracting = status === "ready" && Boolean(draft.sourceText?.trim()) && !draft.title.trim();

  useEffect(() => {
    const hydrateDraft = async (): Promise<void> => {
      const storedDraft = await getDraft();
      if (storedDraft) {
        setDraft(storedDraft);
      }
      setStatus("ready");
    };

    const onDraftStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ): void => {
      if (areaName !== "session" || !changes[DRAFT_STORAGE_KEY]) {
        return;
      }

      const nextDraft = changes[DRAFT_STORAGE_KEY].newValue as EventDraft | undefined;
      if (nextDraft) {
        setDraft(nextDraft);
        setStatus("ready");
      }
    };

    void hydrateDraft();
    chrome.storage.onChanged.addListener(onDraftStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(onDraftStorageChange);
    };
  }, []);

  const sourcePreview = useMemo(() => {
    if (draft.sourceType === "screenshot") {
      return "Screenshot source preview will appear here in Milestone 6.";
    }
    return draft.sourceText?.trim() || "No selected text captured yet.";
  }, [draft.sourceText, draft.sourceType]);

  const handleDiscard = async (): Promise<void> => {
    await clearDraft();
    setDraft(createEmptyDraft());
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white p-4 text-slate-900">
      <header className="mb-4 border-b border-slate-200 pb-3">
        <h1 className="text-xl font-semibold">SnapSort</h1>
        <p className="mt-1 text-sm text-slate-600">Review extracted details before saving to Google Calendar.</p>
      </header>

      {status === "loading" ? (
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">Loading event draft...</section>
      ) : (
        <>
          {isExtracting && (
            <section className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              Extracting event details from selected text...
            </section>
          )}

          <section className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3">
            <h2 className="text-sm font-medium text-slate-700">Source Preview</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{sourcePreview}</p>
          </section>

          {draft.warnings.length > 0 && (
            <section className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <h2 className="font-medium">Extraction Warnings</h2>
              <ul className="mt-2 list-disc pl-5">
                {draft.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </section>
          )}

          <EventForm draft={draft} onDraftChange={setDraft} />

          <footer className="mt-5 flex items-center justify-between">
            <button type="button" className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50" onClick={() => void handleDiscard()}>
              Discard
            </button>
            <button type="button" className="rounded-md bg-snapsortBlue px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Save to Google Calendar
            </button>
          </footer>
        </>
      )}
    </main>
  );
}
