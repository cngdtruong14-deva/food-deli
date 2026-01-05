# Current System Architecture

## Overview

The project currently follows a **MERN-like stack** (MongoDB, Express, React, Node.js), differing from the Next.js/MySQL architecture described in the original `docs/`.

## Technology Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose ODM)
  - _Note: Original docs specified MySQL._
- **Authentication**: JWT (JSON Web Tokens)
- **Image Handling**: Multer (Local storage/uploads)
- **Payment**: Stripe Integration
- **API Structure**: RESTful API

### Frontend

- **Framework**: React (Vite)
  - _Note: Original docs specified Next.js (App Router)._
- **State Management**: Context API (`StoreContext`)
  - _Note: Original docs specified Zustand._
- **Styling**: Vanilla CSS (with some component-scoped styles)
  - _Note: Original docs specified Tailwind CSS._
- **HTTP Client**: Axios

## Project Structure

### Backend (`/backend`)

```
backend/
├── config/             # Database connection (db.js)
├── controllers/        # Business logic (e.g., orderController.js, foodController.js)
├── models/             # Mongoose Schemas (Food, Order, User)
├── routes/             # API Endpoints (foodRoute, orderRoute, userRoute)
├── uploads/            # Static image files
├── middleware/         # Auth middleware
├── server.js           # Entry point
└── .env                # Environment variables
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── assets/         # Images and icons
│   ├── components/     # Reusable UI components (Navbar, Header, ExploreMenu)
│   ├── context/        # Global State (StoreContext.jsx)
│   ├── pages/          # Route components (Home, Cart, PlaceOrder)
│   ├── App.jsx         # Main component & Routing defined here
│   └── main.jsx        # Entry point
└── index.html          # HTML Shell
```

## Current Implementation Status

### Implemented Features

- **User Authentication**: Register/Login (User & Admin).
- **Food Management**:
  - Add Food (Admin).
  - List Food.
  - Remove Food.
- **Cart Functionality**: Add/remove items, calculate total.
- **Order System**:
  - Place Order (Stripe & COD).
  - List User Orders.
  - List All Orders (Admin Status Update).

### Missing / To-Be-Adapted Features (from `docs/`)

- **Branch Management**: Currently single-tenant/monolithic.
- **Table Management**: No concept of tables (QR Code flow missing).
- **Staff Roles**: Only simple User vs Admin check; no granular permissions.
- **Categories**: Currently implicitly handled, likely need explicitly modeled tables/collections.
- **Real-time Updates**: Socket.io logic is missing.
- **Analytics**: No reporting dashboard.
