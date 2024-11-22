import express from "express";
const router = express.Router();
import {
  changePassowrd,
  deleteUser,
  forgetPassword,
  getAllAdmins,
  getAllUsers,
  loginUser,
  logoutUser,
  registerUser,
  updateUserStatus,
  verifyOTP,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import { authMiddleware, isAdmin } from "../middlewares/auth.middleware.js";

router.route("/registerUser").post(upload.single("avatar"), registerUser);
router.route("/loginUser").post(loginUser);
router.route("/logoutUser").post(authMiddleware, logoutUser);
router.route("/forgotPassword").post(forgetPassword);
router.route("/verifyOtp").post(verifyOTP);
router.route("/changePassword").post(changePassowrd);

router
  .route("/updateUserStatus/:id")
  .put(authMiddleware, isAdmin, updateUserStatus);

router.route("/:id").delete(authMiddleware, isAdmin, deleteUser);

router.route("/getAllAdmins").get(getAllAdmins);
router.route("/getAllUsers").get(getAllUsers);

export default router;
