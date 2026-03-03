import { type Request, type Response } from "express";
import mongoose from "mongoose";
import { ProductModel } from "../models/Product";
import { USER_ROLES } from "../constants/roles";

const productPopulate = [
  { path: "category" },
  { path: "seller", select: "name email role" },
];

export const getProducts = async (req: Request, res: Response) => {
  try {
    const seller = req.query.sellerId as string | undefined;
    const category = req.query.categoryId as string | undefined;
    const filter: Record<string, unknown> = {};

    if (seller) {
      filter.seller = seller;
    }
    if (category) {
      filter.category = category;
    }

    const products = await ProductModel.find(filter).populate(productPopulate);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findById(req.params.id).populate(productPopulate);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const products = await ProductModel.find({ category: req.params.categoryId }).populate(productPopulate);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getMyProducts = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId;
    if (!authUserId) return res.status(401).json({ message: "Unauthorized" });

    const products = await ProductModel.find({ seller: authUserId }).populate(productPopulate);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId;
    const authUserRole = req.userRole;

    if (!authUserId || !authUserRole) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, description, price, stock, images, sizes, colors, category, sellerId } = req.body as {
      name: string;
      description: string;
      price: number;
      stock: number;
      images: string[];
      sizes?: string[];
      colors?: string[];
      category: string;
      sellerId?: string;
    };

    const seller =
      authUserRole === USER_ROLES.ADMIN && sellerId ? sellerId : authUserId;

    const product = await ProductModel.create({
      name,
      description,
      price,
      stock,
      images,
      sizes,
      colors,
      category,
      seller,
    });

    const createdProduct = await ProductModel.findById(product._id).populate(productPopulate);
    res.status(201).json(createdProduct);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId;
    const authUserRole = req.userRole;
    const rawProductId = req.params.id;
    const productId = Array.isArray(rawProductId) ? rawProductId[0] : rawProductId;

    if (!authUserId || !authUserRole) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existingProduct = await ProductModel.findById(productId);
    if (!existingProduct) return res.status(404).json({ message: "Product not found" });

    const isOwner = existingProduct.seller.toString() === authUserId;
    const isAdmin = authUserRole === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden for this product" });
    }

    const { sellerId, ...updates } = req.body as Record<string, unknown> & {
      sellerId?: string;
    };

    if (isAdmin && sellerId) {
      updates.seller = sellerId;
    }

    const updated = await ProductModel.findByIdAndUpdate(productId, updates, {
      new: true,
      runValidators: true,
    }).populate(productPopulate);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId;
    const authUserRole = req.userRole;
    const rawProductId = req.params.id;
    const productId = Array.isArray(rawProductId) ? rawProductId[0] : rawProductId;

    if (!authUserId || !authUserRole) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existingProduct = await ProductModel.findById(productId);
    if (!existingProduct) return res.status(404).json({ message: "Product not found" });

    const isOwner = existingProduct.seller.toString() === authUserId;
    const isAdmin = authUserRole === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden for this product" });
    }

    await ProductModel.findByIdAndDelete(productId);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
