import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHanlder from "express-async-handler";

// add to cart
export const addToCart = asyncHanlder(async (req, res) => {
  const { _id } = req.user;
  const { productId, quantity } = req.body;

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("User not found");
  }

  if (!productId) {
    throw new Error("Product ID is required");
  }

  const existingCartItem = await findUser.cart.find(
    (item) => item.product.toString() === productId
  );

  if (existingCartItem) {
    existingCartItem.quantity += quantity ? quantity : 1;
  } else {
    findUser.cart.push({ product: productId, quantity });
    console.log("User cart:", findUser.cart);
  }

  await findUser.save();
  res
    .status(200)
    .json(new ApiResponse(200, findUser.cart, "Product added to cart"));
});

//remove item from cart
export const removeFromCart = asyncHanlder(async (req, res) => {
  const { _id } = req.user;
  const { productId } = req.body;

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("User not found");
  }

  const findCartItem = await findUser.cart.find(
    (item) => item.product.toString() === productId
  );
  if (!findCartItem) {
    throw new Error("Product not found in cart");
  }

  findUser.cart = findUser.cart.filter(
    (item) => item.product.toString() !== productId
  );
  await findUser.save();

  return res
    .status(200)
    .json(new ApiResponse(200, findUser.cart, "Product removed from cart"));
});

//update item in category
export const updateCartItem = asyncHanlder(async (req, res) => {
  const { _id } = req.user;
  const { productId, quantity } = req.body;

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("User not found");
  }

  const findCartItem = await findUser.cart.find(
    (item) => item.product.toString() === productId
  );
  if (!findCartItem) {
    throw new Error("Product not found in cart");
  }

  if (quantity > 0) {
    findCartItem.quantity = quantity;
  } else {
    throw new Error("Quantity must be greater than 0");
  }

  await findUser.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, findUser.cart, "Cart item updated successfully")
    );
});

//get cart
export const getCart = asyncHanlder(async (req, res) => {
  const { _id } = req.user;
  const findUser = await User.findById(_id).populate("cart.product");
  if (!findUser) {
    throw new Error("User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, findUser.cart, "Cart fetched successfully"));
});
