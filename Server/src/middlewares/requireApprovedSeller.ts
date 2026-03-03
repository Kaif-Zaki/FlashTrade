import { type NextFunction, type Request, type Response } from "express";
import { UserModel } from "../models/User";
import { ApiError } from "../errors/ApiError";
import { USER_ROLES } from "../constants/roles";

export const requireApprovedSeller = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId || !req.userRole) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (req.userRole === USER_ROLES.ADMIN) {
      return next();
    }

    if (req.userRole !== USER_ROLES.SELLER) {
      return next(new ApiError(403, "Forbidden"));
    }

    const seller = await UserModel.findById(req.userId).select("sellerApproved sellerActive");
    if (!seller || !seller.sellerApproved) {
      return next(new ApiError(403, "Seller account is pending admin approval"));
    }
    if (seller.sellerActive === false) {
      return next(new ApiError(403, "Seller account is currently inactive"));
    }

    next();
  } catch (error) {
    next(error);
  }
};
