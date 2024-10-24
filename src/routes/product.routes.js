import express from "express";
const router = express.Router();

import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getLatestProducts,
  getProductById,
  getProductsByCategory,
  updateProduct,
} from "../controllers/product.controller.js";
import { authMiddleware, isAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.js";

router
  .route("/")
  .post(upload.single("image"), authMiddleware, isAdmin, createProduct);

router
  .route("/:id")
  .put(upload.single("image"), authMiddleware, isAdmin, updateProduct);

router.route("/:id").delete(authMiddleware, isAdmin, deleteProduct);

router.route("/").get(getAllProducts);
router.route("/getlatestproducts").get(getLatestProducts);
router.route("/:id").get(getProductById);
router.route("/category/:id").get(getProductsByCategory);

export default router;
