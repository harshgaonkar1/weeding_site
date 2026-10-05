import express from "express";
import { guestController } from "../controllers/guestController.js";

const router = express.Router();

// Specific routes before parameterized :id route
router.get("/stats", guestController.getStats);
router.get("/export/csv", guestController.exportCsv);
router.post("/sync", guestController.syncGuests);
router.post("/bulk-import", guestController.bulkImportGuests);

// CRUD routes
router.get("/", guestController.getGuests);
router.get("/:id", guestController.getGuestById);
router.post("/", guestController.createGuest);
router.put("/:id", guestController.updateGuest);
router.delete("/:id", guestController.deleteGuest);

export default router;
