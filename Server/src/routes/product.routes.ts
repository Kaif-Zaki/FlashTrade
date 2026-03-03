import { Router } from "express";
import {
  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductAsAdmin,
  getSellerProductsForAdmin,
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
  authorizeRoles(USER_ROLES.SELLER),
  requireApprovedSeller,
  getMyProducts
);
productRouter.get(
  "/admin/seller/:sellerId",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  getSellerProductsForAdmin
);
productRouter.post(
  "/",
  authenticateToken,
  authorizeRoles(USER_ROLES.SELLER),
  requireApprovedSeller,
  createProduct
);
productRouter.put(
  "/:id",
  authenticateToken,
  authorizeRoles(USER_ROLES.SELLER),
  requireApprovedSeller,
  updateProduct
);
productRouter.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(USER_ROLES.SELLER),
  requireApprovedSeller,
  deleteProduct
);
productRouter.delete(
  "/admin/:id",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  deleteProductAsAdmin
);
productRouter.get("/:id", getProductById);

export default productRouter;
