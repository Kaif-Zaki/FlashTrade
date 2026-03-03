import { Router } from "express";
import { getCart, addToCart, removeFromCart } from "../controllers/cart.controller";
import { authenticateToken } from "../middlewares/authenticateToken";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import { USER_ROLES } from "../constants/roles";

const cartRouter = Router();

// all cart routes need auth
cartRouter.use(authenticateToken);
cartRouter.use(authorizeRoles(USER_ROLES.CUSTOMER));

cartRouter.get("/my", getCart);
cartRouter.post("/my/add", addToCart);
cartRouter.post("/my/remove", removeFromCart);

export default cartRouter;
