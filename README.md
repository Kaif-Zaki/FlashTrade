# FlashTrade 🚀

**FlashTrade** is a modern, full‑stack multi‑vendor e‑commerce platform built with the latest technologies. It features role‑based workflows for **Customers**, **Sellers**, and **Admins** and promotes rapid development, scalable architecture, and a friendly developer experience.

### Tech Stack

- **Frontend:** React 19 ⚛️ (functional components/hooks), TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js (v20) 🟢, Express 5, TypeScript, MongoDB & Mongoose
- **API pattern:** RESTful with middleware for auth, roles, and error handling
- **Authentication:** JWT access + refresh tokens + secure route guards
- **Business logic highlights:** multi‑role workflows, seller approval, activation/inactivation, commission rules, COD payment state

---

## 🧱 Project Structure

Both client and server live in the same monorepo with clear separation:

```
FlashTrade/
  Client/        # React + Vite front-end single-page app
    public/      # static assets and index.html
    src/         # source code
      components/
      pages/
      context/
      service/   # API calls, utility functions
      types/     # shared TypeScript interfaces
      router.tsx
      main.tsx
  Server/        # Express back-end
    src/
      controllers/   # request handlers
      models/        # Mongoose schemas
      routes/        # express routers (linked below)
      middlewares/   # auth, error handling, role checks
      db/            # Mongo connection & sample data
      utils/         # helper functions
    tsconfig.json
    package.json
  README.md
```

The codebase opts for strict TypeScript, ESLint setups in the client, and Nodemon+ts-node for development on the backend. The front-end communicates with the API via a lightweight `apiClient` wrapper.

---

---

## 🌟 Highlights

- 🔑 **Multi-role UX**
  - **Customer:** browse, filter, add to cart, checkout, order history, reviews
  - **Seller:** manage own products/orders/reviews, view analytics
  - **Admin:** approve/disable sellers, manage categories & commissions, view analytics
- 📦 Category commission rules based on total quantity
- 💰 Commission applied at order-time or when COD payment is marked _paid_
- 🔒 Seller isolation ensures data privacy
- 🗑️ Admin tools to remove sellers + related data

---

## 📁 Monorepo Layout

```
FlashTrade/
  Client/    # React + Vite frontend
  Server/    # Express + MongoDB backend
  README.md
```

---

## 🧩 Role Access Matrix

| Feature                           | Customer | Seller | Admin |
| --------------------------------- | :------: | :----: | :---: |
| Browse products/categories        |    ✅    |   ✅   |  ✅   |
| Add to cart / place order         |    ✅    |   ❌   |  ❌   |
| Manage own products               |    ❌    |   ✅   |  ❌   |
| Manage seller orders              |    ❌    |   ✅   |  ❌   |
| Approve product reviews           |    ❌    |   ✅   |  ❌   |
| Approve/inactivate/remove sellers |    ❌    |   ❌   |  ✅   |
| Manage categories                 |    ❌    |   ❌   |  ✅   |
| Manage commission rules           |    ❌    |   ❌   |  ✅   |
| View admin analytics              |    ❌    |   ❌   |  ✅   |

---

## ⚙️ Prerequisites

- Node.js 20+
- npm 10+
- MongoDB (local/Atlas)
- `mongoimport` (optional, for sample data)

---

## 🔐 Environment Variables

Create `.env` in `Server/`:

```env
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
DB_URL=mongodb://127.0.0.1:27017/flashtrade
ACCESS_TOKEN_SECRET=replace_with_secure_secret
REFRESH_TOKEN_SECRET=replace_with_secure_secret
NODE_ENV=development
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password
ADMIN_SETUP_SECRET=set_bootstrap_secret
FRONTEND_URL=http://localhost:5173
```

> **Note:** `DB_URL` is required by `Server/src/db/mongo.ts`. Keep secrets out of source control.

---

## 🚀 Quick Start

1. **Install dependencies**

```bash
cd Server && npm install
cd ../Client && npm install
```

2. **Start backend**

```bash
cd Server
npm run dev
```

3. **Start frontend**

```bash
cd Client
npm run dev
```

