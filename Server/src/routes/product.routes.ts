import { Router } from "express";
import {
  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
} from "../controllers/product.controller";
import { authenticateToken } from "../middlewares/authenticateToken";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import { USER_ROLES } from "../constants/roles";
import { requireApprovedSeller } from "../middlewares/requireApprovedSeller";

const productRouter = Router();

// public routes
productRouter.get("/", getProducts);
productRouter.get("/category/:categoryId", getProductsByCategory);

// seller/admin routes
productRouter.get(
  "/seller/me",
  authenticateToken,
  authorizeRoles(USER_ROLES.SELLER, USER_ROLES.ADMIN),
  requireApprovedSeller,
  getMyProducts
);
productRouter.post(
  "/",
  authenticateToken,
  authorizeRoles(USER_ROLES.SELLER, USER_ROLES.ADMIN),
  requireApprovedSeller,
  createProduct
);
productRouter.put(
  "/:id",
  authenticateToken,
  authorizeRoles(USER_ROLES.SELLER, USER_ROLES.ADMIN),
  requireApprovedSeller,
  updateProduct
);
productRouter.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(USER_ROLES.SELLER, USER_ROLES.ADMIN),
  requireApprovedSeller,
  deleteProduct
);
productRouter.get("/:id", getProductById);

export default productRouter;
