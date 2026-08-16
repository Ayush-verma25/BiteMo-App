import { NextFunction, Request, Response } from "express";
import { IUser, User } from "../models/User.js";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };

      // Get user from the token, excluding the password field
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }
      req.user = user;
      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied, admin only" });
  }
};

export const ownerOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (
    (req.user && req.user.role === "owner") ||
    (req.user && req.user.role === "admin")
  ) {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Access denied, restaurant owner and admin only" });
  }
};
