import express from "express";
const router = express.Router();
import { sendMessage } from "../controllers/contact.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

router.route("/").post(authMiddleware, sendMessage);

export default router;
