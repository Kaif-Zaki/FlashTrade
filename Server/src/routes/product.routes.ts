import { Router } from "express";
import {
  getProducts,
  getProductById,
  getProductsByCategory,
} from "../controllers/product.controller";

const productRouter = Router();

// public routes
productRouter.get("/", getProducts);
productRouter.get("/:id", getProductById);
productRouter.get("/category/:categoryId", getProductsByCategory);

export default productRouter;
