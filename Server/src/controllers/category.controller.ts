import { Request, Response } from "express";
import {CategoryModel} from "../models/Category";

// GET ALL CATEGORIES
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await CategoryModel.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};