import { Request, Response } from "express";
import Offer from "../models/Offer";

// GET CURRENT OFFERS
export const getOffers = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const offers = await Offer.find({ validTill: { $gte: now } });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};