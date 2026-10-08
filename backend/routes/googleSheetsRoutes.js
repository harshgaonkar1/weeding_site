import express from "express";
import { googleSheetsController } from "../controllers/googleSheetsController.js";

const router = express.Router();

// Auth status check
router.get("/auth-status", googleSheetsController.getAuthStatus);

// Webhook for Google Apps Script onEdit / bulk sync
router.post("/webhook", googleSheetsController.handleWebhook);

// Wedding specific sheets routes
router.post("/weddings/:id/create-live-sheet", googleSheetsController.createLiveSheet);
router.post("/weddings/:id/sync-from-sheet", googleSheetsController.syncFromSheet);
router.get("/weddings/:id/export-data", googleSheetsController.exportSheetData);
router.get("/weddings/:id/script", googleSheetsController.getAppsScript);
router.post("/weddings/:id/link", googleSheetsController.linkGoogleSheet);

export default router;
