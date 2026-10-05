import express from "express";
import { authController } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", authController.login);
router.get("/me", authController.getMe);
router.get("/users", authController.getUsers);
router.post("/logout", authController.logout);

export default router;
