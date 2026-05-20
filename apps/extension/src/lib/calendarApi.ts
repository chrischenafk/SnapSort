import type { EventDraft } from "@shared/types";

export type CalendarInsertResult = {
  eventId: string;
  htmlLink?: string;
};

export async function createGoogleCalendarEvent(_eventDraft: EventDraft): Promise<CalendarInsertResult> {
  throw new Error("Google Calendar insert is not implemented yet. This is planned for Milestone 5.");
}
