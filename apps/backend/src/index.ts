import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { extractImageRouter } from "./routes/extractImage.js";
import { extractTextRouter } from "./routes/extractText.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "snapsort-backend",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/extract/text", extractTextRouter);
app.use("/api/extract/image", extractImageRouter);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`SnapSort backend listening on http://localhost:${port}`);
});
