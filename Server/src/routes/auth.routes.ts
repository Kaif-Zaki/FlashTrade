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
  resetPassword
} from "../controllers/auth.controller";

import { authenticateToken } from "../middlewares/authenticateToken";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import { USER_ROLES } from "../constants/roles";

const authRouter = Router();

authRouter.post("/signup", signUp);
authRouter.post("/login", login);
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

export default authRouter;
