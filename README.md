# 🚀 Vexo

<div align="center">

### Modern Full-Stack E-Commerce Platform

[![Frontend](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=white)](#-tech-stack)
[![Backend](https://img.shields.io/badge/Backend-Express%205-000000?style=for-the-badge&logo=express&logoColor=white)](#-tech-stack)
[![Database](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](#-tech-stack)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#-tech-stack)

</div>

Full-stack e-commerce web application built with **React + TypeScript (Vite)** on the client and **Node.js + Express + TypeScript + MongoDB** on the server.

## ✨ Features

- 🔐 JWT auth with refresh token flow
- 👤 User signup/login/logout
- 🧾 User profile and password change
- 🛍️ Product listing, product detail, category filtering, search
- 🛒 Cart management (add/update/remove)
- 💳 Checkout flow (customer details + payment)
- 📦 Order placement and order history
- ⭐ Product reviews (create + list by product)
- 📬 Contact form email sending from backend
- 📱 Responsive layout improvements across pages
- 🌓 Auto dark/light mode based on system/browser preference

## 🧰 Tech Stack

### Client (`/Client`)
- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Axios
- React Router v7

### Server (`/Server`)
- Node.js
- Express 5
- TypeScript
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Nodemailer (Gmail SMTP)
- Cookie Parser + CORS

## 🗂️ Project Structure

```txt
Vexo/
  Client/      # Frontend app
  Server/      # Backend API
  Readme.md
  .gitignore
```

## 🌐 API Base URL

Client uses:

```ts
http://localhost:3000/api
```

Configured in:
- `Client/src/service/apiClient.ts`

## 🔌 Available Backend Routes

Base: `/api`

### `/auth`
- `POST /signup`
- `POST /login`
- `POST /refresh-token`
- `POST /logout`
- `GET /users` (protected)
- `GET /profile` (protected)
- `PUT /change-password` (protected)
- `PUT /update-profile` (protected)
- `POST /forgot-password`
- `POST /reset-password/:token`

### `/products`
- `GET /`
- `GET /:id`
- `GET /category/:categoryId`

### `/categories`
- `GET /`

### `/offers`
- `GET /`

### `/cart` (protected)
- `GET /:userId`
- `POST /:userId/add`
- `POST /:userId/remove`

### `/orders` (protected)
- `POST /`
- `GET /:userId`
- `GET /order/:orderId`

### `/reviews`
- `GET /?productId=...`
- `POST /`

### `/email`
- `POST /contact`

## ⚙️ Environment Variables

Create `Server/.env`:

```env
DB_URL=your_mongodb_connection_string
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
NODE_ENV=development
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_google_app_password
FRONTEND_URL=http://localhost:5173
```

> ✅ Use **Google App Password** for `EMAIL_PASS` (not normal Gmail password).  
> 🔒 Never commit `.env` files.

## 🛠️ Setup and Run

### 1. Install dependencies

From root:

```bash
cd Server && npm install
cd ../Client && npm install
```

### 2. Run backend

```bash
cd Server
npm run dev
```

Backend runs on `http://localhost:3000` (based on your `.env`).

### 3. Run frontend

```bash
cd Client
npm run dev
```

Frontend runs on `http://localhost:5173`.

## 🏗️ Build

### Client

```bash
cd Client
npm run build
```

### Server Type Check

```bash
cd Server
npx tsc --noEmit
```

## 🔐 Important Security Notes

- Rotate any secrets that were ever exposed (DB URLs, JWT secrets, email passwords).
- Keep `.env` out of Git.
- Use strong JWT secrets and secure cookie settings in production.

## ✅ Current Status

Core user flow is implemented:
- browse products -> product details -> add to cart -> checkout -> place order
- submit contact messages from authenticated user email
- submit product reviews from authenticated user profile


