import { useEffect, useMemo, useState } from "react";
import { EventForm } from "./components/EventForm";
import { createGoogleCalendarEvent } from "@lib/calendarApi";
import { clearDraft, DRAFT_STORAGE_KEY, getDraft, saveDraft } from "@lib/storage";
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
  const [captureStatus, setCaptureStatus] = useState<"idle" | "starting" | "error">("idle");
  const [captureError, setCaptureError] = useState<string>();
  const [showCaptureHint, setShowCaptureHint] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string>();
  const [savedEventLink, setSavedEventLink] = useState<string>();
  const isExtracting = status === "ready" && Boolean((draft.sourceText?.trim() || draft.sourceImageBase64) && !draft.title.trim());

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
    return draft.sourceText?.trim() || "No selected text captured yet.";
  }, [draft.sourceText]);

  const handleDiscard = async (): Promise<void> => {
    await clearDraft();
    setDraft(createEmptyDraft());
    setSaveStatus("idle");
    setSaveError(undefined);
    setSavedEventLink(undefined);
  };

  const handleDraftChange = (nextDraft: EventDraft): void => {
    setDraft(nextDraft);
    void saveDraft(nextDraft);
    if (saveStatus !== "idle") {
      setSaveStatus("idle");
      setSaveError(undefined);
      setSavedEventLink(undefined);
    }
  };

  const handleSaveToGoogleCalendar = async (): Promise<void> => {
    setSaveStatus("saving");
    setSaveError(undefined);
    setSavedEventLink(undefined);

    try {
      const result = await createGoogleCalendarEvent(draft);
      setSaveStatus("saved");
      setSavedEventLink(result.htmlLink);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save event to Google Calendar.";
      setSaveStatus("error");
      setSaveError(message);
    }
  };

  const handleStartScreenshotCapture = async (): Promise<void> => {
    setShowCaptureHint(true);
    setCaptureStatus("starting");
    setCaptureError(undefined);

    try {
      const response = (await chrome.runtime.sendMessage({
        type: "SNAPSORT_START_SCREENSHOT_MODE"
      })) as { ok?: boolean; error?: string } | undefined;

      if (!response?.ok) {
        throw new Error(response?.error || "Failed to start screenshot mode.");
      }

      setCaptureStatus("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start screenshot mode.";
      setCaptureStatus("error");
      setCaptureError(message);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white p-4 text-slate-900">
      <header className="mb-4 border-b border-slate-200 pb-3">
        <h1 className="text-xl font-semibold">SnapSort</h1>
        <p className="mt-1 text-sm text-slate-600">Review extracted details before saving to Google Calendar.</p>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => void handleStartScreenshotCapture()}
            disabled={captureStatus === "starting"}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {captureStatus === "starting" ? "Starting capture..." : "Capture Screenshot"}
          </button>
          {showCaptureHint && <p className="mt-2 text-xs text-slate-600">Drag over event details on the page. Press Esc to cancel.</p>}
          {captureStatus === "error" && captureError && <p className="mt-1 text-xs text-rose-700">{captureError}</p>}
        </div>
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
            {draft.sourceType === "screenshot" && draft.sourceImageBase64 ? (
              <img src={draft.sourceImageBase64} alt="Screenshot source preview" className="mt-2 max-h-56 w-full rounded-md border border-slate-200 object-contain" />
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{sourcePreview}</p>
            )}
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

          <EventForm draft={draft} onDraftChange={handleDraftChange} />

          {saveStatus === "saved" && (
            <section className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <p>Event saved to Google Calendar.</p>
              {savedEventLink && (
                <a href={savedEventLink} target="_blank" rel="noreferrer" className="mt-1 inline-block font-medium underline">
                  Open in Google Calendar
                </a>
              )}
            </section>
          )}

          {saveStatus === "error" && saveError && (
            <section className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
              {saveError}
            </section>
          )}

          <footer className="mt-5 flex items-center justify-between">
            <button type="button" className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50" onClick={() => void handleDiscard()}>
              Discard
            </button>
            <button
              type="button"
              disabled={saveStatus === "saving"}
              onClick={() => void handleSaveToGoogleCalendar()}
              className="rounded-md bg-snapsortBlue px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveStatus === "saving" ? "Saving..." : "Save to Google Calendar"}
            </button>
          </footer>
        </>
      )}
    </main>
  );
}
