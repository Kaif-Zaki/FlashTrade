import { Router } from "express";
import {
  placeOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  getSellerOrders,
  updateOrderStatus,
} from "../controllers/order.controller";
import { authenticateToken } from "../middlewares/authenticateToken";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import { USER_ROLES } from "../constants/roles";

const orderRouter = Router();

// all order routes need auth
orderRouter.use(authenticateToken);

// customer routes
orderRouter.post("/", authorizeRoles(USER_ROLES.CUSTOMER), placeOrder); // checkout
orderRouter.get("/my", authorizeRoles(USER_ROLES.CUSTOMER), getUserOrders); // own orders
orderRouter.get("/my/:orderId", authorizeRoles(USER_ROLES.CUSTOMER), getOrderById); // own order detail

// seller routes
orderRouter.get(
  "/seller",
  authorizeRoles(USER_ROLES.SELLER, USER_ROLES.ADMIN),
  getSellerOrders
);

// admin routes
orderRouter.get("/admin", authorizeRoles(USER_ROLES.ADMIN), getAllOrders);

// seller/admin routes
orderRouter.patch(
  "/:orderId/status",
  authorizeRoles(USER_ROLES.SELLER, USER_ROLES.ADMIN),
  updateOrderStatus
);

export default orderRouter;
