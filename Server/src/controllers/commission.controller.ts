import { type Request, type Response } from "express";
import mongoose from "mongoose";
import { CommissionRuleModel } from "../models/CommissionRule";
import { getApplicableCommissionRule } from "../utils/commission";

export const getCommissionRules = async (_req: Request, res: Response) => {
  try {
    const rules = await CommissionRuleModel.find().populate("category", "name").sort({
      createdAt: -1,
    });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const createCommissionRule = async (req: Request, res: Response) => {
  try {
    const { category, minQty, maxQty, ratePercent, isActive } = req.body as {
      category?: string;
      minQty?: number;
      maxQty?: number | null;
      ratePercent?: number;
      isActive?: boolean;
    };

    if (!category || !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: "Valid category is required" });
    }
    if (!minQty || minQty < 1) {
      return res.status(400).json({ message: "minQty must be at least 1" });
    }
    if (ratePercent === undefined || ratePercent < 0 || ratePercent > 100) {
      return res.status(400).json({ message: "ratePercent must be between 0 and 100" });
    }
    if (maxQty !== null && maxQty !== undefined && maxQty < minQty) {
      return res.status(400).json({ message: "maxQty must be greater than or equal to minQty" });
    }

    const rule = await CommissionRuleModel.create({
      category,
      minQty,
      maxQty: maxQty ?? null,
      ratePercent,
      isActive: isActive ?? true,
    });

    const populatedRule = await CommissionRuleModel.findById(rule._id).populate("category", "name");
    res.status(201).json(populatedRule);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const updateCommissionRule = async (req: Request, res: Response) => {
  try {
    const ruleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { minQty, maxQty, ratePercent, isActive } = req.body as {
      minQty?: number;
      maxQty?: number | null;
      ratePercent?: number;
      isActive?: boolean;
    };

    const updated = await CommissionRuleModel.findByIdAndUpdate(
      ruleId,
      {
        ...(minQty !== undefined ? { minQty } : {}),
        ...(maxQty !== undefined ? { maxQty } : {}),
        ...(ratePercent !== undefined ? { ratePercent } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      { new: true, runValidators: true }
    ).populate("category", "name");

    if (!updated) return res.status(404).json({ message: "Commission rule not found" });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteCommissionRule = async (req: Request, res: Response) => {
  try {
    const ruleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await CommissionRuleModel.findByIdAndDelete(ruleId);
    if (!deleted) return res.status(404).json({ message: "Commission rule not found" });
    res.json({ message: "Commission rule deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const estimateCommission = async (req: Request, res: Response) => {
  try {
    const { categoryId, qty, unitPrice } = req.query as {
      categoryId?: string;
      qty?: string;
      unitPrice?: string;
    };

    const parsedQty = Number(qty || 0);
    const parsedUnitPrice = Number(unitPrice || 0);

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Valid categoryId is required" });
    }
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ message: "qty must be greater than 0" });
    }
    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
      return res.status(400).json({ message: "unitPrice must be a valid number" });
    }

    const rule = await getApplicableCommissionRule(categoryId, parsedQty);
    const ratePercent = rule?.ratePercent || 0;
    const grossAmount = parsedQty * parsedUnitPrice;
    const commissionAmount = (grossAmount * ratePercent) / 100;
    const sellerNetAmount = grossAmount - commissionAmount;

    res.json({
      ratePercent,
      grossAmount,
      commissionAmount,
      sellerNetAmount,
      ruleId: rule?._id || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
