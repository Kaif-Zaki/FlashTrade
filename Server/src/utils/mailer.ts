import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Email credentials are missing. Set EMAIL_USER and EMAIL_PASS in Server/.env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
};

export const sendOverdueEmail = async (
  to: string,
  readerName: string,
  books: { title: string; dueDate: Date }[]
) => {
  const bookList = books
    .map((b) => `- ${b.title} (Due: ${new Date(b.dueDate).toLocaleDateString()})`)
    .join("\n")

  const message = {
    from: `"Book Club Library" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Overdue Book Reminder",
    text: `Dear ${readerName},\n\nYou have overdue books:\n${bookList}\n\nPlease return them.\n\nThank you.`,
  }

  await getTransporter().sendMail(message);
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  replyTo?: string
) => {
  const message = {
    from: `"Book Club Library" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    replyTo,
  };

  await getTransporter().sendMail(message);
};
