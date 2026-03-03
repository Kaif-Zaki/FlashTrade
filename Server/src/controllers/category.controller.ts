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

// CREATE CATEGORY (ADMIN)
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, imageUrl } = req.body as {
      name?: string;
      description?: string;
      imageUrl?: string;
    };

    if (!name?.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await CategoryModel.create({
      name: name.trim(),
      description: description?.trim() || "",
      imageUrl: imageUrl?.trim() || "",
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// UPDATE CATEGORY (ADMIN)
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, description, imageUrl } = req.body as {
      name?: string;
      description?: string;
      imageUrl?: string;
    };

    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      categoryId,
      {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(imageUrl !== undefined ? { imageUrl: imageUrl.trim() } : {}),
      },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(updatedCategory);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// DELETE CATEGORY (ADMIN)
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deletedCategory = await CategoryModel.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
