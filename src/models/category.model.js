import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, "Category image is required"],
  },
  status: {
    type: String,
    required: [true, "Status is required"],
    enum: ["Published", "Scheduled", "Unpublished"],
  },
  name: {
    type: String,
    required: [true, "Category name is required"],
    unique: true,
    index: true,
  },
  description: {
    type: String,
    required: [true, "Category description is required"],
  },
});

//Export the model
export const Category = mongoose.model("Category", categorySchema);
