import express from "express";
const router = express.Router();
import { OverviewStats, salesData } from "../controllers/stats.controller.js";

router.route("/overview").get(OverviewStats);
router.route("/getsales").get(salesData);

export default router;
