import type { Types } from "mongoose";
import { CommissionRuleModel } from "../models/CommissionRule";
import { CategoryModel } from "../models/Category";

const normalizeCategoryName = (value: string) => value.trim().toLowerCase();

export const getApplicableCommissionRule = async (
  categoryId: string | Types.ObjectId,
  qty: number
) => {
  const baseCategoryId = categoryId.toString();
  const targetCategory = await CategoryModel.findById(baseCategoryId).select("name");
  const matchedCategoryIds = [baseCategoryId];

  if (targetCategory?.name) {
    const normalizedName = normalizeCategoryName(targetCategory.name);
    const sameNameCategories = await CategoryModel.find()
      .select("_id name")
      .lean();

    for (const category of sameNameCategories) {
      if (!category?.name) continue;
      if (normalizeCategoryName(category.name) === normalizedName) {
        const id = category._id.toString();
        if (!matchedCategoryIds.includes(id)) {
          matchedCategoryIds.push(id);
        }
      }
    }
  }

  const rules = await CommissionRuleModel.find({
    category: { $in: matchedCategoryIds },
    isActive: true,
    minQty: { $lte: qty },
  }).sort({ minQty: -1, createdAt: -1 });

  return rules[0] || null;
};
