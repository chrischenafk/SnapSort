import type { EventDraft } from "@shared/types";

export type CalendarInsertResult = {
  eventId: string;
  htmlLink?: string;
};

type CalendarApiResponse = {
  id?: string;
  htmlLink?: string;
};

function requireEventBasics(draft: EventDraft): void {
  if (!draft.title.trim()) {
    throw new Error("Event title is required.");
  }

  if (!draft.date.trim()) {
    throw new Error("Event date is required.");
  }
}

function addHours(time: string, hoursToAdd: number): string {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + hoursToAdd * 60;
  const nextHours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const nextMinutes = totalMinutes % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

function addDays(isoDate: string, daysToAdd: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + daysToAdd));
  return nextDate.toISOString().slice(0, 10);
}

function createGoogleEventPayload(draft: EventDraft): Record<string, unknown> {
  requireEventBasics(draft);

  const basePayload: Record<string, unknown> = {
    summary: draft.title.trim(),
    location: draft.location?.trim() || undefined,
    description: draft.description?.trim() || undefined
  };

  if (draft.isAllDay) {
    return {
      ...basePayload,
      start: { date: draft.date },
      end: { date: addDays(draft.date, 1) }
    };
  }

  if (!draft.startTime?.trim()) {
    throw new Error("Start time is required for timed events.");
  }

  const inferredEndTime = draft.endTime?.trim() || addHours(draft.startTime, 1);
  const timeZone = draft.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    ...basePayload,
    start: {
      dateTime: `${draft.date}T${draft.startTime}:00`,
      timeZone
    },
    end: {
      dateTime: `${draft.date}T${inferredEndTime}:00`,
      timeZone
    }
  };
}

async function getAuthToken(): Promise<string> {
  const result = await chrome.identity.getAuthToken({ interactive: true });

  if (typeof result === "string" && result) {
    return result;
  }

  if (result && typeof result === "object" && "token" in result) {
    const token = result.token;
    if (typeof token === "string" && token) {
      return token;
    }
  }

  throw new Error("Google authentication failed: no auth token returned.");
}

export async function createGoogleCalendarEvent(eventDraft: EventDraft): Promise<CalendarInsertResult> {
  const token = await getAuthToken();
  const calendarId = eventDraft.calendarId?.trim() || "primary";
  const payload = createGoogleEventPayload(eventDraft);

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const detail = errorBody ? ` - ${errorBody}` : "";
    throw new Error(`Google Calendar API request failed (${response.status} ${response.statusText})${detail}`);
  }

  const data = (await response.json()) as CalendarApiResponse;
  if (!data.id) {
    throw new Error("Google Calendar API response did not include an event ID.");
  }

  return {
    eventId: data.id,
    htmlLink: data.htmlLink
  };
}
