# 🍽️ BiteMo — Multi-Restaurant Booking Platform

BiteMo is a full-stack **MERN + TypeScript** application for discovering and booking tables at fine-dining restaurants. It supports three distinct experiences in one codebase: **diners** browse and book, **restaurant owners** manage their listing and reservations, and **admins** approve restaurants and monitor platform activity.

> Built with React 19 + Vite on the frontend and Express 5 + MongoDB (Mongoose) on the backend, sharing a fully typed TypeScript codebase end to end.

---

## ✨ Features

### For Diners
- Browse and search restaurants by name, cuisine/tag, or location
- Filter by price range and minimum rating, sort by rating or price
- View curated **featured / exclusive** restaurant collections on the homepage
- Restaurant detail pages with photos, description, chef info, and reviews
- Real-time, date-based **seat availability** per time slot (calculated from existing confirmed bookings)
- Book a table with party size, occasion, and special requests
- View and cancel personal bookings from a user dashboard

### For Restaurant Owners
- Onboarding wizard to register a restaurant (name, cuisine, price range, location, seating capacity, available time slots, cover image)
- Cloudinary-backed image upload for the restaurant listing
- New restaurants start in a **pending** state until admin approval
- Owner dashboard to edit restaurant details and view incoming bookings
- Update booking status (confirmed / cancelled / completed) for their own restaurant only

### For Admins
- Review all restaurants across the platform and **approve / reject** owner submissions
- Platform-wide stats dashboard: total users, owners, restaurants, and bookings
- View the latest bookings across every restaurant

### Platform-wide
- JWT-based authentication with role-aware protected routes (`user`, `owner`, `admin`)
- Role-based route guarding on both the API (middleware) and the client (`ProtectedRoute`)
- Toast notifications, loading states, and a clean, modern dark UI (Tailwind CSS v4)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, React Router v7, Tailwind CSS v4, Axios, React Hot Toast, Lucide Icons |
| **Backend** | Node.js, Express 5, TypeScript (`tsx`/ESM) |
| **Database** | MongoDB with Mongoose ODM |
| **Auth** | JWT (`jsonwebtoken`) + bcrypt password hashing |
| **File Uploads** | Multer (memory storage) → Cloudinary |
| **Deployment** | Vercel (separate configs for client & server) |

---

## 📁 Project Structure

```
BiteMo App/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Shared, home, booking, owner & admin components
│   │   ├── context/             # Global app context (auth/user state)
│   │   ├── lib/api.ts          # Axios instance with JWT interceptor
│   │   ├── pages/               # Route-level pages (Home, Search, Dashboard, etc.)
│   │   └── App.tsx             # Route definitions
│   └── vercel.json
│
└── server/                     # Express + TypeScript backend
    ├── config/                 # MongoDB, Cloudinary, Multer setup
    ├── controllers/            # Route handler logic (auth, restaurants, bookings, owner, admin)
    ├── middlewares/auth.ts     # JWT auth, admin-only & owner-only guards
    ├── models/                 # Mongoose schemas: User, Restaurent, Booking
    ├── routes/                 # Express routers
    ├── seed.ts                 # Seeds demo users + restaurants
    ├── server.ts                # App entry point
    └── vercel.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Cloudinary](https://cloudinary.com/) account (for restaurant image uploads)
- Yarn (repo includes `yarn.lock`) or npm

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd "BiteMo App"
```

### 2. Backend setup
```bash
cd server
yarn install        # or npm install
```

Create a `.env` file in `server/`:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Run the dev server (with auto-reload):
```bash
yarn server          # nodemon + tsx
# or a one-off run:
yarn start
```

### 3. (Optional) Seed the database
Populates demo users and a set of approved restaurants:
```bash
npx tsx seed.ts
```

This creates three demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin12345` |
| Diner | `user@example.com` | `User12345` |
| Owner | `owner@example.com` | `Owner12345` |

> ⚠️ These are seed/demo credentials for local development only — change or remove them before deploying to production.

### 4. Frontend setup
```bash
cd ../client
yarn install         # or npm install
```

Create a `.env` file in `client/`:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:
```bash
yarn dev
```

The client runs on the Vite dev server (default `http://localhost:5173`) and talks to the API at the URL configured above.

---

## 🔌 API Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user (diner or owner) |
| `POST` | `/api/auth/login` | Public | Log in and receive a JWT |
| `GET` | `/api/auth/me` | Private | Get the current authenticated user |
| `GET` | `/api/restaurants` | Public | List approved restaurants (search, filter, sort) |
| `GET` | `/api/restaurants/featured` | Public | Get featured/exclusive restaurants |
| `GET` | `/api/restaurants/:slug` | Public | Get a single restaurant by slug |
| `GET` | `/api/restaurants/:id/availability` | Public | Get seat availability by date |
| `POST` | `/api/bookings` | Private | Create a booking |
| `GET` | `/api/bookings/my` | Private | Get the current user's bookings |
| `PUT` | `/api/bookings/:id/cancel` | Private | Cancel a booking |
| `GET` | `/api/owner/restaurant` | Owner/Admin | Get the logged-in owner's restaurant |
| `POST` | `/api/owner/restaurant` | Owner/Admin | Create a restaurant listing (with image upload) |
| `PUT` | `/api/owner/restaurant` | Owner/Admin | Update a restaurant listing |
| `GET` | `/api/owner/bookings` | Owner/Admin | Get bookings for the owner's restaurant |
| `PUT` | `/api/owner/bookings/:id/status` | Owner/Admin | Update a booking's status |
| `GET` | `/api/admin/restaurants` | Admin | List all restaurants (any status) |
| `PUT` | `/api/admin/restaurants/:id/approve` | Admin | Approve/reject a restaurant |
| `GET` | `/api/admin/stats` | Admin | Platform-wide statistics |

All private routes require an `Authorization: Bearer <token>` header.

---

## 🏗️ Building for Production

**Backend**
```bash
cd server
yarn build     # compiles TypeScript via tsc
```

**Frontend**
```bash
cd client
yarn build     # tsc -b && vite build
```

The repo includes `vercel.json` files for both `client/` and `server/`, making it straightforward to deploy each as a separate Vercel project (with `VITE_API_URL` on the client pointed at the deployed server URL).

---

## 📄 License

This project is licensed under the MIT License.
