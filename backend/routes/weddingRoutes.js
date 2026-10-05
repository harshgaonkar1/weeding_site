import express from "express";
import { weddingController } from "../controllers/weddingController.js";

const router = express.Router();

router.get("/", weddingController.getWeddings);
router.get("/:id", weddingController.getWeddingById);
router.post("/", weddingController.createWedding);
router.put("/:id", weddingController.updateWedding);
router.delete("/:id", weddingController.deleteWedding);

export default router;