Frontend: `http://localhost:5173`  
API base: `http://localhost:3000/api`

---

## 🔗 API Base URL

`Client/src/service/apiClient.ts` currently hardcodes:

```ts
export const BASE_URL = "http://localhost:3000/api";
```

Change or move to a Vite env variable if needed.

---

## 🛠️ Key Backend Routes (`/api`)

Below is a breakdown of every route group, the endpoints they expose, and who can access them.

### 🔐 Authentication & User

| Endpoint                      | Method | Description                            | Auth / Role   |
| ----------------------------- | ------ | -------------------------------------- | ------------- |
| `/auth/signup`                | POST   | Register new user (customer or seller) | Public        |
| `/auth/login`                 | POST   | Login, receive access & refresh tokens | Public        |
| `/auth/refresh-token`         | POST   | Obtain new access token                | Public        |
| `/auth/logout`                | POST   | Revoke refresh token                   | Public        |
| `/auth/profile`               | GET    | Get current user profile               | Authenticated |
| `/auth/change-password`       | PUT    | Change own password                    | Authenticated |
| `/auth/update-profile`        | PUT    | Update own profile                     | Authenticated |
| `/auth/forgot-password`       | POST   | Start password reset flow              | Public        |
| `/auth/reset-password/:token` | POST   | Complete password reset                | Public        |

#### 🛡️ Admin-specific

| Endpoint                        | Method | Description                     |
| ------------------------------- | ------ | ------------------------------- | ----- |
| `/auth/bootstrap-admin`         | POST   | Create first admin using secret |
| `/auth/admins`                  | POST   | Create additional admin         | Admin |
| `/auth/admins/:userId/promote`  | PATCH  | Promote user to admin           | Admin |
| `/auth/users`                   | GET    | List all users                  | Admin |
| `/auth/sellers/pending`         | GET    | List sellers awaiting approval  | Admin |
| `/auth/sellers/:userId/approve` | PATCH  | Approve a seller                | Admin |
| `/auth/sellers/approved`        | GET    | List approved sellers           | Admin |
| `/auth/sellers/:userId`         | GET    | Get seller by id                | Admin |
| `/auth/sellers/:userId/status`  | PATCH  | Activate/inactivate seller      | Admin |
| `/auth/sellers/:userId`         | DELETE | Remove seller and related data  | Admin |

### 📦 Products

| Endpoint                           | Method | Access            | Description                   |
| ---------------------------------- | ------ | ----------------- | ----------------------------- |
| `/products`                        | GET    | Public            | Browse all products           |
| `/products/:id`                    | GET    | Public            | Product details               |
| `/products/category/:categoryId`   | GET    | Public            | Products filtered by category |
| `/products/seller/me`              | GET    | Seller (approved) | Seller's own products         |
| `/products/admin/seller/:sellerId` | GET    | Admin             | View products of a seller     |
| `/products`                        | POST   | Seller (approved) | Create new product            |
| `/products/:id`                    | PUT    | Seller (approved) | Update own product            |
| `/products/:id`                    | DELETE | Seller (approved) | Delete own product            |
| `/products/admin/:id`              | DELETE | Admin             | Force-delete any product      |

### 🗂️ Categories

| Endpoint          | Method | Access | Description     |
| ----------------- | ------ | ------ | --------------- |
| `/categories`     | GET    | Public | List categories |
| `/categories`     | POST   | Admin  | Create category |
| `/categories/:id` | PUT    | Admin  | Update category |
| `/categories/:id` | DELETE | Admin  | Delete category |

### 🛒 Cart

| Endpoint          | Method | Access   | Description           |
| ----------------- | ------ | -------- | --------------------- |
| `/cart/my`        | GET    | Customer | Get current cart      |
| `/cart/my/add`    | POST   | Customer | Add item to cart      |
| `/cart/my/remove` | POST   | Customer | Remove item from cart |

### 🧾 Orders

