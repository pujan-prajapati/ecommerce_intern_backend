import express from "express";
const router = express.Router();
import {
  addToWishList,
  deleteWishlist,
  getAllWishlist,
} from "../controllers/wishlist.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

router.route("/").post(authMiddleware, addToWishList);

router.route("/:id").delete(authMiddleware, deleteWishlist);

router.route("/").get(authMiddleware, getAllWishlist);

export default router;
