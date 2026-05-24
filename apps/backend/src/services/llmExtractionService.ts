import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";
import type { ExtractImageRequest, ExtractTextRequest, ExtractionResponse } from "../schemas/eventSchema.js";
import { extractionResponseSchema } from "../schemas/eventSchema.js";
import { addMinutesToTime } from "../utils/dateUtils.js";

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";
const MOCK_MODE_WARNING = "Mock extraction is active. Configure ANTHROPIC_API_KEY and set USE_MOCK_EXTRACTION=false to use Claude extraction.";

type SupportedImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
type ClaudeMessageLike = {
  content: Array<{ type: string; text?: string }>;
};

function shouldUseMockExtraction(): boolean {
  return process.env.USE_MOCK_EXTRACTION === "true" || !process.env.ANTHROPIC_API_KEY;
}

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || shouldUseMockExtraction()) {
    return null;
  }
  return new Anthropic({ apiKey });
}

function normalizeImageMediaType(mediaType?: string): SupportedImageMediaType {
  if (mediaType === "image/jpeg" || mediaType === "image/png" || mediaType === "image/gif" || mediaType === "image/webp") {
    return mediaType;
  }
  return "image/png";
}

function parseImageInput(imageBase64OrDataUrl: string): { data: string; mediaType: SupportedImageMediaType } {
  const dataUrlMatch = imageBase64OrDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return {
      mediaType: normalizeImageMediaType(dataUrlMatch[1]),
      data: dataUrlMatch[2]
    };
  }

  return {
    mediaType: "image/png",
    data: imageBase64OrDataUrl
  };
}

function parseClaudeJson(rawText: string): unknown {
  const direct = rawText.trim();
  try {
    return JSON.parse(direct);
  } catch {
    const start = direct.indexOf("{");
    const end = direct.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Claude response did not contain JSON.");
    }

    const candidate = direct.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      throw new Error("Claude response JSON parsing failed.");
    }
  }
}

function getClaudeTextContent(response: ClaudeMessageLike): string {
  const textParts = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text?.trim() ?? "")
    .filter(Boolean);

  if (textParts.length === 0) {
    throw new Error("Claude response did not include text output.");
  }

  return textParts.join("\n");
}

function buildInstructionBlock(request: ExtractTextRequest | ExtractImageRequest): string {
  const defaultDurationMinutes = request.defaultDurationMinutes ?? 60;
  const includeSourceInDescription = request.includeSourceInDescription ?? true;
  const customInstructions = request.customInstructions?.trim() || "(none)";

  return [
    "You extract ONE calendar event and return ONLY valid JSON with this shape:",
    "{\"event\":{\"title\":\"string\",\"date\":\"YYYY-MM-DD\",\"startTime\":\"HH:mm(optional)\",\"endTime\":\"HH:mm(optional)\",\"timeZone\":\"string\",\"location\":\"string(optional)\",\"description\":\"string(optional)\",\"isAllDay\":true|false,\"calendarId\":\"primary\",\"warnings\":[\"...\"],\"confidence\":{\"title\":0-1,\"date\":0-1,\"startTime\":0-1,\"endTime\":0-1,\"location\":0-1}},\"warnings\":[\"...\"],\"rawModelOutput\":null}",
    "Return JSON only. No markdown fences.",
    "Do not hallucinate details not present in source content.",
    "If end time is missing for a timed event, infer it using defaultDurationMinutes and add warning.",
    "If year is missing, infer from currentDate and add warning.",
    "If date/time is ambiguous, choose the most likely interpretation and add warning.",
    "If this appears to be a deadline without a specific time, set isAllDay=true.",
    "If no clear event is found, return minimal draft using currentDate and add warning.",
    "Use provided timeZone when source has no timezone.",
    "Use customInstructions only when they do not conflict with source content. If conflict exists, source content wins and add warning.",
    `currentDate=${request.currentDate}`,
    `timeZone=${request.timeZone}`,
    `defaultDurationMinutes=${defaultDurationMinutes}`,
    `includeSourceInDescription=${includeSourceInDescription}`,
    `customInstructions=${customInstructions}`
  ].join("\n");
}

