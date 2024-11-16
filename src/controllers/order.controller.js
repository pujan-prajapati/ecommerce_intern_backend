import dotenv from "dotenv";
dotenv.config();

import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "express-async-handler";
import { Order } from "../models/order.model.js";
import mongoose from "mongoose";
import { sendEmail } from "../utils/sendMail.js";

// order an item
export const orderItem = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  let {
    product,
    firstName,
    lastName,
    phoneNumber,
    address,
    country,
    city,
    status,
    paymentMethod,
    paymentStatus,
  } = req.body;

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("User not found");
  }

  let items = Array.isArray(product) ? product : [product];
  let totalPrice = 0;

  for (let item of items) {
    const { productId, quantity } = item;

    const findProduct = await Product.findById(productId);
    if (!findProduct) {
      throw new Error("Product not found");
    }

    if (findProduct.quantity < quantity) {
      throw new Error("Product quantity not available");
    }

    findProduct.quantity -= quantity;
    await findProduct.save();

    item.totalPrice = findProduct.price * quantity;
    totalPrice += findProduct.price * quantity;
  }

  const order = await Order.create({
    user: _id,
    product: items,
    firstName,
    lastName,
    phoneNumber,
    location: {
      country,
      city,
      address,
    },
    status,
    paymentMethod,
    paymentStatus,
    totalPrice,
  });

  res
    .status(201)
    .json(new ApiResponse(201, order, "Item ordered successfully"));
});

// get all orders
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.aggregate([
    {
      $unwind: "$product",
    },
    {
      $lookup: {
        from: "products",
        localField: "product.productId",
        foreignField: "_id",
        as: "productDetails",
        pipeline: [
          {
            $project: {
              name: 1,
              image: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $addFields: {
        "product.productDetails": "$productDetails",
      },
    },
    {
      $project: {
        productDetails: 0,
      },
    },
    {
      $group: {
        _id: "$_id",
        user: { $first: "$user" },
        product: { $push: "$product" },
        firstName: { $first: "$firstName" },
        lastName: { $first: "$lastName" },
        phoneNumber: { $first: "$phoneNumber" },
        location: { $first: "$location" },
        status: { $first: "$status" },
        paymentMethod: { $first: "$paymentMethod" },
        paymentStatus: { $first: "$paymentStatus" },
        totalPrice: { $first: "$totalPrice" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
      },
    },
    {
      $sort: {
        createdAt: -1, // Sort by creation date in descending order
      },
    },
  ]);

  res.status(200).json(new ApiResponse(200, orders, "orders fetched success"));
});

//get user orders
export const getUserOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  let { page = 1, limit = 10, status } = req.query;

  page = isNaN(page) ? 1 : Number(page);
  limit = isNaN(limit) ? 10 : Number(limit);

  if (page <= 0) {
    page = 1;
  }
  if (limit <= 0) {
    limit = 10;
  }

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("user not found");
  }

  const matchConditions = {
    user: new mongoose.Types.ObjectId(findUser._id),
  };

  if (status) {
    matchConditions.status = status;
  }

  const orders = await Order.aggregate([
    {
      $match: matchConditions,
    },
    {
      $unwind: "$product", // Flatten the 'product' array so we can lookup each item individually
    },
    {
      $lookup: {
        from: "products", // Join with the 'products' collection
        localField: "product.productId", // Field in the 'order' document referring to the product ID
        foreignField: "_id", // Field in the 'products' collection to match
        as: "productDetails", // Add product details to this field
        pipeline: [
          {
            $project: {
              name: 1, // Include only the fields you need
              image: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $addFields: {
        "product.productDetails": "$productDetails", // Add product details to the product object
      },
    },
    {
      $project: {
        productDetails: 0, // Optionally remove the original productDetails field
      },
    },
    {
      $group: {
        _id: "$_id", // Group back by order ID to reconstruct the original order object
        user: { $first: "$user" },
        product: { $push: "$product" }, // Rebuild the product array with updated product details
        firstName: { $first: "$firstName" },
        lastName: { $first: "$lastName" },
        phoneNumber: { $first: "$phoneNumber" },
        location: { $first: "$location" },
        status: { $first: "$status" },
        paymentMethod: { $first: "$paymentMethod" },
        paymentStatus: { $first: "$paymentStatus" },
        totalPrice: { $first: "$totalPrice" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: Number(limit),
    },
  ]);

  const totalOrders = await Order.countDocuments(matchConditions);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: page,
        totalCount: totalOrders,
      },
      "orders fetched success"
    )
  );
});

//update order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;
  const { status } = req.body;

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("User not found");
  }

  const findOrder = await Order.findById(id).populate("user", "email");
  if (!findOrder) {
    throw new Error("Order not found");
  }

  findOrder.status = status;
  await findOrder.save();

  if (findOrder.status === "shipped" || findOrder.status === "delivered") {
    const subject = `Your Order #${findOrder._id} is now ${status}`;
    const text = `Hello ${findOrder.firstName},\n\nYour order is now ${status}. Thank you for shopping with us!`;
    const html = `
        <h1>Order Update</h1>
        <p>Hello ${findOrder.firstName + " " + findOrder.lastName},</p>
        <p>Your order is now <strong>${status}</strong>.</p>
        <p>Thank you for shopping with us!</p>
      `;

    await sendEmail(findUser.email, findOrder.user.email, subject, text, html);
  }

  res
    .status(200)
    .json(new ApiResponse(200, findOrder, "Order status updated successfully"));
});

