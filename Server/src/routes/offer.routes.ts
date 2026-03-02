import { Router } from "express";
import { getOffers } from "../controllers/offer.controller";

const offerRouter = Router();

// public
offerRouter.get("/", getOffers);

export default offerRouter;
