import { Request, Response } from "express";
import Cart from "../models/Cart";
import { ProductModel } from "../models/Product";



// GET CURRENT USER CART
export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) return res.json({ items: [] });
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};


// ADD ITEM TO CART
export const addToCart = async (req: Request, res: Response) => {
  try {
    const { product, qty, size, color } = req.body;
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!product || typeof qty !== "number" || qty <= 0) {
      return res.status(400).json({ message: "Invalid product or quantity" });
    }

    const targetProduct = await ProductModel.findById(product).select("_id stock sizes colors");
    if (!targetProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (size && targetProduct.sizes?.length && !targetProduct.sizes.includes(size)) {
      return res.status(400).json({ message: "Invalid size for this product" });
    }
    if (color && targetProduct.colors?.length && !targetProduct.colors.includes(color)) {
      return res.status(400).json({ message: "Invalid color for this product" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      if (qty > targetProduct.stock) {
        return res.status(400).json({ message: "Not enough stock" });
      }
      cart = new Cart({ user: userId, items: [{ product, qty, size, color }] });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === product &&
          (item.size || "") === (size || "") &&
          (item.color || "") === (color || "")
      );
      if (itemIndex > -1) {
        if (cart.items[itemIndex].qty + qty > targetProduct.stock) {
          return res.status(400).json({ message: "Not enough stock" });
        }
        cart.items[itemIndex].qty += qty;
      } else {
        if (qty > targetProduct.stock) {
          return res.status(400).json({ message: "Not enough stock" });
        }
        cart.items.push({ product, qty, size, color });
      }
    }
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// REMOVE ITEM FROM CART
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const { productId, size, color } = req.body;
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => {
      if (item.product.toString() !== productId) return true;

      const sizeMatches = (size || "") === (item.size || "");
      const colorMatches = (color || "") === (item.color || "");

      if (size === undefined && color === undefined) return false;
      return !(sizeMatches && colorMatches);
    });
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
