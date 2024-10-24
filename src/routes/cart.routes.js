import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem,
} from "../controllers/cart.controller.js";

const router = express.Router();
import { authMiddleware } from "../middlewares/auth.middleware.js";

router.route("/addtocart").post(authMiddleware, addToCart);
router.route("/removefromcart").post(authMiddleware, removeFromCart);

router.route("/updatecartitem").put(authMiddleware, updateCartItem);

router.route("/getcart").get(authMiddleware, getCart);

export default router;
