import { Router } from "express";
import {
  createOwnerRestaurant,
  getOwnerBookings,
  getOwnerRestaurant,
  updateBookingStatus,
  updateOwnerRestaurant,
} from "../controllers/ownercontroller.js";
import uplode from "../config/multer.js";
import { ownerOnly, protect } from "../middlewares/auth.js";

const ownerRouter = Router();

ownerRouter.use(protect);
ownerRouter.use(ownerOnly);

ownerRouter.get("/restaurant", getOwnerRestaurant);
ownerRouter.post("/restaurant", uplode.single("image"), createOwnerRestaurant);
ownerRouter.put("/restaurant", uplode.single("image"), updateOwnerRestaurant);
ownerRouter.get("/bookings", getOwnerBookings);
ownerRouter.put("/bookings/:id/status", updateBookingStatus);

export default ownerRouter;
