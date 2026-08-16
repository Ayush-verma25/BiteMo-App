import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => console.log("MongoDB Connected Successfully"));
        await mongoose.connect(process.env.MONGODB_URI!);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

export default connectDB;