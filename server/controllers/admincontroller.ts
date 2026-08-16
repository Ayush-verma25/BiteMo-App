import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Restaurent } from "../models/Restaurent.js";
import { User } from "../models/User.js";
import { Booking } from "../models/booking.js";

// Get All reastaurents For admin Management
//GET /api/admin/restaurants
export const getAllRestaurants = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const restaurent = await Restaurent.find({})
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });
    res.json(restaurent);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Approve/Reject Restaurant Profile
//Put /api/admin/restaurants/:id/approve
export const approveRestaurant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { status } = req.body;

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      res
        .status(400)
        .json({ message: "Please provide avalid Approvel Status" });
      return;
    }

    const restaurant = await Restaurent.findById(req.params.id);
    if (!restaurant) {
      res.status(400).json({ message: "Restaurant Profile not Found" });
      return;
    }

    restaurant.status = status;
    await restaurant.save();
    res.json(restaurant);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Get System Statics
//Get /api/admin/stats
export const getAdminStats = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalOwners = await User.countDocuments({ role: "owner" });
    const totalBookings = await Booking.countDocuments({});
    const totalRestaurants = await Restaurent.countDocuments({});

    //Get latest 10 Bookings
    const latestBookings = await Booking.find({})
      .populate("user", "name email")
      .populate("restaurant", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      users: {
        totalUsers,
        totalOwners,
        total: totalUsers + totalOwners,
      },
      restaurants: {
        total: totalRestaurants,
      },
      bookings: {
        total: totalBookings,
      },
      latestBookings,
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};
