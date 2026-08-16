import { Request, Response } from "express";
import { Restaurent } from "../models/Restaurent.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Booking } from "../models/booking.js";

// Get all Restaurants with search and filter
// Get /api/restaurants
// @access Public
export const getRestaurants = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { search, priceRange, rating, location, sort } = req.query;

    // Build the query object
    const queryObj: any = { status: "approved" };

    if (search) {
      queryObj.$or = [
        { name: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    if (priceRange) {
      const prices = Array.isArray(priceRange) ? priceRange : [priceRange];
      queryObj.priceRange = { $in: prices };
    }

    if (rating) {
      queryObj.rating = { $gte: parseFloat(rating as string) };
    }

    if (location) {
      queryObj.location = { $regex: location as string, $options: "i" };
    }

    // Sorting
    let sortOption: any = { createdAt: -1 }; // Default sorting by newest
    if (sort === "rating") {
      sortOption = { rating: -1 };
    } else if (sort === "price_low") {
      sortOption = { priceRange: 1 };
    } else if (sort === "price_high") {
      sortOption = { priceRange: -1 };
    }

    const restaurants = await Restaurent.find(queryObj).sort(sortOption);
    res.status(200).json(restaurants);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get featured Restaurants
// Get /api/restaurants/featured
// @access Public
export const getFeaturedRestaurants = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const featured = await Restaurent.find({
      featured: true,
      status: "approved",
      $or: [{}],
      exclusive: true,
    }).limit(6);
    res.status(200).json(featured);
  } catch (error: any) {
    console.error("get featured restaurants error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get Restaurant by slug
// Get /api/restaurants/:slug
// @access Public
export const getRestaurantBySlug = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const restaurant = await Restaurent.findOne({ slug: req.params.slug });
    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    // if not approved, verify authorization (owner or admin)
    if (restaurant.status !== "approved") {
      let isAuthorized = false;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
      ) {
        try {
          const token = req.headers.authorization.split(" ")[1];
          const decoded: any = jwt.verify(
            token,
            process.env.JWT_SECRET as string,
          ) as { id: string };

          const user = await User.findById(decoded.id);
          if (
            user &&
            (user.role === "admin" ||
              (user.role === "owner" &&
                restaurant.owner.toString() === user._id.toString()))
          ) {
            isAuthorized = true;
          }
        } catch (err) {
          // Ignore token verify error
        }
      }
      if (!isAuthorized) {
        res
          .status(404)
          .json({ message: "Restaurant not found or pending approval" });
        return;
      }
    }
    res.status(200).json(restaurant);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Get dynamic seat availability for slots
// Get /api/restaurants/:id/availability
// @access Public
export const getRestaurantAvailability = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { date } = req.query;
    if (!date) {
      res.status(400).json({ message: "Date query parameter is required" });
      return;
    }

    const restaurant = await Restaurent.findById(req.params.id);
    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    const bookingDate = new Date(date as string);

    // Get all active bookings for the restaurant on the specified date
    const bookings = await Booking.find({
      restaurant: restaurant._id,
      date: bookingDate,
      status: "confirmed",
    });

    // Map slots to available capacities
    const availability = restaurant.availableSlots.map((slot) => {
      const bookedSeats = bookings
        .filter((b) => b.time === slot)
        .reduce((sum, b) => sum + b.guests, 0);

      const totalSeats = restaurant.totalSeats || 20;
      const availableSeats = Math.max(0, totalSeats - bookedSeats);

      return {
        time: slot,
        availableSeats,
        isAvailable: availableSeats > 0,
      };
    });

    res.json(availability);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
