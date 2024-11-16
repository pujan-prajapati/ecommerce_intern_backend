import { Review } from "../models/review.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "express-async-handler";
import { validateID } from "../utils/validateMongodbID.js";
import mongoose from "mongoose";

// add review
export const addReview = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { productId, rating, comment } = req.body;

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("User not found");
  }

  const findProduct = await Product.findById(productId);
  if (!findProduct) {
    throw new Error("Product not found");
  }

  const newReview = await Review.create({
    user: findUser._id,
    productId,
    rating,
    comment,
  });

  await findProduct.reviews.push(newReview._id);
  await findProduct.save();

  res
    .status(200)
    .json(new ApiResponse(200, newReview, "Review added successfully"));
});

//get all reviews
export const getReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  let { page = 1, limit = 5 } = req.query;

  // Validate and sanitize pagination parameters
  page = isNaN(page) || page <= 0 ? 1 : Number(page);
  limit = isNaN(limit) || limit <= 0 ? 5 : Number(limit);

  const reviewsAggregation = await Product.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(productId),
      },
    },
    {
      $lookup: {
        from: "reviews",
        localField: "reviews",
        foreignField: "_id",
        as: "reviews",
      },
    },
    {
      $unwind: "$reviews",
    },
    {
      $sort: {
        "reviews.createdAt": -1,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
    {
      $group: {
        _id: "$_id",
        reviews: { $push: "$reviews" },
      },
    },
  ]);

  const reviews = reviewsAggregation[0].reviews;

  // Send the response
  res
    .status(200)
    .json(new ApiResponse(200, reviews, "Reviews fetched successfully"));
});
