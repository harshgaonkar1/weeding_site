import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { initializeChatSocket } from "./socket/chatSocket.js";
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
import messageRoutes from "./routes/messageRoutes.js";
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

// Initialize HTTP server and Socket.IO for Live Real-Time Chatbot
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "x-user-role"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["polling", "websocket"],
  allowUpgrades: true,
  allowEIO3: true,
});

// Attach io instance to express app so routes can broadcast messages
app.set("io", io);
initializeChatSocket(io);

// Initialize exports folder
const exportDir = getExportDir();

// Allowed CORS origins - add all your Vercel/Netlify/custom URLs here
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://weeding-site-six.vercel.app",
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
].filter(Boolean);

// CORS middleware - must be FIRST so headers are set even on errors/crashes
app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  // Return the exact requesting origin if allowlisted, else fallback to first allowed
  const allowedOrigin = origin || ALLOWED_ORIGINS[0] || "*";
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, x-user-role");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Vary", "Origin");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "x-user-role"],
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
app.use("/api/messages", messageRoutes);

// Global Error Handler with guaranteed CORS headers
app.use((err, req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

// Process safety listeners to prevent Node crash / 502 Bad Gateway
process.on("unhandledRejection", (reason, promise) => {
  console.warn("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

// Start Server with Socket.IO Enabled
server.listen(PORT, async () => {
  console.log(`🚀 Backend Server & Live Socket.IO Chat started on port ${PORT}`);
  await testConnection();
});
