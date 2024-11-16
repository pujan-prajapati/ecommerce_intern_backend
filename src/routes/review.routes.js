import express from "express";
const router = express.Router();

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { addReview, getReviews } from "../controllers/review.controller.js";

router.route("/").post(authMiddleware, addReview);

router.route("/:productId").get(getReviews);

export default router;
