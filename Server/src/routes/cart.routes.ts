import { Router } from "express";
import { getCart, addToCart, removeFromCart } from "../controllers/cart.controller";
import { authenticateToken } from "../middlewares/authenticateToken";

const cartRouter = Router();

// all cart routes need auth
cartRouter.use(authenticateToken);

cartRouter.get("/:userId", getCart);
cartRouter.post("/:userId/add", addToCart);
cartRouter.post("/:userId/remove", removeFromCart);

export default cartRouter;