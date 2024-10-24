import express from "express";
const router = express.Router();
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  deleteCategory,
  updateCategory,
} from "../controllers/category.controller.js";
import { upload } from "../middlewares/multer.js";
import { authMiddleware, isAdmin } from "../middlewares/auth.middleware.js";

router
  .route("/")
  .post(upload.single("image"), authMiddleware, isAdmin, createCategory);

router
  .route("/:id")
  .put(upload.single("image"), authMiddleware, isAdmin, updateCategory);

router.route("/:id").delete(authMiddleware, isAdmin, deleteCategory);

router.route("/:id").get(getCategoryById);
router.route("/").get(getAllCategories);

export default router;
