import mongoose from "mongoose";

const mongo = async () => {
  try {
    console.log("MONGO_URI ->", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
};
export default mongo;
