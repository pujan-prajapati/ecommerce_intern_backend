import express from "express";
const router = express.Router();
import {
  cancelOrder,
  deleteOrder,
  getAllOrders,
  getOrderById,
  getUserOrders,
  orderItem,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { authMiddleware, isAdmin } from "../middlewares/auth.middleware.js";

router.route("/").post(authMiddleware, orderItem);

router
  .route("/updateorderstatus/:id")
  .put(authMiddleware, isAdmin, updateOrderStatus);

router.route("/cancelOrder/:id").put(authMiddleware, cancelOrder);

router.route("/deleteorder/:id").delete(authMiddleware, isAdmin, deleteOrder);

router.route("/getorder/:id").get(authMiddleware, getOrderById);
router.route("/").get(getAllOrders);
router.route("/getuserorders").get(authMiddleware, getUserOrders);

export default router;
