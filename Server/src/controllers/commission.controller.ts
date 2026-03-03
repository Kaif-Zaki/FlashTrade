import { type Request, type Response } from "express";
import mongoose from "mongoose";
import { CommissionRuleModel } from "../models/CommissionRule";
import { getApplicableCommissionRule } from "../utils/commission";

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const rangesOverlap = (
  minA: number,
  maxA: number | null | undefined,
  minB: number,
  maxB: number | null | undefined
) => {
  const upperA = maxA ?? Number.POSITIVE_INFINITY;
  const upperB = maxB ?? Number.POSITIVE_INFINITY;
  return minA <= upperB && minB <= upperA;
};

const hasConflictingActiveRule = async ({
  category,
  minQty,
  maxQty,
  excludeRuleId,
}: {
  category: string;
  minQty: number;
  maxQty?: number | null;
  excludeRuleId?: string;
}) => {
  const existingRules = await CommissionRuleModel.find({
    category,
    isActive: true,
    ...(excludeRuleId ? { _id: { $ne: excludeRuleId } } : {}),
  }).select("minQty maxQty");

  return existingRules.some((rule) =>
    rangesOverlap(minQty, maxQty ?? null, rule.minQty, rule.maxQty ?? null)
  );
};

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
    if (typeof minQty !== "number" || !Number.isFinite(minQty) || !Number.isInteger(minQty) || minQty < 1) {
      return res.status(400).json({ message: "minQty must be at least 1" });
    }
    if (
      typeof ratePercent !== "number" ||
      !Number.isFinite(ratePercent) ||
      ratePercent < 0 ||
      ratePercent > 100
    ) {
      return res.status(400).json({ message: "ratePercent must be between 0 and 100" });
    }
    if (maxQty !== null && maxQty !== undefined && (!Number.isFinite(maxQty) || !Number.isInteger(maxQty))) {
      return res.status(400).json({ message: "maxQty must be an integer when provided" });
    }
    const validatedMinQty: number = minQty;
    const validatedRatePercent: number = ratePercent;
    const validatedMaxQty = maxQty ?? null;

    if (validatedMaxQty !== null && validatedMaxQty < validatedMinQty) {
      return res.status(400).json({ message: "maxQty must be greater than or equal to minQty" });
    }
    if ((isActive ?? true) === true) {
      const hasConflict = await hasConflictingActiveRule({
        category,
        minQty: validatedMinQty,
        maxQty: validatedMaxQty,
      });
      if (hasConflict) {
        return res.status(409).json({
          message: "Conflicting active commission rule exists for this category and quantity range",
        });
      }
    }

    const rule = await CommissionRuleModel.create({
      category,
      minQty: validatedMinQty,
      maxQty: validatedMaxQty,
      ratePercent: validatedRatePercent,
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

    const existing = await CommissionRuleModel.findById(ruleId);
    if (!existing) return res.status(404).json({ message: "Commission rule not found" });

    const nextMinQty = minQty ?? existing.minQty;
    const nextMaxQty = maxQty !== undefined ? maxQty : existing.maxQty;
    const nextRatePercent = ratePercent ?? existing.ratePercent;
    const nextIsActive = isActive ?? existing.isActive;

    if (!Number.isFinite(nextMinQty) || !Number.isInteger(nextMinQty) || nextMinQty < 1) {
      return res.status(400).json({ message: "minQty must be at least 1" });
    }
    if (
      nextMaxQty !== null &&
      nextMaxQty !== undefined &&
      (!Number.isFinite(nextMaxQty) || !Number.isInteger(nextMaxQty))
    ) {
      return res.status(400).json({ message: "maxQty must be an integer when provided" });
    }
    if (nextMaxQty !== null && nextMaxQty !== undefined && nextMaxQty < nextMinQty) {
      return res.status(400).json({ message: "maxQty must be greater than or equal to minQty" });
    }
    if (!Number.isFinite(nextRatePercent) || nextRatePercent < 0 || nextRatePercent > 100) {
      return res.status(400).json({ message: "ratePercent must be between 0 and 100" });
    }
    if (nextIsActive) {
      const hasConflict = await hasConflictingActiveRule({
        category: existing.category.toString(),
        minQty: nextMinQty,
        maxQty: nextMaxQty,
        excludeRuleId: ruleId,
      });
      if (hasConflict) {
        return res.status(409).json({
          message: "Conflicting active commission rule exists for this category and quantity range",
        });
      }
    }

    const updated = await CommissionRuleModel.findByIdAndUpdate(
      ruleId,
      {
        ...(minQty !== undefined ? { minQty: nextMinQty } : {}),
        ...(maxQty !== undefined ? { maxQty: nextMaxQty } : {}),
        ...(ratePercent !== undefined ? { ratePercent: nextRatePercent } : {}),
        ...(isActive !== undefined ? { isActive: nextIsActive } : {}),
      },
      { new: true, runValidators: true }
    ).populate("category", "name");

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
    if (!Number.isFinite(parsedQty) || !Number.isInteger(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ message: "qty must be an integer greater than 0" });
    }
    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
      return res.status(400).json({ message: "unitPrice must be a valid number" });
    }

    const rule = await getApplicableCommissionRule(categoryId, parsedQty);
    const ratePercent = rule?.ratePercent || 0;
    const grossAmount = roundMoney(parsedQty * parsedUnitPrice);
    const commissionAmount = roundMoney((grossAmount * ratePercent) / 100);
    const sellerNetAmount = roundMoney(grossAmount - commissionAmount);

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
