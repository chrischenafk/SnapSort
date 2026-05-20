import type { ExtractImageRequest, ExtractTextRequest, ExtractionResponse } from "../schemas/eventSchema.js";
import { extractionResponseSchema } from "../schemas/eventSchema.js";
import { addMinutesToTime } from "../utils/dateUtils.js";

function mockExtractFromText(request: ExtractTextRequest): ExtractionResponse {
  const defaultStart = "17:00";

  const response: ExtractionResponse = {
    event: {
      title: "Extracted Event",
      date: request.currentDate,
      startTime: defaultStart,
      endTime: addMinutesToTime(defaultStart, 60),
      timeZone: request.timeZone,
      location: "Location from selected text",
      description: request.text,
      isAllDay: false,
      calendarId: "primary",
      warnings: ["End time was inferred as 1 hour after start time."]
    },
    warnings: ["Mock extraction result. Real AI extraction will be added later."],
    rawModelOutput: null
  };

  return extractionResponseSchema.parse(response);
}

function mockExtractFromImage(request: ExtractImageRequest): ExtractionResponse {
  const response: ExtractionResponse = {
    event: {
      title: "Image Extracted Event",
      date: request.currentDate,
      startTime: "09:00",
      endTime: "10:00",
      timeZone: request.timeZone,
      location: "",
      description: "Generated from screenshot extraction placeholder.",
      isAllDay: false,
      calendarId: "primary",
      warnings: ["This event is from screenshot placeholder extraction."]
    },
    warnings: ["Image extraction is currently mocked."],
    rawModelOutput: null
  };

  return extractionResponseSchema.parse(response);
}

export async function extractEventFromText(request: ExtractTextRequest): Promise<ExtractionResponse> {
  return mockExtractFromText(request);
}

export async function extractEventFromImage(request: ExtractImageRequest): Promise<ExtractionResponse> {
  return mockExtractFromImage(request);
}
