import { Router } from "express";
import {
  getFeaturedRestaurants,
  getRestaurantAvailability,
  getRestaurantBySlug,
  getRestaurants,
} from "../controllers/restaurentcontroller.js";

const restaurentRouter = Router();

restaurentRouter.get("/", getRestaurants);
restaurentRouter.get("/featured", getFeaturedRestaurants);
restaurentRouter.get("/:slug", getRestaurantBySlug);
restaurentRouter.get("/:id/availability", getRestaurantAvailability);

export default restaurentRouter;
