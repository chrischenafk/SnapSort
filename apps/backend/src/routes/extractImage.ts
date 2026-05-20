import { Router } from "express";
import { ZodError } from "zod";
import { extractImageRequestSchema } from "../schemas/eventSchema.js";
import { extractEventFromImage } from "../services/llmExtractionService.js";

export const extractImageRouter = Router();

extractImageRouter.post("/", async (request, response) => {
  try {
    const payload = extractImageRequestSchema.parse(request.body);
    const extraction = await extractEventFromImage(payload);
    response.json(extraction);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({ error: "Invalid extract image payload", issues: error.issues });
      return;
    }
    response.status(500).json({ error: "Failed to extract event from image" });
  }
});
