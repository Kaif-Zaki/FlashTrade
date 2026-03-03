import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { authenticateToken } from "../middlewares/authenticateToken";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import { USER_ROLES } from "../constants/roles";

const categoryRouter = Router();

// all categories are public
categoryRouter.get("/", getCategories);
categoryRouter.post(
  "/",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  createCategory
);
categoryRouter.put(
  "/:id",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  updateCategory
);
categoryRouter.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  deleteCategory
);

export default categoryRouter;
