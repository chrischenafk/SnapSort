import { Router } from "express";
import { ZodError } from "zod";
import { extractTextRequestSchema } from "../schemas/eventSchema.js";
import { extractEventFromText } from "../services/llmExtractionService.js";

export const extractTextRouter = Router();

extractTextRouter.post("/", async (request, response) => {
  try {
    const payload = extractTextRequestSchema.parse(request.body);
    const extraction = await extractEventFromText(payload);
    response.json(extraction);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({ error: "Invalid extract text payload", issues: error.issues });
      return;
    }
    response.status(500).json({ error: "AI extraction failed. You can still manually edit the event." });
  }
});
