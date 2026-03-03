import { type NextFunction, type Request, type Response } from "express";
import { ApiError } from "../errors/ApiError";
import type { UserRole } from "../constants/roles";

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userId) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return next(new ApiError(403, "Forbidden: insufficient permissions"));
    }

    next();
  };
};
