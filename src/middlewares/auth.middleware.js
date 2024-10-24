import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";

export const authMiddleware = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req?.cookies?.accessToken ||
      req?.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new Error("Unauthorized request");
    }

    const decodedToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new Error("Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new Error("Invalid access token or access token not provided");
  }
});

export const isAdmin = asyncHandler(async (req, res, next) => {
  const { email } = req.user;
  const isAdmin = await User.findOne({ email });
  if (isAdmin.role !== "admin") {
    throw new Error("Yor are not an Admin");
  } else {
    next();
  }
});
