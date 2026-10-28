import express from "express";
import { weddingController } from "../controllers/weddingController.js";

const router = express.Router();

router.get("/", weddingController.getWeddings);
router.get("/:id", weddingController.getWeddingById);
router.post("/", weddingController.createWedding);
router.put("/:id", weddingController.updateWedding);
router.delete("/:id", weddingController.deleteWedding);
router.post("/:id/delete", weddingController.deleteWedding);

// Excel Sheet Generation & Download Routes
router.get("/:id/export-excel", weddingController.exportWeddingExcel);
router.get("/:id/download-excel", weddingController.downloadWeddingExcel);
router.post("/:id/generate-excel", weddingController.exportWeddingExcel);

export default router;
