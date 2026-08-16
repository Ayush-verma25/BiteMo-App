import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Restaurent } from "../models/Restaurent.js";
import { Booking } from "../models/booking.js";

// Creating a new Booking
//Post /api/bookings
// @access Private
export const createBooking = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { restaurantId, date, time, guests, occasion, specialRequests } =
      req.body;

    if (!restaurantId || !date || !time || !guests) {
      res
        .status(400)
        .json({ message: "Please provide All required Reservation Details" });
      return;
    }

    // check if restaurent exists
    const restaurant = await Restaurent.findById(restaurantId);
    if (!restaurant) {
      res.status(404).json({ message: "Restaurent Not Found!" });
      return;
    }

    // Check Restaurent is Varified or Not
    if (restaurant.status !== "approved") {
      res.status(400).json({
        message: "Reservations Are not open For this Restaurent yet!",
      });
      return;
    }

    // verify seats Availablity
    const requestedGuests = Number(guests);
    const existingBookings = await Booking.find({
      restaurant: restaurantId,
      date: new Date(date),
      time,
      status: "confirmed",
    });

    const bookedSeats = existingBookings.reduce((sum, b) => sum + b.guests, 0);

    const totalSeats = restaurant.totalSeats || 20;

    const availableSeats = totalSeats - bookedSeats;

    if (requestedGuests > availableSeats) {
      res.status(400).json({
        message: `Unable to reserve. Only ${availableSeats} seasts are available for this time slot.`,
      });
    }

    const booking = await Booking.create({
      user: req.user?._id,
      restaurant: restaurantId,
      date: new Date(date),
      time,
      guests: Number(guests),
      occasion,
      specialRequests,
      status: "confirmed",
    });

    // restaurent Info Before returning
    const populatedBooking = await booking.populate(
      "restaurant",
      "name location image address",
    );

    res.status(201).json(populatedBooking);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// geting user booking Details
//get /api/bookings/my
// @access Private
export const getMyBookings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const bookings = await Booking.find({ user: req.user?._id })
      .populate("restaurant", "name location image address slug")
      .sort({ date: -1, time: -1 });
    res.json(bookings);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Booking Canceliation
//Put /api/bookings/:id/cancel
// @access Private
export const cancelBooking = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(400).json({ message: "Booking not Found" });
      return;
    }

    // Verify user ownes the Booking
    if (booking.user.toString() !== req.user?._id.toString()) {
      res
        .status(401)
        .json({ message: "Not Authorised To cancel this booking" });
      return;
    }

    booking.status = "cancelled";
    await booking.save();

    const populatedBooking = await booking.populate(
      "restaurant",
      "name location image address",
    );
    res.json(populatedBooking);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};
