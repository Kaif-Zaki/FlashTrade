import { Request, Response } from "express";
import { sendEmail } from "../utils/mailer";

// send mail for contact page
export const sendContactEmail = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    if (
      !name?.trim() ||
      !email?.trim() ||
      !subject?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        message: "Name, email, subject, and message are required",
      });
    }

    const receiverEmail = process.env.EMAIL_USER;

    if (!receiverEmail) {
      return res.status(500).json({
        message: "Email receiver is not configured",
      });
    }

    const html = `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `;

    await sendEmail(receiverEmail, `Contact: ${subject}`, html, email);

    return res.status(200).json({
      message: "Message sent successfully",
    });
  } catch (err: any) {
    let message = "Failed to send message";

    if (err?.code === "EAUTH") {
      message = "Email authentication failed. Check EMAIL_USER and EMAIL_PASS";
    } else if (err?.code === "EDNS" || err?.code === "ENOTFOUND") {
      message =
        "Unable to reach Gmail SMTP server. Check internet/DNS on backend";
    } else if (typeof err?.message === "string" && err.message.trim()) {
      message = err.message;
    }

    return res.status(500).json({
      message,
    });
  }
};