function mockExtractFromText(request: ExtractTextRequest): ExtractionResponse {
  const defaultStart = "17:00";
  const includeSourceDescription = request.includeSourceInDescription ?? true;

  const response: ExtractionResponse = {
    event: {
      title: "Extracted Event",
      date: request.currentDate,
      startTime: defaultStart,
      endTime: addMinutesToTime(defaultStart, request.defaultDurationMinutes ?? 60),
      timeZone: request.timeZone,
      location: "Location from selected text",
      description: includeSourceDescription ? request.text : "Description omitted by includeSourceInDescription setting.",
      isAllDay: false,
      calendarId: "primary",
      warnings: [MOCK_MODE_WARNING]
    },
    warnings: [MOCK_MODE_WARNING],
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
      endTime: addMinutesToTime("17:00", request.defaultDurationMinutes ?? 60),
      timeZone: request.timeZone,
      location: "Location from screenshot",
      description: "Mock event extracted from screenshot.",
      isAllDay: false,
      calendarId: "primary",
      warnings: [MOCK_MODE_WARNING]
    },
    warnings: [MOCK_MODE_WARNING],
    rawModelOutput: null
  };

  return extractionResponseSchema.parse(response);
}

async function claudeExtractFromText(request: ExtractTextRequest, anthropicClient: Anthropic): Promise<ExtractionResponse> {
  const instructionBlock = buildInstructionBlock(request);
  const includeSourceDescription = request.includeSourceInDescription ?? true;

  const prompt = [
    instructionBlock,
    "",
    "Source context:",
    `pageTitle=${request.pageTitle ?? "(none)"}`,
    `sourceUrl=${request.sourceUrl ?? "(none)"}`,
    "selectedText:",
    request.text,
    "",
    includeSourceDescription ? "Prefer preserving source text details in description where useful." : "Keep description concise; do not copy full source text unless essential."
  ].join("\n");

  const response = await anthropicClient.messages.create({
    model: process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
    max_tokens: 1200,
    temperature: 0.1,
    stream: false,
    messages: [{ role: "user", content: prompt }]
  });

  const rawText = getClaudeTextContent(response as ClaudeMessageLike);
  const parsedJson = parseClaudeJson(rawText);
  const validated = extractionResponseSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error("Claude text extraction returned invalid response schema.");
  }

  return {
    ...validated.data,
    rawModelOutput: response
  };
}

async function claudeExtractFromImage(request: ExtractImageRequest, anthropicClient: Anthropic): Promise<ExtractionResponse> {
  const instructionBlock = buildInstructionBlock(request);
  const parsedImage = parseImageInput(request.imageBase64);

  const messageContent: MessageParam["content"] = [
    {
      type: "text",
      text: [
        instructionBlock,
        "",
        "Image context rules:",
        "- Extract the most likely single calendar event from the screenshot/flyer/image.",
        "- If multiple events are visible, choose the most prominent one and add warning.",
        "- If details are unreadable, return minimal draft with warning instead of hallucinating."
      ].join("\n")
    },
    {
      type: "image",
      source: {
        type: "base64",
        media_type: parsedImage.mediaType,
        data: parsedImage.data
      }
    }
  ];

  const response = await anthropicClient.messages.create({
    model: process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
    max_tokens: 1200,
    temperature: 0.1,
    stream: false,
    messages: [{ role: "user", content: messageContent }]
  });

  const rawText = getClaudeTextContent(response as ClaudeMessageLike);
  const parsedJson = parseClaudeJson(rawText);
  const validated = extractionResponseSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error("Claude image extraction returned invalid response schema.");
  }

  return {
    ...validated.data,
    rawModelOutput: response
  };
}

export async function extractEventFromText(request: ExtractTextRequest): Promise<ExtractionResponse> {
  const anthropicClient = getAnthropicClient();
  if (!anthropicClient) {
    return mockExtractFromText(request);
  }

  return claudeExtractFromText(request, anthropicClient);
}

export async function extractEventFromImage(request: ExtractImageRequest): Promise<ExtractionResponse> {
  const anthropicClient = getAnthropicClient();
  if (!anthropicClient) {
    return mockExtractFromImage(request);
  }

  return claudeExtractFromImage(request, anthropicClient);
}
