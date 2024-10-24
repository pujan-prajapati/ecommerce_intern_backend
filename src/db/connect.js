import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
    console.log(
      `\nConnected to MongoDB successfully !! : DB HOST : ${connectionInstance}`
    );
  } catch (error) {
    console.log("Failed to connect to MongoDB : ", error);
    process.exit(1);
  }
};
