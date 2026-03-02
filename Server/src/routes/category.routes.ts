import { Router } from "express";
import { getCategories } from "../controllers/category.controller";

const categoryRouter = Router();

// all categories are public
categoryRouter.get("/", getCategories);

export default categoryRouter;