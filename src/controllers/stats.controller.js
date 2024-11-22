import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import { ApiResponse } from "../utils/ApiResponse.js";

export const OverviewStats = asyncHandler(async (req, res) => {
  const totalUser = await User.countDocuments();

  const newuser = await User.countDocuments({
    createdAt: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) },
  });

  const totalSales = await Order.aggregate([
    {
      $match: {
        status: "delivered",
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$totalPrice",
        },
      },
    },
  ]);

  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ status: "pending" });

  const totalProducts = await Product.countDocuments();
  const outOfStockProducts = await Product.countDocuments({
    quantity: { $lte: 0 },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUser,
        newuser,
        totalSales: totalSales[0]?.total || 0,
        totalOrders,
        pendingOrders,
        totalProducts,
        outOfStockProducts,
      },
      "Stats fetched successfully"
    )
  );
});

export const salesData = asyncHandler(async (req, res) => {
  const sales = await Order.aggregate([
    {
      $match: {
        status: "delivered",
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        sales: { $sum: "$totalPrice" },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  // Map the sales data to include month names
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const formattedSalesData = sales.map((data) => ({
    month: months[data._id - 1],
    sales: data.sales,
  }));

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formattedSalesData,
        "Sales data fetched successfully"
      )
    );
});
