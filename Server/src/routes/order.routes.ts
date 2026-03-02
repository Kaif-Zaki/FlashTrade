import { Router } from "express";
import {
  placeOrder,
  getUserOrders,
  getOrderById,
} from "../controllers/order.controller";
import { authenticateToken } from "../middlewares/authenticateToken";

const orderRouter = Router();

// all order routes need auth
orderRouter.use(authenticateToken);

orderRouter.post("/", placeOrder); // checkout
orderRouter.get("/:userId", getUserOrders); // user orders
orderRouter.get("/order/:orderId", getOrderById); // single order

export default orderRouter;