| Endpoint                          | Method | Access   | Description                |
| --------------------------------- | ------ | -------- | -------------------------- |
| `/orders`                         | POST   | Customer | Place new order (checkout) |
| `/orders/my`                      | GET    | Customer | List own orders            |
| `/orders/my/:orderId`             | GET    | Customer | Order details              |
| `/orders/seller`                  | GET    | Seller   | Seller's orders            |
| `/orders/seller/analytics`        | GET    | Seller   | Seller analytics data      |
| `/orders/admin`                   | GET    | Admin    | All orders list            |
| `/orders/:orderId/status`         | PATCH  | Seller   | Update shipment status     |
| `/orders/:orderId/payment-status` | PATCH  | Seller   | Mark COD payment paid      |

### ⭐ Reviews

| Endpoint                            | Method | Access | Description                  |
| ----------------------------------- | ------ | ------ | ---------------------------- |
| `/reviews`                          | POST   | Public | Submit a review              |
| `/reviews`                          | GET    | Public | Browse all reviews           |
| `/reviews/seller/pending`           | GET    | Seller | Seller's un‑approved reviews |
| `/reviews/seller/:reviewId/approve` | PATCH  | Seller | Approve a review             |

### 📑 Commission Rules

| Endpoint                | Method | Access        | Description                        |
| ----------------------- | ------ | ------------- | ---------------------------------- |
| `/commissions/estimate` | GET    | Authenticated | Estimate commission for cart/order |
| `/commissions`          | GET    | Admin         | List rules                         |
| `/commissions`          | POST   | Admin         | Create rule                        |
| `/commissions/:id`      | PUT    | Admin         | Update rule                        |
| `/commissions/:id`      | DELETE | Admin         | Remove rule                        |

### 🎁 Offers

| Endpoint  | Method | Access | Description       |
| --------- | ------ | ------ | ----------------- |
| `/offers` | GET    | Public | Get active offers |

### 📧 Email / Contact

| Endpoint         | Method | Access | Description             |
| ---------------- | ------ | ------ | ----------------------- |
| `/email/contact` | POST   | Public | Send contact form email |

---

This section provides full visibility into the API surface for developers or integrators.

---

## 🧮 Commission Logic

- Rules per **category**: `minQty`, `ratePercent`, `isActive`
- Category matching is case‑insensitive
- Commission quantity = total qty per category in the order
- Non‑COD: commission applied on order creation
- COD: commission applied when seller marks payment `paid`

> **Example:**  
> Rule: Sneakers, `minQty=2`, `ratePercent=8`  
> Order contains 5 sneakers → rule applies.

---

## 📂 Sample Data Import

Files under `Server/src/db`. Import order to maintain referential integrity:

1. `SampleUsers.json`
2. `SampleCategoory.json`
3. `SampleProduts.json`
4. `SampleCommissionRules.json`
5. `SampleOrders.json`
6. `SampleReviews.json`
7. `SampeCustomerMessage .json`

Refer to `Server/src/db/IMPORT_ORDER.md` for commands.

---

## 🛠 Development Notes

- Backend: strict TypeScript, Mongoose
- Some filenames intentionally misspelled (e.g. `SampleProduts.json`)
- Role checks + approval/active middleware protect seller APIs

---

## 🧰 Developer Tools & Notes

- **Linting:** `Client/npm run lint` uses ESLint with TypeScript rules.
- **Formatting:** follow Prettier config in workspace (not checkedin? may use vscode settings).
- **Type checking:** client build runs `tsc` during `npm run build`.
- **Environment switching:** update `Client/vite.config.ts` and `apiClient` as needed.
- **Sample data import:** see `Server/src/db/IMPORT_ORDER.md`; uses `mongoimport`.
- **Testing placeholder:** no automated tests yet – planned roadmap item.

---

## 🔒 Security Checklist (Pre‑prod)

- Rotate secrets
- Restrict CORS origins
- Enable HTTPS & secure cookies
- Externalize API URL
- Add rate limiting & validation
- Build automated tests

---

## 📦 Scripts

**Client**

- `npm run dev` – Vite dev server
- `npm run build` – type-check + production build
- `npm run lint` – lint source
- `npm run preview` – preview build

**Server**

- `npm run dev` – Express with nodemon & ts-node

---

## 🧯 Troubleshooting

