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
      title: "Extracted Screenshot Event",
      date: request.currentDate,
      startTime: "17:00",
      endTime: "18:00",
      timeZone: request.timeZone,
      location: "Location from screenshot",
      description: "Mock event extracted from screenshot.",
      isAllDay: false,
      calendarId: "primary",
      warnings: ["Image extraction is currently using mock data."]
    },
    warnings: ["Image extraction is currently using mock data."],
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
