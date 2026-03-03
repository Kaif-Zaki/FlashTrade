import { Router } from "express";
import {
  signUp,
  getAllUsers,
  login,
  refreshToken,
  logout,
  changePassword,
  updateProfile,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  bootstrapAdmin,
  createAdmin,
  promoteUserToAdmin,
  getPendingSellers,
  approveSeller,
  getApprovedSellers,
  getSellerById,
  removeSeller,
  updateSellerActiveStatus,
} from "../controllers/auth.controller";

import { authenticateToken } from "../middlewares/authenticateToken";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import { USER_ROLES } from "../constants/roles";

const authRouter = Router();

authRouter.post("/signup", signUp);
authRouter.post("/login", login);
authRouter.post("/bootstrap-admin", bootstrapAdmin);
authRouter.get(
  "/users",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  getAllUsers
);
authRouter.post("/refresh-token", refreshToken);
authRouter.put("/change-password", authenticateToken, changePassword);
authRouter.put("/update-profile", authenticateToken, updateProfile);
authRouter.get("/profile", authenticateToken, getCurrentUser);
authRouter.post("/logout", logout);

authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password/:token", resetPassword);
authRouter.post(
  "/admins",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  createAdmin
);
authRouter.patch(
  "/admins/:userId/promote",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  promoteUserToAdmin
);
authRouter.get(
  "/sellers/pending",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  getPendingSellers
);
authRouter.patch(
  "/sellers/:userId/approve",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  approveSeller
);
authRouter.get(
  "/sellers/approved",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  getApprovedSellers
);
authRouter.get(
  "/sellers/:userId",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  getSellerById
);
authRouter.patch(
  "/sellers/:userId/status",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  updateSellerActiveStatus
);
authRouter.delete(
  "/sellers/:userId",
  authenticateToken,
  authorizeRoles(USER_ROLES.ADMIN),
  removeSeller
);

export default authRouter;
