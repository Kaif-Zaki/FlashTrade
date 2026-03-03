import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import Cart from "../models/Cart";
import { ProductModel } from "../models/Product";
import { getApplicableCommissionRule } from "../utils/commission";

type HttpError = Error & { status?: number };

const createHttpError = (status: number, message: string): HttpError => {
  const err = new Error(message) as HttpError;
  err.status = status;
  return err;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const resolveUnitPrice = (
  product: { price: number; sizePrices?: Map<string, number> | Record<string, number> },
  size?: string
) => {
  if (!size) return product.price;
  const sizeKey = size.trim();
  if (!sizeKey) return product.price;

  if (product.sizePrices instanceof Map) {
    const byMap = product.sizePrices.get(sizeKey);
    return Number.isFinite(byMap as number) ? (byMap as number) : product.price;
  }

  const byRecord = (product.sizePrices as Record<string, number> | undefined)?.[sizeKey];
  return Number.isFinite(byRecord) ? (byRecord as number) : product.price;
};

const applyCommissionForOrderItems = async (
  items: Array<{ product: any; qty: number; price: number; commissionRate?: number; commissionAmount?: number; sellerNetAmount?: number }>,
  applyCommission: boolean
) => {
  const productIds = Array.from(
    new Set(
      items
        .map((item) =>
          typeof item.product === "object" && item.product?._id
            ? item.product._id.toString()
            : item.product?.toString?.()
        )
        .filter(Boolean)
    )
  );

  if (productIds.length === 0) return;

  const products = await ProductModel.find({ _id: { $in: productIds } }).select("_id category");
  const productCategoryMap = new Map(products.map((product) => [product._id.toString(), product.category.toString()]));
  const categoryQtyMap = new Map<string, number>();
  const commissionRateCache = new Map<string, number>();

  for (const item of items) {
    const productId =
      typeof item.product === "object" && item.product?._id
        ? item.product._id.toString()
        : item.product?.toString?.() || "";
    const categoryId = productCategoryMap.get(productId);
    if (!categoryId) continue;
    categoryQtyMap.set(categoryId, (categoryQtyMap.get(categoryId) || 0) + (item.qty || 0));
  }

  for (const item of items) {
    const productId =
      typeof item.product === "object" && item.product?._id
        ? item.product._id.toString()
        : item.product?.toString?.() || "";
    const categoryId = productCategoryMap.get(productId);
    const grossItemTotal = roundMoney((item.price || 0) * (item.qty || 0));

    if (!applyCommission || !categoryId) {
      item.commissionRate = 0;
      item.commissionAmount = 0;
      item.sellerNetAmount = grossItemTotal;
      continue;
    }

    const categoryTotalQty = categoryQtyMap.get(categoryId) || item.qty || 0;
    const cacheKey = `${categoryId}:${categoryTotalQty}`;
    let commissionRate = commissionRateCache.get(cacheKey);

    if (commissionRate === undefined) {
      const applicableRule = await getApplicableCommissionRule(categoryId, categoryTotalQty);
      commissionRate = applicableRule?.ratePercent || 0;
      commissionRateCache.set(cacheKey, commissionRate);
    }

    const commissionAmount = roundMoney((grossItemTotal * commissionRate) / 100);
    const sellerNetAmount = roundMoney(grossItemTotal - commissionAmount);
    item.commissionRate = commissionRate;
    item.commissionAmount = commissionAmount;
    item.sellerNetAmount = sellerNetAmount;
  }
};

// PLACE ORDER
export const placeOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    const authUserId = (req as any).userId as string | undefined;
    const authUserRole = req.userRole;
    const { shippingAddress, paymentMethod } = req.body as {
      userId?: string;
      shippingAddress?: string;
      paymentMethod?: string;
    };

    if (!authUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (authUserRole !== "customer") {
      return res.status(403).json({ message: "Only customers can place orders" });
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
        .select("_id name price sizePrices stock category seller")
        .session(session);

      const productMap = new Map(products.map((product) => [product._id.toString(), product]));
      const categoryQtyMap = new Map<string, number>();
      const commissionRateCache = new Map<string, number>();
      const shouldApplyCommissionNow = paymentMethod !== "cash";

      let totalPrice = 0;
      const orderItems = [];

      for (const item of cart.items) {
        const productId = item.product.toString();
        const product = productMap.get(productId);

        if (!product) {
          throw createHttpError(404, `Product not found for id ${productId}`);
        }

        if (!Number.isInteger(item.qty) || item.qty <= 0) {
          throw createHttpError(400, "Invalid cart quantity");
        }

        const categoryId = product.category.toString();
        categoryQtyMap.set(categoryId, (categoryQtyMap.get(categoryId) || 0) + item.qty);
      }

      for (const item of cart.items) {
        const productId = item.product.toString();
        const product = productMap.get(productId);

        if (!product) {
          throw createHttpError(404, `Product not found for id ${productId}`);
        }

        if (!Number.isInteger(item.qty) || item.qty <= 0) {
          throw createHttpError(400, "Invalid cart quantity");
        }

        const updated = await ProductModel.updateOne(
          { _id: product._id, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } },
          { session }
        );

        if (updated.modifiedCount === 0) {
          const refreshedProduct = await ProductModel.findById(product._id)
            .select("name stock")
            .session(session);
          const availableStock = refreshedProduct?.stock ?? 0;
          const productName = refreshedProduct?.name || "Selected product";
          throw createHttpError(
            400,
            `${productName} has only ${availableStock} item(s) left in stock`
          );
        }

        const unitPrice = roundMoney(resolveUnitPrice(product as any, item.size));
        const grossItemTotal = roundMoney(item.qty * unitPrice);
        totalPrice = roundMoney(totalPrice + grossItemTotal);
        const categoryId = product.category.toString();
        const categoryTotalQty = categoryQtyMap.get(categoryId) || item.qty;
        const cacheKey = `${categoryId}:${categoryTotalQty}`;
        let commissionRate = commissionRateCache.get(cacheKey);

        if (commissionRate === undefined) {
          const applicableRule = await getApplicableCommissionRule(product.category, categoryTotalQty);
          commissionRate = applicableRule?.ratePercent || 0;
          commissionRateCache.set(cacheKey, commissionRate);
        }

        const commissionAmount = shouldApplyCommissionNow
          ? roundMoney((grossItemTotal * commissionRate) / 100)
          : 0;
        const sellerNetAmount = shouldApplyCommissionNow
          ? roundMoney(grossItemTotal - commissionAmount)
          : grossItemTotal;

        orderItems.push({
          product: product._id,
          seller: product.seller,
          qty: item.qty,
          size: item.size,
          color: item.color,
          price: unitPrice,
          commissionRate: shouldApplyCommissionNow ? commissionRate : 0,
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

    for (const order of orders) {
      if (order.paymentMethod !== "cash") continue;

      const before = JSON.stringify(
        (order.items as any[]).map((item) => ({
          commissionRate: item.commissionRate || 0,
          commissionAmount: item.commissionAmount || 0,
          sellerNetAmount: item.sellerNetAmount || 0,
        }))
      );

      await applyCommissionForOrderItems(order.items as any[], order.paymentStatus === "paid");

      const after = JSON.stringify(
        (order.items as any[]).map((item) => ({
          commissionRate: item.commissionRate || 0,
          commissionAmount: item.commissionAmount || 0,
          sellerNetAmount: item.sellerNetAmount || 0,
        }))
      );

      if (before !== after) {
        order.markModified("items");
        await order.save();
      }
    }

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
          if (order.paymentStatus === "paid") {
            monthlyCommission += commissionAmount;
            monthlyNetEarnings += netAmount;
          }
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
      .filter((product) => product.stock <= 5)
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

    if (!authUserId || authUserRole !== "seller") return res.status(401).json({ message: "Unauthorized" });
    if (!orderStatus) return res.status(400).json({ message: "orderStatus is required" });

    const order = await Order.findById(req.params.orderId).populate({
      path: "items.product",
      populate: { path: "seller", select: "_id" },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const ownsAnyProductInOrder = order.items.some(
      (item: any) => item.product?.seller?._id?.toString() === authUserId
    );
    if (!ownsAnyProductInOrder) {
      return res.status(403).json({ message: "Forbidden for this order" });
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

    if (!authUserId || authUserRole !== "seller") return res.status(401).json({ message: "Unauthorized" });
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

    const ownsAnyProductInOrder = order.items.some(
      (item: any) => item.product?.seller?._id?.toString() === authUserId
    );
    if (!ownsAnyProductInOrder) {
      return res.status(403).json({ message: "Forbidden for this order" });
    }

    order.paymentStatus = paymentStatus;
    await applyCommissionForOrderItems(order.items as any[], paymentStatus === "paid");
    order.markModified("items");
    await order.save();

    const updatedOrder = await Order.findById(order._id).populate("items.product user");
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