- _MongoDB fails:_ ensure `DB_URL` is set
- _Frontend can't reach API:_ verify backend port & `BASE_URL`
- _403 on seller pages:_ seller must be approved & active
- _No commission on COD:_ seller must mark payment `paid`

---

## 🛣️ Roadmap Ideas

- Env‑based API URL
- Automated test suite (API + UI)
- Pagination for large tables
- Centralized audit log

---

Thank you for exploring **FlashTrade**! 💡  
Contributions welcome – open a PR or raise an issue 😉.

- `DB_URL` is required by `Server/src/db/mongo.ts`.
- Keep secrets out of git.

---

## Install & Run

### 1) Install dependencies

```bash
cd Server && npm install
cd ../Client && npm install
```

### 2) Start backend

```bash
cd Server
npm run dev
```

Backend default API base: `http://localhost:3000/api`

### 3) Start frontend

```bash
cd Client
npm run dev
```

Frontend default: `http://localhost:5173`

---

## API Base URL Note

`Client/src/service/apiClient.ts` currently uses a hardcoded base URL:

```ts
export const BASE_URL = "http://localhost:3000/api";
```

If your backend runs elsewhere, update this value (or move it to a Vite env variable).

---

## Key Backend Route Groups

Base prefix: `/api`

- `/auth` - signup/login/profile/admin/seller approval and management
- `/products` - public catalog + seller CRUD + admin seller product view/delete
- `/categories` - public list + admin create/update/delete
- `/cart` - customer-only cart operations
- `/orders` - customer checkout/history, seller order management, seller analytics, admin order list
- `/reviews` - customer review create + seller review approval
- `/commissions` - admin commission rules + commission estimation
- `/offers` - public offers
- `/email/contact` - contact form email sending

---

## Commission Logic (Current Behavior)

- Commission rules are set per **category** with:
  - `minQty` (starting quantity threshold)
  - `ratePercent`
  - `isActive`
- Matching is case-insensitive by category name where needed.
- At order time, commission quantity is evaluated by **total quantity per category in the order**.
- For non-COD payments, commission is applied during order creation.
- For COD (`paymentMethod: cash`), commission is zero initially and applied when seller updates payment status to `paid`.

Example:

- Rule A: category `Sneakers`, `minQty=2`, `ratePercent=8`
- Customer buys 3 different sneaker products, qty total in sneakers = 5
- Rule applies because 5 >= 2

---

## Sample Data Import

Sample JSON files are in `Server/src/db`.

Import order (to avoid relation issues):

1. `SampleUsers.json`
2. `SampleCategoory.json`
3. `SampleProduts.json`
4. `SampleCommissionRules.json`
5. `SampleOrders.json`
6. `SampleReviews.json`
7. `SampeCustomerMessage .json`

See detailed commands in:

- `Server/src/db/IMPORT_ORDER.md`

---

## Development Notes

- Backend uses strict TypeScript and Mongoose models.
- Some filenames are intentionally preserved with existing project naming (e.g., `SampleProduts.json`).
- Seller-protected APIs use auth + role checks + approval/active checks.

---

## Security Checklist

Before production:

- Rotate `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `ADMIN_SETUP_SECRET`
- Use production CORS origin(s) only
- Secure cookies and HTTPS
- Remove hardcoded frontend API URL and use env configuration
- Add rate limiting and request validation hardening
- Add automated tests (unit + integration)

---

## Scripts

### Client (`Client/package.json`)

- `npm run dev` - start Vite dev server
- `npm run build` - type-check + production build
- `npm run lint` - lint source
- `npm run preview` - preview built app

### Server (`Server/package.json`)

- `npm run dev` - start Express server with nodemon + ts-node

---

## Troubleshooting

- **MongoDB connection fails**
  - Confirm `DB_URL` exists in `Server/.env`
- **Frontend cannot reach API**
  - Verify backend port and `BASE_URL` in `Client/src/service/apiClient.ts`
- **403 on seller pages**
  - Seller must be approved and active by admin
- **No commission appears for COD order**
  - Seller must mark payment status as `paid`

---

## Roadmap Ideas

- Replace hardcoded API URL with env-based config
- Add test suite (API + UI)
- Add pagination for admin/seller tables
- Add centralized audit log for seller/admin actions
