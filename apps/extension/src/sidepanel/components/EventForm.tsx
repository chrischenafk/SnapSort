import type { ChangeEvent } from "react";
import type { EventDraft } from "@shared/types";

type EventFormProps = {
  draft: EventDraft;
  onDraftChange: (next: EventDraft) => void;
};

function handleFieldChange(
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  draft: EventDraft,
  onDraftChange: (next: EventDraft) => void
): void {
  const { name, value, type } = event.target;
  const nextValue = type === "checkbox" ? (event.target as HTMLInputElement).checked : value;
  onDraftChange({
    ...draft,
    [name]: nextValue
  });
}

export function EventForm({ draft, onDraftChange }: EventFormProps): JSX.Element {
  return (
    <form className="grid grid-cols-1 gap-3">
      <label className="fieldLabel">
        Title
        <input name="title" className="fieldInput" value={draft.title} onChange={(event) => handleFieldChange(event, draft, onDraftChange)} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="fieldLabel">
          Date
          <input name="date" type="date" className="fieldInput" value={draft.date} onChange={(event) => handleFieldChange(event, draft, onDraftChange)} />
        </label>

        <label className="fieldLabel">
          Timezone
          <input name="timeZone" className="fieldInput" value={draft.timeZone} onChange={(event) => handleFieldChange(event, draft, onDraftChange)} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="fieldLabel">
          Start Time
          <input name="startTime" type="time" className="fieldInput" value={draft.startTime ?? ""} onChange={(event) => handleFieldChange(event, draft, onDraftChange)} />
        </label>

        <label className="fieldLabel">
          End Time
          <input name="endTime" type="time" className="fieldInput" value={draft.endTime ?? ""} onChange={(event) => handleFieldChange(event, draft, onDraftChange)} />
        </label>
      </div>

      <label className="fieldLabel">
        <span className="inline-flex items-center gap-2">
          <input
            name="isAllDay"
            type="checkbox"
            checked={draft.isAllDay}
            onChange={(event) => handleFieldChange(event, draft, onDraftChange)}
          />
          All-day event
        </span>
      </label>

      <label className="fieldLabel">
        Location
        <input
          name="location"
          className="fieldInput"
          value={draft.location ?? ""}
          onChange={(event) => handleFieldChange(event, draft, onDraftChange)}
        />
      </label>

      <label className="fieldLabel">
        Description
        <textarea
          name="description"
          className="fieldInput min-h-24"
          value={draft.description ?? ""}
          onChange={(event) => handleFieldChange(event, draft, onDraftChange)}
        />
      </label>

      <label className="fieldLabel">
        Calendar
        <select name="calendarId" className="fieldInput" value={draft.calendarId} onChange={(event) => handleFieldChange(event, draft, onDraftChange)}>
          <option value="primary">Primary</option>
        </select>
      </label>
    </form>
  );
}
