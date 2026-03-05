import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/User";
import bcrypt from "bcrypt";
import { ApiError } from "../errors/ApiError";
import crypto from "crypto";
import { USER_ROLES, type UserRole } from "../constants/roles";
import { ProductModel } from "../models/Product";

//implement jwt
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { sendEmail } from "../utils/mailer";

//jwt token access
const createAccessToken = (userId: string, role: UserRole) => {
  return jwt.sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: "15m",
  });
};

//jwt token refresh
const createRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  });
};

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, name, address, password, role } = req.body as {
      email: string;
      name: string;
      address?: string;
      password: string;
      role?: UserRole;
    };
    const normalizedRole =
      role === USER_ROLES.SELLER ? USER_ROLES.SELLER : USER_ROLES.CUSTOMER;

    const SALT = 10;
    const hashedPassword = await bcrypt.hash(password, SALT);
    const user = new UserModel({
      email,
      name,
      address,
      password: hashedPassword,
      role: normalizedRole,
      sellerApproved: normalizedRole !== USER_ROLES.SELLER,
      sellerActive: normalizedRole !== USER_ROLES.SELLER,
    });
    await user.save();

  

    //res.status(201).json(user); now try to get user data without password showing
    const userWithoutPassword = {
      _id: user._id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      sellerApproved: user.sellerApproved,
      sellerActive: user.sellerActive,
    };
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await UserModel.find().select("-password"); //excluded password
    res.status(200).json(users);
  } catch (error: any) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    //jwt 2 types token addition

    const accessToken = createAccessToken(user._id.toString(), user.role);

    const refreshToken = createRefreshToken(user._id.toString());

    const isProd = process.env.NODE_ENV === "production";

    //cookie

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000, //7 days,
      path: "/",
    });

   

    const userWithoutPassword = {
      _id: user._id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      sellerApproved: user.sellerApproved,
      sellerActive: user.sellerActive,
      accessToken,
    };

    res.status(200).json(userWithoutPassword);
  } catch (err: any) {
    next(err);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw new ApiError(401, "Refresh token missing");
    }

    jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET!,
      async (
        err: Error | null,
        decoded: string | jwt.JwtPayload | undefined
      ) => {
        if (err) {
          if (err instanceof TokenExpiredError) {
            return next(new ApiError(401, "Refresh token expired"));
          } else if (err instanceof JsonWebTokenError) {
            return next(new ApiError(401, "Invalid refresh token"));
          } else {
            return next(new ApiError(401, "Refresh token error"));
          }
        }

        if (!decoded || typeof decoded === "string") {
          return next(new ApiError(401, "Refresh token payload error"));
        }

        const userId = decoded.userId as string;

        const user = await UserModel.findById(userId);

        if (!user) {
          return next(new ApiError(401, "User not found"));
        }

        const newAccessToken = createAccessToken(user._id.toString(), user.role);

        res.status(200).json({
          accessToken: newAccessToken,
        });
      }
    );
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
  try {
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: isProd,
      expires: new Date(0),
      path: "/",
    });

    

    res.status(200).json({ message: "Logout successfully" });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId; // ensure middleware extracts this
    const { currentPassword, newPassword } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new ApiError(401, "Current password is incorrect");

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;
    const { name, email, address } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { name, email, address },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

   
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId; // Make sure your auth middleware sets this

    if (!userId) {
      throw new ApiError(401, "Unauthorized: user ID missing");
    }

    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Example forgotPassword controller

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(200)
        .json({
          message: "If an account exists, a reset token has been sent.",
        });
    }

    // Generate reset token (plain)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash and store token
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    await user.save();

    const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    const resetLink = `${clientOrigin.replace(/\/$/, "")}/reset-password/${encodeURIComponent(resetToken)}`;

    // Email content: include direct reset link + fallback token
    const htmlContent = `
      <p>Hello ${user.name || "User"},</p>
      <p>You requested a password reset. Click the button below to set a new password:</p>
      <p style="margin: 16px 0;">
        <a
          href="${resetLink}"
          style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;"
        >
          Reset Password
        </a>
      </p>
      <p>If the button doesn't work, open this link in your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>You can also use this token manually if needed:</p>
      <p><b>${resetToken}</b></p>
      <p>This token will expire in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await sendEmail(user.email, "Your Password Reset Token", htmlContent);

 

    res
      .status(200)
      .json({ message: "If an account exists, a reset token has been sent." });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    const { newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() }, // Ensure token is not expired
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

   

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
};

export const bootstrapAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, name, password, address, setupSecret } = req.body as {
      email?: string;
      name?: string;
      password?: string;
      address?: string;
      setupSecret?: string;
    };

    const expectedSecret = process.env.ADMIN_SETUP_SECRET;
    if (!expectedSecret) {
      throw new ApiError(500, "ADMIN_SETUP_SECRET is not configured");
    }

    if (!setupSecret || setupSecret !== expectedSecret) {
      throw new ApiError(403, "Invalid admin setup secret");
    }

    const existingAdminCount = await UserModel.countDocuments({
      role: USER_ROLES.ADMIN,
    });

    if (existingAdminCount > 0) {
      throw new ApiError(
        409,
        "Admin already exists. Use admin-only endpoints for additional admins."
      );
    }

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      existingUser.role = USER_ROLES.ADMIN;
      existingUser.sellerApproved = true;
      existingUser.sellerActive = true;
      if (password) {
        existingUser.password = await bcrypt.hash(password, 10);
      }
      await existingUser.save();

      return res.status(200).json({
        message: "Existing user promoted to admin",
        user: {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          address: existingUser.address,
          role: existingUser.role,
          sellerApproved: existingUser.sellerApproved,
          sellerActive: existingUser.sellerActive,
        },
      });
    }

    if (!name || !password) {
      throw new ApiError(400, "Name and password are required for new admin");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await UserModel.create({
      email,
      name,
      address,
      password: hashedPassword,
      role: USER_ROLES.ADMIN,
      sellerApproved: true,
      sellerActive: true,
    });

    return res.status(201).json({
      message: "Admin created successfully",
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        address: adminUser.address,
        role: adminUser.role,
        sellerApproved: adminUser.sellerApproved,
        sellerActive: adminUser.sellerActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, name, password, address } = req.body as {
      email?: string;
      name?: string;
      password?: string;
      address?: string;
    };

    if (!email || !name || !password) {
      throw new ApiError(400, "Name, email and password are required");
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await UserModel.create({
      email,
      name,
      address,
      password: hashedPassword,
      role: USER_ROLES.ADMIN,
      sellerApproved: true,
      sellerActive: true,
    });

    res.status(201).json({
      message: "Admin created successfully",
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        address: adminUser.address,
        role: adminUser.role,
        sellerApproved: adminUser.sellerApproved,
        sellerActive: adminUser.sellerActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const promoteUserToAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    user.role = USER_ROLES.ADMIN;
    user.sellerApproved = true;
    user.sellerActive = true;
    await user.save();

    res.status(200).json({
      message: "User promoted to admin successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        sellerApproved: user.sellerApproved,
        sellerActive: user.sellerActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingSellers = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pendingSellers = await UserModel.find({
      role: USER_ROLES.SELLER,
      sellerApproved: { $ne: true },
    }).select("-password");

    res.status(200).json(pendingSellers);
  } catch (error) {
    next(error);
  }
};

export const approveSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(404, "Seller not found");
    }
    if (user.role !== USER_ROLES.SELLER) {
      throw new ApiError(400, "User is not a seller");
    }

    user.sellerApproved = true;
    user.sellerActive = true;
    await user.save();

    res.status(200).json({
      message: "Seller approved successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        sellerApproved: user.sellerApproved,
        sellerActive: user.sellerActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getApprovedSellers = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const approvedSellers = await UserModel.find({
      role: USER_ROLES.SELLER,
      sellerApproved: true,
    }).select("-password");

    res.status(200).json(approvedSellers);
  } catch (error) {
    next(error);
  }
};

export const updateSellerActiveStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const { sellerActive } = req.body as { sellerActive?: boolean };

    if (typeof sellerActive !== "boolean") {
      throw new ApiError(400, "sellerActive must be true or false");
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(404, "Seller not found");
    }
    if (user.role !== USER_ROLES.SELLER) {
      throw new ApiError(400, "User is not a seller");
    }
    if (!user.sellerApproved) {
      throw new ApiError(400, "Seller is not approved yet");
    }

    user.sellerActive = sellerActive;
    await user.save();

    res.status(200).json({
      message: sellerActive ? "Seller activated successfully" : "Seller deactivated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        sellerApproved: user.sellerApproved,
        sellerActive: user.sellerActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    const seller = await UserModel.findById(userId).select("-password");
    if (!seller) {
      throw new ApiError(404, "Seller not found");
    }
    if (seller.role !== USER_ROLES.SELLER) {
      throw new ApiError(400, "User is not a seller");
    }

    const totalProducts = await ProductModel.countDocuments({ seller: seller._id });

    res.status(200).json({
      seller,
      totalProducts,
    });
  } catch (error) {
    next(error);
  }
};

export const removeSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(404, "Seller not found");
    }
    if (user.role !== USER_ROLES.SELLER) {
      throw new ApiError(400, "User is not a seller");
    }

    await ProductModel.deleteMany({ seller: user._id });
    await UserModel.findByIdAndDelete(user._id);

    res.status(200).json({
      message: "Seller removed successfully",
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};
