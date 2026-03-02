import express from "express";
import { sendContactEmail } from "../controllers/email.controller";

const emailRouter = express.Router();

emailRouter.post("/contact", sendContactEmail);

export default emailRouter;
