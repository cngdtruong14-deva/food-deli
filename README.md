# Food Deli - Modern Vietnamese Food Delivery Platform

A full-stack food delivery application built with the **MERN Stack** (MongoDB, Express, React, Node.js), customized for the Vietnamese market with support for both delivery and dine-in experiences.

## 🚀 Key Features

### 🛒 Customer App (Frontend)

- **Interactive UI/UX**:
  - **Dynamic Header Carousel**: Auto-rotating preview of special Combos and featured dishes.
  - **Real-time Search**: Instant filtering of menu items by name.
  - **Food Detail Popup**: Appetizing descriptions and visual previews without navigating away.
- **Vietnamese Localization**: Full support for Vietnamese language and VND currency formatting (e.g., 100.000 đ).
- **Flexible Ordering**:
  - **Delivery**: Address management and payment integration (Stripe/COD).
  - **Dine-in**: QR Code scanning simulation to set table context.
- **Checkout**: Streamlined checkout process with a clear order summary list.

### 💼 Admin Dashboard

- **Analytics & Insights**:
  - **Visual Charts**: Revenue trends and top-selling items visualized using Recharts.
  - **Business Metrics**: Real-time tracking of Total Orders, Revenue, Average Order Value, and Pending Orders.
- **Menu Management**: Add, edit, and remove dishes with image uploads.
- **Order Management**: Track status (Processing, Out for delivery, Delivered) and filter by date.

### 🔧 Backend

- **Secure API**: JWT Authentication for user and admin protection.
- **Database**: Robust MongoDB schema for Users, Orders, Food items, and Branches.
- **Seeding**: Automated scripts to populate the database with authentic Vietnamese menu data (`quan-nhau-tu-do`).

## 🛠️ Tech Stack

- **Frontend**: React.js, React Router, Context API, CSS3 (Custom animations)
- **Admin**: React.js, Recharts, React Toastify
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT, Bcrypt, Multer
- **Payment**: Stripe Integration

## 📦 Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/food-deli.git
   cd food-deli
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install

   # Create .env file
   # PORT=4000
   # MONGO_URL=your_mongodb_connection_string
   # JWT_SECRET=your_jwt_secret
   # STRIPE_SECRET_KEY=your_stripe_secret_key

   # Run the server
   npm run server
   ```

3. **Frontend Setup**

   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Admin Panel Setup**
   ```bash
   cd ../admin
   npm install
   npm run dev
   ```

## 🗃️ Database Seeding (Optional)

To populate the database with the initial Vietnamese menu:

```bash
cd backend/scripts
node seedVietnameseMenu.js
```

## 📸 Screenshots

- **Home Page**: Interactive carousel and categorized menu.
- **Food Popup**: Detailed view of dishes.
- **Admin Dashboard**: Analytics and order charts.

## 📄 License

This project is open-source and available for educational purposes.
