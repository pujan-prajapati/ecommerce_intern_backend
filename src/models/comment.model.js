import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: {
      type: String,
    },
    reply: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Tracks who replied
        },
        message: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now, // Tracks when the reply was made
        },
      },
    ],
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

//Export the model
export const Comment = mongoose.model("Comment", commentSchema);
