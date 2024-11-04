import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "express-async-handler";

// create wishlist
export const addToWishList = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { productId } = req.body;

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("User not found");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  const existingWishlist = await findUser.wishlist.find(
    (item) => item.toString() === productId
  );
  if (existingWishlist) {
    throw new Error("Product already in wishlist");
  }

  findUser.wishlist.push(productId);
  await findUser.save();

  res
    .status(201)
    .json(new ApiResponse(201, findUser.wishlist, "Product added to wishlist"));
});

// get all wishlist
export const getAllWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const findUser = await User.findById(_id)
    .sort({ createdAt: -1 })
    .populate("wishlist", "image name price");
  if (!findUser) {
    throw new Error("User not found");
  }

  if (findUser.wishlist.length === 0) {
    throw new Error("Wishlist is empty");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, findUser.wishlist, "Wishlist fetched successfully")
    );
});

//delete wishlist
export const deleteWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("User not found");
  }

  const wishlistItem = findUser.wishlist.find((item) => item.toString() === id);
  if (!wishlistItem) {
    throw new Error("Product not found in wishlist");
  }

  const deletedWishlist = await findUser.wishlist.filter(
    (item) => item.toString() !== id
  );

  findUser.wishlist = deletedWishlist;
  await findUser.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, deletedWishlist, "Wishlist deleted successfully")
    );
});
