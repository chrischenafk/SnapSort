import { extractionResponseSchema } from "@shared/eventSchema";
import type { ExtractImageRequest, ExtractTextRequest, ExtractionResponse } from "@shared/types";

const BACKEND_URL = "http://localhost:8787";

async function postJson<TRequest>(path: string, body: TRequest): Promise<ExtractionResponse> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error";
    throw new Error(`Unable to reach SnapSort backend at ${BACKEND_URL}. ${message}`);
  }

  if (!response.ok) {
    let responseText = "";
    try {
      responseText = (await response.text()).trim();
    } catch {
      responseText = "";
    }
    const details = responseText ? ` - ${responseText}` : "";
    throw new Error(`Extraction request failed (${response.status} ${response.statusText})${details}`);
  }

  const payload = await response.json();
  const parsed = extractionResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Backend returned an invalid extraction response shape.");
  }
  return parsed.data;
}

export function extractFromText(request: ExtractTextRequest): Promise<ExtractionResponse> {
  return postJson("/api/extract/text", request);
}

export function extractFromImage(request: ExtractImageRequest): Promise<ExtractionResponse> {
  return postJson("/api/extract/image", request);
}
