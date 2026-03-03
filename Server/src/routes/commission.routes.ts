import { Router } from "express";
import {
  createCommissionRule,
  deleteCommissionRule,
  estimateCommission,
  getCommissionRules,
  updateCommissionRule,
} from "../controllers/commission.controller";
import { authenticateToken } from "../middlewares/authenticateToken";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import { USER_ROLES } from "../constants/roles";

const commissionRouter = Router();

commissionRouter.get("/estimate", authenticateToken, estimateCommission);
commissionRouter.get(
  "/",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  getCommissionRules
);
commissionRouter.post(
  "/",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  createCommissionRule
);
commissionRouter.put(
  "/:id",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  updateCommissionRule
);
commissionRouter.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  deleteCommissionRule
);

export default commissionRouter;
