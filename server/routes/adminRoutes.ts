import { Router } from "express";
import {
  approveRestaurant,
  getAdminStats,
  getAllRestaurants,
} from "../controllers/admincontroller.js";
import { adminOnly, protect } from "../middlewares/auth.js";

const adminRouter = Router();

adminRouter.use(protect);
adminRouter.use(adminOnly);

adminRouter.get("/restaurants", getAllRestaurants);
adminRouter.put("/restaurants/:id/approve", approveRestaurant);
adminRouter.get("/stats", getAdminStats);

export default adminRouter;
