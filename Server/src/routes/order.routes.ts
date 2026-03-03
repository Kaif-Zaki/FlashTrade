import { Router } from "express";
import {
  placeOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  getSellerOrders,
  getSellerAnalytics,
  updateOrderStatus,
  updateOrderPaymentStatus,
} from "../controllers/order.controller";
import { authenticateToken } from "../middlewares/authenticateToken";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import { USER_ROLES } from "../constants/roles";
import { requireApprovedSeller } from "../middlewares/requireApprovedSeller";

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
  requireApprovedSeller,
  getSellerOrders
);
orderRouter.get(
  "/seller/analytics",
  authorizeRoles(USER_ROLES.SELLER, USER_ROLES.ADMIN),
  requireApprovedSeller,
  getSellerAnalytics
);

// admin routes
orderRouter.get("/admin", authorizeRoles(USER_ROLES.ADMIN), getAllOrders);

// seller/admin routes
orderRouter.patch(
  "/:orderId/status",
  authorizeRoles(USER_ROLES.SELLER, USER_ROLES.ADMIN),
  requireApprovedSeller,
  updateOrderStatus
);
orderRouter.patch(
  "/:orderId/payment-status",
  authorizeRoles(USER_ROLES.SELLER, USER_ROLES.ADMIN),
  requireApprovedSeller,
  updateOrderPaymentStatus
);

export default orderRouter;
