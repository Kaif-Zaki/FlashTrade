import { Router } from "express";
import authRouter from "./auth.routes";
import offerRouter from "./offer.routes";
import categoryRouter from "./category.routes";
import cartRouter from "./cart.routes";
import orderRouter from "./order.routes";
import productRouter from "./product.routes";
import contactRouter from "./review.routes";
import emailRouter from "./email.routes";
import commissionRouter from "./commission.routes";

const rootRouter = Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/offers", offerRouter);
rootRouter.use("/categories", categoryRouter);
rootRouter.use("/products", productRouter);
rootRouter.use("/orders", orderRouter);
rootRouter.use("/cart", cartRouter);
rootRouter.use("/reviews", contactRouter);
rootRouter.use("/email", emailRouter);
rootRouter.use("/commissions", commissionRouter);

export default rootRouter;
