import express from "express";
import { callLogController } from "../controllers/callLogController.js";

const router = express.Router();

router.get("/stats", callLogController.getCallingStats);
router.get("/guest/:guestId", callLogController.getGuestCallLogs);
router.post("/", callLogController.createCallLog);
router.put("/:id", callLogController.updateCallLog);
router.delete("/:id", callLogController.deleteCallLog);

export default router;
