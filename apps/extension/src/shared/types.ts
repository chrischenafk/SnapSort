export type SourceType = "selected_text" | "screenshot";

export type EventDraft = {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  timeZone: string;
  location?: string;
  description?: string;
  isAllDay: boolean;
  calendarId: string;
  sourceType: SourceType;
  sourceText?: string;
  sourceImageBase64?: string;
  sourceUrl?: string;
  pageTitle?: string;
  warnings: string[];
  confidence?: {
    title?: number;
    date?: number;
    startTime?: number;
    endTime?: number;
    location?: number;
  };
  createdAt: string;
};

export type UserSettings = {
  defaultCalendarId: string;
  defaultTimeZone: string;
  defaultDurationMinutes: number;
  includeSourceInDescription: boolean;
  customInstructions?: string;
};

export type ExtractTextRequest = {
  text: string;
  pageTitle?: string;
  sourceUrl?: string;
  timeZone: string;
  currentDate: string;
  customInstructions?: string;
  defaultDurationMinutes?: number;
  includeSourceInDescription?: boolean;
};

export type ExtractImageRequest = {
  imageBase64: string;
  timeZone: string;
  currentDate: string;
  customInstructions?: string;
  defaultDurationMinutes?: number;
  includeSourceInDescription?: boolean;
};

export type ExtractionResponse = {
  event: Omit<EventDraft, "id" | "sourceType" | "createdAt">;
  warnings: string[];
  rawModelOutput?: unknown | null;
};
