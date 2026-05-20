import { z } from "zod";

export const confidenceSchema = z.object({
  title: z.number().min(0).max(1).optional(),
  date: z.number().min(0).max(1).optional(),
  startTime: z.number().min(0).max(1).optional(),
  endTime: z.number().min(0).max(1).optional(),
  location: z.number().min(0).max(1).optional()
});

export const eventDraftSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timeZone: z.string().min(1),
  location: z.string().optional(),
  description: z.string().optional(),
  isAllDay: z.boolean(),
  calendarId: z.string().min(1),
  sourceType: z.enum(["selected_text", "screenshot"]),
  sourceText: z.string().optional(),
  sourceImageBase64: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  pageTitle: z.string().optional(),
  warnings: z.array(z.string()),
  confidence: confidenceSchema.optional(),
  createdAt: z.string()
});

export const userSettingsSchema = z.object({
  defaultCalendarId: z.string().min(1),
  defaultTimeZone: z.string().min(1),
  defaultDurationMinutes: z.number().int().positive(),
  includeSourceInDescription: z.boolean(),
  customInstructions: z.string().optional()
});

export const extractionEventSchema = eventDraftSchema.omit({
  id: true,
  sourceType: true,
  createdAt: true
});

export const extractionResponseSchema = z.object({
  event: extractionEventSchema,
  warnings: z.array(z.string()),
  rawModelOutput: z.unknown().nullable()
});
