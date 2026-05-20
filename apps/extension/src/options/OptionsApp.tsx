import { FormEvent, useEffect, useState } from "react";
import { getSettings, saveSettings } from "@lib/storage";
import type { UserSettings } from "@shared/types";

const initialSettings: UserSettings = {
  defaultCalendarId: "primary",
  defaultTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  defaultDurationMinutes: 60,
  includeSourceInDescription: true,
  customInstructions: ""
};

export function OptionsApp(): JSX.Element {
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    const load = async (): Promise<void> => {
      const stored = await getSettings();
      setSettings(stored);
    };
    void load();
  }, []);

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setStatus("saving");
    await saveSettings(settings);
    setStatus("saved");
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">SnapSort Settings</h1>
      <p className="mb-5 text-sm text-slate-600">These defaults are used when SnapSort prepares an event draft.</p>

      <form className="grid gap-4" onSubmit={(event) => void onSubmit(event)}>
        <label className="fieldLabel">
          Default Timezone
          <input
            className="fieldInput"
            value={settings.defaultTimeZone}
            onChange={(event) => setSettings({ ...settings, defaultTimeZone: event.target.value })}
          />
        </label>

        <label className="fieldLabel">
          Default duration in minutes
          <input
            type="number"
            className="fieldInput"
            value={settings.defaultDurationMinutes}
            onChange={(event) => setSettings({ ...settings, defaultDurationMinutes: Number(event.target.value) || 60 })}
          />
        </label>

        <label className="fieldLabel">
          <span className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.includeSourceInDescription}
              onChange={(event) => setSettings({ ...settings, includeSourceInDescription: event.target.checked })}
            />
            Include source text in description
          </span>
        </label>

        <label className="fieldLabel">
          Custom instructions (MVP placeholder)
          <textarea
            className="fieldInput min-h-24"
            value={settings.customInstructions ?? ""}
            onChange={(event) => setSettings({ ...settings, customInstructions: event.target.value })}
            placeholder="Examples: prefer concise titles, keep room numbers in location"
          />
        </label>

        <button type="submit" className="w-fit rounded-md bg-snapsortBlue px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Save Settings
        </button>

        {status === "saved" && <p className="text-sm text-emerald-700">Settings saved.</p>}
      </form>
    </main>
  );
}
