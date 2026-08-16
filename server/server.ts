import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import restaurentRouter from "./routes/restaurentRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import adminRouter from "./routes/adminRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// connect to MongoDB

await connectDB();

const port = process.env.PORT || 5000;

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running!");
});

app.use("/api/auth", authRouter);
app.use("/api/restaurants", restaurentRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/owner", ownerRouter);
app.use("/api/admin", adminRouter);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? err.stack : undefined,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
