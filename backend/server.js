import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { testConnection } from "./Db_connection/dbconnection.js";
import authRoutes from "./routes/authRoutes.js";
import guestRoutes from "./routes/guestRoutes.js";
import weddingRoutes from "./routes/weddingRoutes.js";
import callLogRoutes from "./routes/callLogRoutes.js";
import googleSheetsRoutes from "./routes/googleSheetsRoutes.js";
import { getExportDir } from "./services/excelService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Candidate paths for .env file
const envCandidates = [
  path.resolve(__dirname, ".env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(process.cwd(), "backend/.env"),
  path.resolve(process.cwd(), ".env"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize exports folder
const exportDir = getExportDir();

// Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Serve static exports folder for direct file downloads
app.use("/exports", express.static(exportDir));

// Health Check
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Multi-Wedding & Guest Logistics Management API with ExcelJS Marriage Sheet Generator & Google Sheets Sync",
    version: "1.0",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/weddings", weddingRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/call-logs", callLogRoutes);
app.use("/api/sheets", googleSheetsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Backend Server started and listening on port ${PORT}`);
  await testConnection();
});
