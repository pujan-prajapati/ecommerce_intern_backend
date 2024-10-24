import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    product: {
      productDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Product is required"],
      },
      quantity: {
        type: Number,
        default: 1,
        required: [true, "Product quantity is required"],
      },
      price: {
        type: Number,
      },
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
    },
    location: {
      country: {
        type: String,
        required: [true, "Country is required"],
      },
      city: {
        type: String,
        required: [true, "City is required"],
      },
      address: {
        type: String,
        required: [true, "Address is required"],
      },
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "esewa"],
      required: [true, "Payment method is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: [true, "Product is required"],
  }
);

//Export the model
export const Order = mongoose.model("Order", orderSchema);
