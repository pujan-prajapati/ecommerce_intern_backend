import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import asyncHandler from "express-async-handler";
import { validateID } from "../utils/validateMongodbID.js";
import slugify from "slugify";
import mongoose from "mongoose";

//create product
export const createProduct = asyncHandler(async (req, res) => {
  let { name, slug, price, quantity, status, description, category } = req.body;

  try {
    if (name) {
      slug = slugify(name).toLowerCase();
    }

    let productImageLocalPath = req.file?.path;
    if (!productImageLocalPath) {
      throw new Error("Product Image local path is required");
    }

    let productImage = await uploadOnCloudinary(
      productImageLocalPath,
      "products"
    );
    if (!productImage) {
      throw new Error("Failed to upload product image");
    }

    const createdProduct = await Product.create({
      name,
      slug,
      image: productImage.url,
      price,
      quantity,
      status,
      description,
      category,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, createdProduct, "Product created successfully")
      );
  } catch (error) {
    throw new Error(error);
  }
});

//get all product
export const getAllProducts = asyncHandler(async (req, res) => {
  let {
    sortBy,
    sortDirection,
    search,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
  } = req.query;

  page = isNaN(page) ? 1 : Number(page);
  limit = isNaN(limit) ? 10 : Number(limit);

  if (page <= 0) {
    page = 1;
  }
  if (limit <= 0) {
    limit = 10;
  }

  sortBy = sortBy || "createdAt";
  sortDirection = sortDirection === "desc" ? -1 : 1;

  const matchConditions = {};

  if (minPrice || maxPrice) {
    matchConditions.price = {};
    if (minPrice) {
      matchConditions.price.$gte = Number(minPrice);
    }
    if (maxPrice) {
      matchConditions.price.$lte = Number(maxPrice);
    }
  }

  if (search) {
    matchConditions.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { "category.name": { $regex: search, $options: "i" } },
      { "category.description": { $regex: search, $options: "i" } },
    ];
  }

  const products = await Product.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "comments",
        foreignField: "_id",
        as: "comments",
      },
    },
    {
      $unwind: "$category",
    },

    {
      $match: matchConditions,
    },
    {
      $sort: {
        [sortBy]: sortDirection,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: Number(limit),
    },
  ]);

  const totalProducts = products.length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
      },
      "All products fetched"
    )
  );
});

//get product by id
export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },

    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
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
      $addFields: {
        category: {
          $first: "$category",
        },
      },
    },
  ]);

  if (!product) {
    throw new Error("Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

//delete product
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateID(id);

  const product = await Product.findById(id);
  if (product) {
    if (product?.image) {
      await deleteFromCloudinary(product.image);
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    return res
      .status(200)
      .json(new ApiResponse(200, deletedProduct, "Product deleted success"));
  } else {
    throw new Error("Product not found");
  }
});

//update product
export const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, quantity, status, description } = req.body;

  const { id } = req.params;
  validateID(id);

  const product = await Product.findById(id);
  if (!product) {
    throw new Error("Product not found");
  }

  try {
    if (name) {
      product.name = name;
      product.slug = slugify(name).toLowerCase();
    }
    if (price) {
      product.price = price;
    }
    if (quantity) {
      product.quantity = quantity;
    }
    if (status) {
      product.status = status;
    }
    if (description) {
      product.description = description;
    }
    if (req.file) {
      if (product.image) {
        await deleteFromCloudinary(product.image);
      }
      const newProductImageLocalPath = req.file.path;
      if (!newProductImageLocalPath) {
        throw new Error("Image Local path is required");
      }
      const newProductImage = await uploadOnCloudinary(
        newProductImageLocalPath,
        "products"
      );
      if (!newProductImage) {
        throw new Error("Product Image upload failed");
      }

      product.image = newProductImage.url;
    }

    const updatedProduct = await product.save();

    return res
      .status(200)
      .json(new ApiResponse(200, updatedProduct, "Product updated success"));
  } catch (error) {
    throw new Error(error);
  }
});

//get products by category
export const getProductsByCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateID(id);

  const category = await Category.findById(id);
  if (!category) {
    throw new Error("Category not found");
  }

  const products = await Product.find({ category: category._id }).populate(
    "category"
  );

  if (!products) {
    throw new Error("No product available");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, products, "Products fetched successfully"));
});

//get latest 6 products
export const getLatestProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort("-createdAt").limit(6);
  if (!products) {
    throw new Error("No product available");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, products, "Products fetched successfully"));
});
