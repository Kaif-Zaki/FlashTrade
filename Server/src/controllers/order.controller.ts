import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import Cart from "../models/Cart";
import { ProductModel } from "../models/Product";

type HttpError = Error & { status?: number };

const createHttpError = (status: number, message: string): HttpError => {
  const err = new Error(message) as HttpError;
  err.status = status;
  return err;
};

// PLACE ORDER
export const placeOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    const authUserId = (req as any).userId as string | undefined;
    const { shippingAddress, paymentMethod } = req.body as {
      userId?: string;
      shippingAddress?: string;
      paymentMethod?: string;
    };

    if (!authUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ message: "Shipping address and payment method are required" });
    }

    let createdOrderId = "";

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: authUserId }).session(session);
      if (!cart || cart.items.length === 0) {
        throw createHttpError(400, "Cart is empty");
      }

      const productIds = Array.from(new Set(cart.items.map((item) => item.product.toString())));
      const products = await ProductModel.find({ _id: { $in: productIds } })
        .select("_id price stock")
        .session(session);

      const productMap = new Map(products.map((product) => [product._id.toString(), product]));

      let totalPrice = 0;
      const orderItems = [];

      for (const item of cart.items) {
        const productId = item.product.toString();
        const product = productMap.get(productId);

        if (!product) {
          throw createHttpError(404, `Product not found for id ${productId}`);
        }

        if (item.qty <= 0) {
          throw createHttpError(400, "Invalid cart quantity");
        }

        const updated = await ProductModel.updateOne(
          { _id: product._id, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } },
          { session }
        );

        if (updated.modifiedCount === 0) {
          throw createHttpError(400, `Insufficient stock for product ${productId}`);
        }

        totalPrice += item.qty * product.price;
        orderItems.push({
          product: product._id,
          qty: item.qty,
          size: item.size,
          color: item.color,
          price: product.price,
        });
      }

      const [order] = await Order.create(
        [
          {
            user: authUserId,
            items: orderItems,
            totalPrice,
            shippingAddress,
            paymentMethod,
            paymentStatus: "pending",
          },
        ],
        { session }
      );

      cart.items = [];
      await cart.save({ session });

      createdOrderId = order._id.toString();
    });

    const createdOrder = await Order.findById(createdOrderId).populate("items.product");
    res.status(201).json(createdOrder);
  } catch (err) {
    const error = err as HttpError;
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  } finally {
    await session.endSession();
  }
};

// GET USER ORDERS
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).userId as string | undefined;
    if (!authUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orders = await Order.find({ user: authUserId }).populate("items.product");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// GET SINGLE ORDER
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).userId as string | undefined;
    if (!authUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const order = await Order.findById(req.params.orderId).populate("items.product");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user.toString() !== authUserId) {
      return res.status(403).json({ message: "Forbidden for this order" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