//cancel order
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  const findOrder = await Order.findById(id);
  if (!findOrder) {
    throw new Error("Order not found");
  }

  if (findOrder.user.toString() !== _id.toString()) {
    throw new Error("Unauthorized access");
  }

  if (findOrder.status === "shipped" || findOrder.status === "delivered") {
    throw new Error("Can't cancel a shipped or delivered order");
  }

  for (let orderProduct of findOrder.product) {
    const findProduct = await Product.findById(orderProduct.productId);
    if (!findProduct) {
      throw new Error("Product not found");
    }

    findProduct.quantity += orderProduct.quantity;
    await findProduct.save();
  }

  findOrder.status = "cancelled";
  await findOrder.save();

  res
    .status(200)
    .json(new ApiResponse(200, findOrder, "Order cancelled successfully"));
});

//get order by id
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { _id, role } = req.user;

  let matchCretria = { _id: new mongoose.Types.ObjectId(id) };
  if (role !== "admin") {
    matchCretria = {
      _id: new mongoose.Types.ObjectId(id), // Ensure it matches the order ID
      user: new mongoose.Types.ObjectId(_id), // Match the user ID as well
    };
  }

  let findOrder = await Order.aggregate([
    {
      $match: matchCretria,
    },
    {
      $unwind: "$product", // Flatten the 'product' array so we can lookup each item individually
    },
    {
      $lookup: {
        from: "products", // Join with the 'products' collection
        localField: "product.productId", // Field in the 'order' document referring to the product ID
        foreignField: "_id", // Field in the 'products' collection to match
        as: "productDetails", // Add product details to this field
        pipeline: [
          {
            $project: {
              name: 1, // Include only the fields you need
              image: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              mobile: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$user",
    },
    {
      $unwind: "$productDetails",
    },
    {
      $addFields: {
        "product.productDetails": "$productDetails", // Add product details to the product object
      },
    },
    {
      $project: {
        productDetails: 0, // Optionally remove the original productDetails field
      },
    },
    {
      $group: {
        _id: "$_id", // Group back by order ID to reconstruct the original order object
        user: { $first: "$user" },
        product: { $push: "$product" }, // Rebuild the product array with updated product details
        firstName: { $first: "$firstName" },
        lastName: { $first: "$lastName" },
        phoneNumber: { $first: "$phoneNumber" },
        location: { $first: "$location" },
        status: { $first: "$status" },
        paymentMethod: { $first: "$paymentMethod" },
        paymentStatus: { $first: "$paymentStatus" },
        totalPrice: { $first: "$totalPrice" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
      },
    },
  ]);

  if (!findOrder || findOrder.length === 0) {
    throw new Error("Order not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, findOrder[0], "Order fetched successfully"));
});

//delete order
export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const findOrder = await Order.findById(id);
  if (!findOrder) {
    throw new Error("Order not found");
  }

  for (let orderProduct of findOrder.product) {
    const findProduct = await Product.findById(orderProduct.productId);

    if (!findProduct) {
      throw new Error("Product not found");
    }

    findProduct.quantity += orderProduct.quantity;
    await findProduct.save();
  }

  const deleteOrder = await Order.findByIdAndDelete(findOrder._id);

  res
    .status(200)
    .json(new ApiResponse(200, deleteOrder, "Order deleted successfully"));
});
