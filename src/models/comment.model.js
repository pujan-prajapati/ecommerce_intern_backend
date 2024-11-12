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
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

//Export the model
export const Comment = mongoose.model("Comment", commentSchema);
