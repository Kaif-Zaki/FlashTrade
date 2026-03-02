import { Request, Response } from "express";
import {ProductModel} from "../models/Product";

// GET ALL PRODUCTS
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await ProductModel.find().populate("category");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// GET SINGLE PRODUCT
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// GET PRODUCTS BY CATEGORY
export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const products = await ProductModel.find({ category: req.params.categoryId }).populate("category");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};