import { Category } from "../models/category.model.js";
import asyncHanlder from "express-async-handler";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

//create category
export const createCategory = asyncHanlder(async (req, res) => {
  const { name, status, description } = req.body;

  const findCategory = await Category.findOne({ name });
  if (findCategory) {
    throw new Error("Category already exist");
  }

  const categoryImageLocalPath = req.file?.path;
  if (!categoryImageLocalPath) {
    throw new Error("category image path required");
  }

  const categoryImage = await uploadOnCloudinary(
    categoryImageLocalPath,
    "Category"
  );
  if (!categoryImage) {
    throw new Error("Failed to upload cateogry image");
  }

  const category = await Category.create({
    name,
    status,
    description,
    image: categoryImage.url,
  });

  res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

//get all category
export const getAllCategories = asyncHanlder(async (req, res) => {
  const findCategories = await Category.find();
  if (!findCategories) {
    throw new Error("Category is empty");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, findCategories, "Categories fetched successfully")
    );
});

// get category by id
export const getCategoryById = asyncHanlder(async (req, res) => {
  const { id } = req.params;

  const findCategory = await Category.findById(id);
  if (!findCategory) {
    throw new Error("Category not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, findCategory, "Category fetched successfully"));
});

//delete category
export const deleteCategory = asyncHanlder(async (req, res) => {
  const { id } = req.params;

  const findCategory = await Category.findById(id);
  if (!findCategory) {
    throw new Error("Category not found");
  }

  if (findCategory?.image) {
    await deleteFromCloudinary(findCategory.image);
  }

  const deletedCategory = await Category.findByIdAndDelete(id);

  res
    .status(200)
    .json(
      new ApiResponse(200, deletedCategory, "Category deleted successfully")
    );
});

// update category
export const updateCategory = asyncHanlder(async (req, res) => {
  const { id } = req.params;
  const { name, status, description } = req.body;

  const findCategory = await Category.findById(id);
  if (!findCategory) {
    throw new Error("Category not found");
  }

  try {
    if (name) {
      findCategory.name = name;
    }

    if (status) {
      findCategory.status = status;
    }

    if (description) {
      findCategory.description = description;
    }

    if (req.file) {
      if (findCategory?.image) {
        await deleteFromCloudinary(findCategory.image);
      }

      const nenwCategoryImageLocalPath = req.file?.path;
      if (!nenwCategoryImageLocalPath) {
        throw new Error("category image path required");
      }

      const categoryImage = await uploadOnCloudinary(
        nenwCategoryImageLocalPath,
        "Category"
      );
      if (!categoryImage) {
        throw new Error("Failed to upload cateogry image");
      }

      findCategory.image = categoryImage.url;
    }

    const updatedCategory = await findCategory.save();
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedCategory, "Category updated successfully")
      );
  } catch (error) {
    throw new Error("Failed to update category");
  }
});
