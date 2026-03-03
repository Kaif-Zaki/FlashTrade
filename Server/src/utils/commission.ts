import type { Types } from "mongoose";
import { CommissionRuleModel } from "../models/CommissionRule";

export const getApplicableCommissionRule = async (
  categoryId: string | Types.ObjectId,
  qty: number
) => {
  const rules = await CommissionRuleModel.find({
    category: categoryId,
    isActive: true,
    minQty: { $lte: qty },
    $or: [{ maxQty: null }, { maxQty: { $gte: qty } }],
  }).sort({ minQty: -1 });

  return rules[0] || null;
};
