import express from "express";
const router = express.Router();
import {
  addComment,
  deleteComment,
  editComment,
} from "../controllers/comment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

router.route("/").post(authMiddleware, addComment);
router.route("/edit/:commentId").put(authMiddleware, editComment);
router.route("/:commentId").delete(authMiddleware, deleteComment);

export default router;
