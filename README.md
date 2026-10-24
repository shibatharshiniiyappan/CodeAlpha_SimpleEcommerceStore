# LUMEN Studio — Simple E-Commerce Store
### CodeAlpha Web Development Internship Project

A complete, production-grade full-stack e-commerce store built strictly according to internship technical constraints: **Plain HTML5, CSS3, Vanilla JavaScript (Zero Frameworks)** on the frontend, **Node.js with Express.js** on the backend, and **MongoDB Atlas using Mongoose ODM**.

---

## 🌟 Key Features

1. **Storefront & Product Catalog**:
   - Curated product showcase with authentic studio photography.
   - Real-time live search across titles, descriptions, and tags.
   - Dynamic category filtering (`Living`, `Decor`, `Audio`, `Textiles`, `Wellness`).
   - Dynamic sorting: Featured, Price: Low to High, Price: High to Low, Highest Rated.
2. **Product Detail View (PDP)**:
   - Full-resolution imagery with specifications table (Dimensions, Materials, Origins).
   - Stock availability indicators with live stock checks.
   - Quantity selector with stock caps and instant "Add to Bag" visual feedback.
3. **Shopping Cart Drawer**:
   - Slide-over drawer with item thumbnails, quantity steppers, and item removal.
   - Real-time subtotal calculation.
   - Dynamic shipping calculation (Free worldwide shipping on orders $\ge \$150$, otherwise $\$15$).
   - Coupon voucher engine (Try `CODEALPHA10` for 10% off).
   - Estimated 8% sales tax calculation and final total.
4. **Secure User Authentication**:
   - User registration and login forms with client-side input validation.
   - Passwords securely hashed with **bcryptjs** (salt rounds: 10) before MongoDB persistence.
   - Stateless **JSON Web Tokens (JWT)** for session persistence in `localStorage`.
   - Protected routes (`/api/orders`, `/api/orders/my-orders`, `/api/auth/me`).
5. **Checkout & Order Processing**:
   - Delivery address collection with full validation.
   - Flexible payment method options: Credit / Debit Card, UPI / Net Banking, Cash on Delivery.
   - Automatic server-side price recalculation (tamper-proof).
   - Automatic inventory deduction upon purchase.
6. **Order Confirmation & History**:
   - Unique Order ID generation (`#ORD-XXXXXX`).
   - Order status tracking (`Confirmed`, `Processing`, `Shipped`, `Delivered`).
   - Dedicated "Order History" view showing previous purchases and item breakdowns.
7. **MongoDB Atlas Resilience**:
   - Native Mongoose models (`User`, `Product`, `Order`).
   - High-fidelity fallback persistence so the store runs smoothly even before configuring a remote Atlas URI.
   - Interactive database status & diagnostic console built right into the UI.

---

## 🛠️ Technology Stack (Strict Requirements)

| Tier | Technology | Notes |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) | **Zero** React, Angular, Vue, Next.js, JSX, or TSX |
| **Backend** | Node.js, Express.js | Modular routes, controllers, middleware |
| **Database** | MongoDB Atlas with Mongoose ODM | Real Mongoose schemas, relations & hooks |
| **Security** | bcryptjs, jsonwebtoken (JWT), CORS | Password hashing and protected bearer tokens |
| **Deployment** | Vercel (`vercel.json`) or Node.js host | Serverless & container ready |

---

## 📁 Project Structure

```text
├── .env.example              # Environment template
├── vercel.json               # Vercel deployment configuration
├── server.js                 # Express server & static asset mount
├── config/
│   └── db.js                 # Mongoose connection & resilience layer
├── models/
│   ├── User.js               # Mongoose User schema with bcrypt pre-save hook
│   ├── Product.js            # Mongoose Product schema & seed catalog
│   └── Order.js              # Mongoose Order schema with items & address
├── middleware/
│   └── auth.js               # JWT verification & route protection
├── routes/
│   ├── authRoutes.js         # /api/auth (register, login, me)
│   ├── productRoutes.js      # /api/products (list, categories, detail, seed)
│   ├── orderRoutes.js        # /api/orders (checkout, my-orders, detail)
│   └── configRoutes.js       # /api/config (database diagnostics, live Atlas test)
├── public/
│   ├── index.html            # Semantic HTML5 storefront markup
│   ├── css/
│   │   └── styles.css        # Responsive styling & 60-30-10 palette
│   ├── js/
│   │   ├── api.js            # Client-side API fetch client with JWT
│   │   └── app.js            # Vanilla JavaScript app state & UI logic
│   └── images/               # High-resolution product & hero photography
└── README.md                 # Complete documentation
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- npm or pnpm

### 2. Installation
```bash
git clone <repository-url>
cd lumen-ecommerce-store
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your `.env` variables:
```env
PORT=3000
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/ecommerce?retryWrites=true&w=majority"
JWT_SECRET="codealpha-ecommerce-secret-key-2026"
```

> **Note**: If `MONGODB_URI` is left blank, the application will automatically run in high-fidelity in-memory persistence mode so you can test all features immediately without downtime.

### 4. Run Development Server
```bash
npm run dev
# Server will start on http://localhost:3000
```

---

## 🍃 MongoDB Atlas Setup Guide

To connect your own MongoDB Atlas cloud database:
1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Sandbox Cluster**.
3. Under **Security > Database Access**, add a database user with password (e.g. readWriteAnyDatabase).
4. Under **Security > Network Access**, add IP address `0.0.0.0/0` (allow access from anywhere) so cloud deployments like Vercel can reach it.
5. In **Database > Clusters**, click **Connect > Drivers > Node.js**, and copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/ecommerce?retryWrites=true&w=majority
   ```
6. Add this string to your `.env` file as `MONGODB_URI`.
7. Restart the server. The catalog will automatically seed on first connect!

---

## ☁️ Deployment Guide

### Deploying to Vercel
1. Push your repository to GitHub.
2. In Vercel, click **Add New Project** and import the repository.
3. Under **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random secret string.
4. Deploy! The included `vercel.json` configures the Express API and static assets automatically.

### Deploying to Render / Railway
1. Create a **Web Service** pointing to your repository.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set `PORT=3000`, `MONGODB_URI`, and `JWT_SECRET` in environment variables.

---

## 🔒 API Endpoints

### Authentication
- `POST /api/auth/register` — Register new user with hashed password.
- `POST /api/auth/login` — Sign in and receive JWT token.
- `GET /api/auth/me` — Get authenticated user details.

### Products
- `GET /api/products` — Retrieve products with `category`, `search`, `sort` filters.
- `GET /api/products/categories` — Get unique categories.
- `GET /api/products/:id` — Retrieve product details.
- `POST /api/products/seed` — Seed or verify initial catalog data.

### Orders
- `POST /api/orders` — Authenticated checkout and order placement.
- `GET /api/orders/my-orders` — Get current user's order history.
- `GET /api/orders/:id` — Retrieve single order receipt.

### Diagnostics
- `GET /api/config/status` — Live status of MongoDB Atlas and document counts.
- `POST /api/config/connect` — Dynamically connect to an Atlas cluster.

---

## 📜 CodeAlpha Internship Verification
- **Intern Name**: Shibatharshini Iyappan
- **Role**: Full-Stack Web Development Intern
- **Project**: Simple E-Commerce Store
