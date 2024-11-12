import express from "express";
const router = express.Router();
import {
  addComment,
  deleteComment,
  editComment,
  getComments,
  getReplies,
  replyComment,
} from "../controllers/comment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

router.route("/").post(authMiddleware, addComment);
router.route("/reply").post(authMiddleware, replyComment);
router.route("/edit/:commentId").put(authMiddleware, editComment);
router.route("/:productId").get(getComments);
router.route("/reply/:commentId").get(getReplies);
router.route("/:commentId").delete(authMiddleware, deleteComment);

export default router;
