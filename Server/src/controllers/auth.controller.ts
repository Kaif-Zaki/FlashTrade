import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/User";
import bcrypt from "bcrypt";
import { ApiError } from "../errors/ApiError";
import crypto from "crypto";

//implement jwt
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { sendEmail } from "../utils/mailer";

//jwt token access
const createAccessToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET!, {
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
    const { email, name, address ,password } = req.body;
    const SALT = 10;
    const hashedPassword = await bcrypt.hash(password, SALT);
    const user = new UserModel({
      email,
      name,
      address,
      password: hashedPassword,
    });
    await user.save();

  

    //res.status(201).json(user); now try to get user data without password showing
    const userWithoutPassword = {
      _id: user._id,
      name: user.name,
      email: user.email,
      address: user.address,
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

    const accessToken = createAccessToken(user._id.toString());

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

        const newAccessToken = createAccessToken(user._id.toString());

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

    // Email content: send token as plain text
    const htmlContent = `
      <p>Hello ${user.name || "User"},</p>
      <p>You requested a password reset. Use the following token to reset your password:</p>
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
