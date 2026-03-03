import { type Request, type Response } from "express";
import mongoose from "mongoose";
import { ProductModel } from "../models/Product";

const productPopulate = [
  { path: "category" },
  { path: "seller", select: "name email role" },
];

const sanitizeSizePrices = (sizePrices?: Record<string, unknown>, sizes?: string[]) => {
  if (!sizePrices || typeof sizePrices !== "object") return {};
  const allowedSizes = new Set((sizes || []).map((size) => size.trim()));
  const normalized = Object.entries(sizePrices).reduce<Record<string, number>>((acc, [size, rawPrice]) => {
    const sizeKey = size.trim();
    if (!sizeKey || (allowedSizes.size > 0 && !allowedSizes.has(sizeKey))) return acc;
    const parsed = Number(rawPrice);
    if (!Number.isFinite(parsed) || parsed < 0) return acc;
    acc[sizeKey] = parsed;
    return acc;
  }, {});
  return normalized;
};

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

export const getSellerProductsForAdmin = async (req: Request, res: Response) => {
  try {
    const sellerId = Array.isArray(req.params.sellerId) ? req.params.sellerId[0] : req.params.sellerId;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid seller id" });
    }

    const products = await ProductModel.find({ seller: sellerId }).populate(productPopulate);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId;

    if (!authUserId || req.userRole !== "seller") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, description, price, stock, images, sizes, colors, sizePrices, category } = req.body as {
      name: string;
      description: string;
      price: number;
      stock: number;
      images: string[];
      sizes?: string[];
      colors?: string[];
      sizePrices?: Record<string, unknown>;
      category: string;
    };

    const product = await ProductModel.create({
      name,
      description,
      price,
      stock,
      images,
      sizes,
      colors,
      sizePrices: sanitizeSizePrices(sizePrices, sizes),
      category,
      seller: authUserId,
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
    const rawProductId = req.params.id;
    const productId = Array.isArray(rawProductId) ? rawProductId[0] : rawProductId;

    if (!authUserId || req.userRole !== "seller") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existingProduct = await ProductModel.findById(productId);
    if (!existingProduct) return res.status(404).json({ message: "Product not found" });

    if (existingProduct.seller.toString() !== authUserId) {
      return res.status(403).json({ message: "Forbidden for this product" });
    }

    const updates = req.body as Record<string, unknown>;

    if (updates.sizes || updates.sizePrices) {
      const nextSizes = Array.isArray(updates.sizes)
        ? (updates.sizes as string[])
        : (existingProduct.sizes || []);
      const rawSizePrices =
        updates.sizePrices !== undefined
          ? (updates.sizePrices as Record<string, unknown> | undefined)
          : Object.fromEntries((existingProduct.sizePrices || new Map()).entries());
      const nextSizePrices = sanitizeSizePrices(rawSizePrices, nextSizes);
      updates.sizePrices = nextSizePrices;
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
    const rawProductId = req.params.id;
    const productId = Array.isArray(rawProductId) ? rawProductId[0] : rawProductId;

    if (!authUserId || req.userRole !== "seller") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existingProduct = await ProductModel.findById(productId);
    if (!existingProduct) return res.status(404).json({ message: "Product not found" });

    if (existingProduct.seller.toString() !== authUserId) {
      return res.status(403).json({ message: "Forbidden for this product" });
    }

    await ProductModel.findByIdAndDelete(productId);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteProductAsAdmin = async (req: Request, res: Response) => {
  try {
    const rawProductId = req.params.id;
    const productId = Array.isArray(rawProductId) ? rawProductId[0] : rawProductId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existingProduct = await ProductModel.findById(productId);
    if (!existingProduct) return res.status(404).json({ message: "Product not found" });

    await ProductModel.findByIdAndDelete(productId);
    res.json({ message: "Product removed by admin successfully", productId });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
