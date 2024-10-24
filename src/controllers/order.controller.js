import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "express-async-handler";
import { Order } from "../models/order.model.js";
import mongoose from "mongoose";

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
      $unwind: "$user",
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
  ]);

  res.status(200).json(new ApiResponse(200, orders, "orders fetched success"));
});

//get user orders
export const getUserOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("user not found");
  }

  const orders = await Order.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(findUser),
      },
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

  if (!orders || orders.length === 0) {
    throw new Error("No orders found");
  }

  res.status(200).json(new ApiResponse(200, orders, "orders fetched success"));
});

//update order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const findOrder = await Order.findById(id);
  if (!findOrder) {
    throw new Error("Order not found");
  }

  findOrder.status = status;
  await findOrder.save();

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
  const { _id } = req.user;
  let findOrder = await Order.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        user: new mongoose.Types.ObjectId(_id),
      },
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
