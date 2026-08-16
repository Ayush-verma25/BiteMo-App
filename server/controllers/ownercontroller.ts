import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Restaurent } from "../models/Restaurent.js";
import cloudinary from "../config/cloudinary.js";
import { Booking } from "../models/booking.js";

// Helper function to upload buffer to Cloudinary
const uplodeToCloudinary = (
  fileBuffer: Buffer,
): Promise<{ secure_url: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "test" },
      (error, result) => {
        if (error) {
          // Surface Cloudinary's real error detail instead of just the
          // generic "unexpected status code" wrapper, so it's actually
          // diagnosable (auth failure, invalid signature, plan restriction, etc).
          console.error("Cloudinary upload failed:", {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
          });
          return reject(
            new Error(
              `Cloudinary upload failed (${error.http_code ?? "no code"}): ${error.message}`,
            ),
          );
        }
        if (!result) return reject(new Error("Upload Failed"));
        resolve({ secure_url: result.secure_url });
      },
    );
    stream.end(fileBuffer);
  });
};

// get owner's restaurant
// Get /api/owner/restaurent
export const getOwnerRestaurant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const restaurant = await Restaurent.findOne({ owner: req.user?._id });
    if (!restaurant) {
      res.status(200).json(null);
      return;
    }
    res.json(restaurant);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// create owner's restaurant
// post /api/owner/restaurent
export const createOwnerRestaurant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const existing = await Restaurent.findOne({ owner: req.user?._id });
    if (existing) {
      res
        .status(400)
        .json({ message: "You already have Restaurant Registared" });
      return;
    }
    const {
      name,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      tags,
      availableSlots,
      totalSeats,
    } = req.body;

    if (
      !name ||
      !description ||
      !cuisine ||
      !priceRange ||
      !location ||
      !address ||
      !chef
    ) {
      res.status(400).json({ message: "Please provide All required Fields" });
      return;
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const slugExists = await Restaurent.findOne({ slug });
    if (slugExists) {
      res
        .status(400)
        .json({ message: "A restaurant with this name Already Exists" });
      return;
    }

    // handle image
    let imageUrl = "";
    if (req.file) {
      const result = await uplodeToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    // setup parsed tags and slots
    const parsedTags =
      typeof tags === "string"
        ? tags.split(",").map((t) => t.trim())
        : tags || [];
    const parsedSlots =
      typeof availableSlots === "string"
        ? availableSlots.split(",").map((s) => s.trim())
        : availableSlots || ["17:00", "18:00", "19:00", "20:00", "21:00"];

    const restaurant = await Restaurent.create({
      name,
      slug,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      image: imageUrl,
      tags: parsedTags,
      availableSlots: parsedSlots,
      totalSeats: totalSeats ? Number(totalSeats) : 20,
      owner: req.user?._id,
      status: "pending",
    });
    res.status(201).json(restaurant);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Update owner's restaurant
// put /api/owner/restaurent
export const updateOwnerRestaurant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const restaurant = await Restaurent.findOne({ owner: req.user?._id });
    if (!restaurant) {
      res.status(404).json({ message: "Restaurant Profile Not Found" });
      return;
    }
    const {
      name,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      tags,
      availableSlots,
      totalSeats,
    } = req.body;

    if (name) restaurant.name = name;
    if (description) restaurant.description = description;
    if (cuisine) restaurant.cuisine = cuisine;
    if (priceRange) restaurant.priceRange = priceRange;
    if (location) restaurant.location = location;
    if (address) restaurant.address = address;
    if (chef) restaurant.chef = chef;
    if (totalSeats) restaurant.totalSeats = totalSeats;

    if (tags) {
      restaurant.tags =
        typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : tags;
    }

    if (availableSlots) {
      restaurant.availableSlots =
        typeof availableSlots === "string"
          ? availableSlots.split(",").map((s) => s.trim())
          : availableSlots;
    }

    // Handle new image upload if any
    if (req.file) {
      const result = await uplodeToCloudinary(req.file.buffer);
      restaurant.image = result.secure_url;
    }

    const update = await restaurant.save();
    res.json(update);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// get bookings for owner restaurant
// Get /api/owner/bookings
export const getOwnerBookings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const restaurant = await Restaurent.findOne({ owner: req.user?._id });

    if (!restaurant) {
      res.status(404).json({ message: "Restaurent Profile Not Found" });
      return;
    }

    const bookings = await Booking.find({ restaurant: restaurant._id })
      .populate("user", "name email phone")
      .sort({ date: -1, time: -1 });

    res.json(bookings);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// update status of a booking
// put /api/owner/bookings/:id/status
export const updateBookingStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status || !["confirmed", "cancilled", "completed"].includes(status)) {
      res.status(400).json({ message: "Please enter a Valid Booking Status" });
      return;
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ message: "Booking not Found" });
      return;
    }
    // Verify booking belongs to the owner's restaurant
    const restaurant = await Restaurent.findById(booking.restaurant);
    if (
      !restaurant ||
      restaurant.owner.toString() !== req.user?._id.toString()
    ) {
      res
        .status(401)
        .json({ message: "Not Authorised to Menage this bookings" });
      return;
    }

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};
