import mongoose from "mongoose";

export const validateID = (id) => {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) {
    throw new Error("This ID is not validated or not found");
  }
};
