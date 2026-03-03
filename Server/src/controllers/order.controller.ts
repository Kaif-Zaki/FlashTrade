import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import Cart from "../models/Cart";
import { ProductModel } from "../models/Product";
import { USER_ROLES } from "../constants/roles";
import { getApplicableCommissionRule } from "../utils/commission";

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
        .select("_id price stock category seller")
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
        const applicableRule = await getApplicableCommissionRule(product.category, item.qty);
        const commissionRate = applicableRule?.ratePercent || 0;
        const grossItemTotal = item.qty * product.price;
        const commissionAmount = (grossItemTotal * commissionRate) / 100;
        const sellerNetAmount = grossItemTotal - commissionAmount;

        orderItems.push({
          product: product._id,
          seller: product.seller,
          qty: item.qty,
          size: item.size,
          color: item.color,
          price: product.price,
          commissionRate,
          commissionAmount,
          sellerNetAmount,
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

// ADMIN: GET ALL ORDERS
export const getAllOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find().populate("items.product user");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// SELLER: GET ORDERS CONTAINING SELLER PRODUCTS
export const getSellerOrders = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId;
    if (!authUserId) return res.status(401).json({ message: "Unauthorized" });

    const orders = await Order.find()
      .populate({
        path: "items.product",
        populate: { path: "seller", select: "_id name email" },
      })
      .populate("user", "name email");

    const sellerOrders = orders
      .map((order) => {
        const sellerItems = order.items.filter(
          (item: any) => item.product?.seller?._id?.toString() === authUserId
        );

        if (sellerItems.length === 0) return null;

        const sellerTotal = sellerItems.reduce(
          (sum, item: any) => sum + (item.price || 0) * (item.qty || 0),
          0
        );
        const sellerCommissionTotal = sellerItems.reduce(
          (sum, item: any) => sum + (item.commissionAmount || 0),
          0
        );
        const sellerNetTotal = sellerItems.reduce(
          (sum, item: any) => sum + (item.sellerNetAmount || 0),
          0
        );

        return {
          _id: order._id,
          user: order.user,
          shippingAddress: order.shippingAddress,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          createdAt: order.createdAt,
          sellerItems,
          sellerTotal,
          sellerCommissionTotal,
          sellerNetTotal,
        };
      })
      .filter(Boolean);

    res.json(sellerOrders);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// SELLER: ANALYTICS SUMMARY
export const getSellerAnalytics = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId;
    if (!authUserId) return res.status(401).json({ message: "Unauthorized" });

    const sellerProducts = await ProductModel.find({ seller: authUserId }).select(
      "_id name stock category"
    );
    const sellerProductIds = sellerProducts.map((product) => product._id.toString());

    const orders = await Order.find().populate({
      path: "items.product",
      select: "name seller",
    });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let dailySales = 0;
    let monthlySales = 0;
    let monthlyCommission = 0;
    let monthlyNetEarnings = 0;

    const soldQtyByProduct = new Map<string, { name: string; soldQty: number }>();

    for (const order of orders) {
      for (const item of order.items as any[]) {
        const itemSellerId =
          item.seller?.toString() || item.product?.seller?.toString() || null;
        if (itemSellerId !== authUserId) continue;

        const grossAmount = (item.price || 0) * (item.qty || 0);
        const commissionAmount = item.commissionAmount || 0;
        const netAmount = item.sellerNetAmount || 0;

        if (order.createdAt >= startOfDay) {
          dailySales += grossAmount;
        }
        if (order.createdAt >= startOfMonth) {
          monthlySales += grossAmount;
          monthlyCommission += commissionAmount;
          monthlyNetEarnings += netAmount;
        }

        const productId = item.product?._id?.toString() || item.product?.toString();
        if (!productId) continue;

        const current = soldQtyByProduct.get(productId) || {
          name: item.product?.name || "Product",
          soldQty: 0,
        };
        current.soldQty += item.qty || 0;
        soldQtyByProduct.set(productId, current);
      }
    }

    const bestSellingProducts = Array.from(soldQtyByProduct.entries())
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        soldQty: data.soldQty,
      }))
      .sort((a, b) => b.soldQty - a.soldQty)
      .slice(0, 5);

    const lowStockAlerts = sellerProducts
      .filter((product) => product.stock <= 10)
      .map((product) => ({
        productId: product._id,
        name: product.name,
        stock: product.stock,
      }))
      .sort((a, b) => a.stock - b.stock);

    res.json({
      totalProducts: sellerProductIds.length,
      dailySales,
      monthlySales,
      monthlyCommission,
      monthlyNetEarnings,
      bestSellingProducts,
      lowStockAlerts,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ADMIN/SELLER: UPDATE ORDER STATUS
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId;
    const authUserRole = req.userRole;
    const { orderStatus } = req.body as {
      orderStatus: "processing" | "shipped" | "delivered";
    };

    if (!authUserId || !authUserRole) return res.status(401).json({ message: "Unauthorized" });
    if (!orderStatus) return res.status(400).json({ message: "orderStatus is required" });

    const order = await Order.findById(req.params.orderId).populate({
      path: "items.product",
      populate: { path: "seller", select: "_id" },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (authUserRole === USER_ROLES.SELLER) {
      const ownsAnyProductInOrder = order.items.some(
        (item: any) => item.product?.seller?._id?.toString() === authUserId
      );
      if (!ownsAnyProductInOrder) {
        return res.status(403).json({ message: "Forbidden for this order" });
      }
    }

    order.orderStatus = orderStatus;
    await order.save();

    const updatedOrder = await Order.findById(order._id).populate("items.product user");
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ADMIN/SELLER: UPDATE PAYMENT STATUS FOR COD ORDERS
export const updateOrderPaymentStatus = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId;
    const authUserRole = req.userRole;
    const { paymentStatus } = req.body as {
      paymentStatus: "pending" | "paid";
    };

    if (!authUserId || !authUserRole) return res.status(401).json({ message: "Unauthorized" });
    if (!paymentStatus) return res.status(400).json({ message: "paymentStatus is required" });
    if (!["pending", "paid"].includes(paymentStatus)) {
      return res.status(400).json({ message: "paymentStatus must be pending or paid" });
    }

    const order = await Order.findById(req.params.orderId).populate({
      path: "items.product",
      populate: { path: "seller", select: "_id" },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentMethod !== "cash") {
      return res.status(400).json({ message: "Only cash on delivery orders can be updated by seller" });
    }

    if (authUserRole === USER_ROLES.SELLER) {
      const ownsAnyProductInOrder = order.items.some(
        (item: any) => item.product?.seller?._id?.toString() === authUserId
      );
      if (!ownsAnyProductInOrder) {
        return res.status(403).json({ message: "Forbidden for this order" });
      }
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    const updatedOrder = await Order.findById(order._id).populate("items.product user");
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
