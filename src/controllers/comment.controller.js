import { Comment } from "../models/comment.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "express-async-handler";
import { validateID } from "../utils/validateMongodbID.js";

// add comment
export const addComment = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { productId, comment } = req.body;

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("User not found");
  }

  const findProduct = await Product.findById(productId);
  if (!findProduct) {
    throw new Error("Product not found");
  }

  const newComment = await Comment.create({
    user: findUser._id,
    comment,
  });

  findProduct.comments.push(newComment._id);
  await findProduct.save();

  res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment added successfully"));
});

// delete comment
export const deleteComment = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { commentId } = req.params;
  validateID(commentId);

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("User not found");
  }

  const findComment = await Comment.findById(commentId);
  if (!findComment) {
    throw new Error("Comment not found");
  }

  if (
    findComment.user.toString() === findUser._id.toString() ||
    findUser.role === "admin"
  ) {
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    return res
      .status(200)
      .json(
        new ApiResponse(200, deletedComment, "Comment deleted successfully")
      );
  } else {
    throw new Error("You are not authorized to delete this comment");
  }
});

//edit comment
export const editComment = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { commentId } = req.params;
  const { comment } = req.body;
  validateID(commentId);

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("User not found");
  }

  const findComment = await Comment.findById(commentId);
  if (!findComment) {
    throw new Error("Comment not found");
  }

  if (findComment.user.toString() !== findUser._id.toString()) {
    throw new Error("You are not authorized to edit this comment");
  }

  findComment.comment = comment;
  await findComment.save();

  res
    .status(200)
    .json(new ApiResponse(200, findComment, "Comment edited successfully"));
});
