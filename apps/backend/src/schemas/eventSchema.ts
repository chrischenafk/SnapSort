import { z } from "zod";

export const confidenceSchema = z.object({
  title: z.number().min(0).max(1).optional(),
  date: z.number().min(0).max(1).optional(),
  startTime: z.number().min(0).max(1).optional(),
  endTime: z.number().min(0).max(1).optional(),
  location: z.number().min(0).max(1).optional()
});

export const extractedEventSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timeZone: z.string().min(1),
  location: z.string().optional(),
  description: z.string().optional(),
  isAllDay: z.boolean(),
  calendarId: z.string().min(1),
  warnings: z.array(z.string()),
  confidence: confidenceSchema.optional()
});

export const extractionResponseSchema = z.object({
  event: extractedEventSchema,
  warnings: z.array(z.string()),
  rawModelOutput: z.unknown().nullable()
});

export const extractTextRequestSchema = z.object({
  text: z.string().min(1),
  pageTitle: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  timeZone: z.string().min(1),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customInstructions: z.string().optional(),
  defaultDurationMinutes: z.number().int().positive().optional(),
  includeSourceInDescription: z.boolean().optional()
});

export const extractImageRequestSchema = z.object({
  imageBase64: z.string().min(1),
  timeZone: z.string().min(1),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customInstructions: z.string().optional(),
  defaultDurationMinutes: z.number().int().positive().optional(),
  includeSourceInDescription: z.boolean().optional()
});

export type ExtractTextRequest = z.infer<typeof extractTextRequestSchema>;
export type ExtractImageRequest = z.infer<typeof extractImageRequestSchema>;
export type ExtractionResponse = z.infer<typeof extractionResponseSchema>;
