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
    productDetails,
    quantity,
    price,
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

  const findProduct = await Product.findById(productDetails);
  if (!findProduct) {
    throw new Error("Product not found");
  }

  if (findProduct.quantity < quantity) {
    throw new Error("Product quantity not available");
  }

  findProduct.quantity = findProduct.quantity - quantity;
  await findProduct.save();

  price = findProduct.price * quantity;

  const order = await Order.create({
    user: _id,
    product: {
      productDetails,
      quantity,
      price,
    },
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
  });

  res
    .status(201)
    .json(new ApiResponse(201, order, "Item ordered successfully"));
});

// get all orders
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "product.productDetails",
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
      $sort: {
        createdAt: -1,
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
      $lookup: {
        from: "products",
        localField: "product.productDetails",
        foreignField: "_id",
        as: "product.productDetails",
        pipeline: [
          {
            $project: {
              image: 1,
              name: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$product.productDetails",
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
  const { id } = req.params;
  const { status } = req.body;

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

    await sendEmail(
      process.env.EMAIL_USER,
      findOrder.user.email,
      subject,
      text,
      html
    );
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

  const findProduct = await Product.findById(findOrder.product.productDetails);
  if (!findProduct) {
    throw new Error("Product not found");
  }

  findProduct.quantity += findOrder.product.quantity;
  await findProduct.save();

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
    matchCretria = { user: new mongoose.Types.ObjectId(_id) };
  }

  let findOrder = await Order.aggregate([
    {
      $match: matchCretria,
    },
    {
      $lookup: {
        from: "products",
        localField: "product.productDetails",
        foreignField: "_id",
        as: "product.productDetails",
        pipeline: [
          {
            $project: {
              image: 1,
              name: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$product.productDetails",
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

  const deleteOrder = await Order.findByIdAndDelete(id);

  const findProduct = await Product.findById(findOrder.product.productDetails);
  if (!findProduct) {
    throw new Error("Product not found");
  }

  findProduct.quantity += findOrder.product.quantity;
  await findProduct.save();

  res
    .status(200)
    .json(new ApiResponse(200, deleteOrder, "Order deleted successfully"));
});
