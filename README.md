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

## 🛠️ Cài đặt & Khởi chạy (Installation & Setup)

Để chạy dự án trên máy cục bộ, vui lòng làm theo các bước sau:

### 📋 Yêu cầu hệ thống (Prerequisites)

- [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản LTS mới nhất)
- [MongoDB](https://www.mongodb.com/) (Dùng phiên bản cài đặt sẵn trên máy hoặc MongoDB Atlas)
- **Git**

### 1. Clone dự án

```bash
git clone https://github.com/yourusername/food-deli.git
cd food-deli
```

### 2. Cài đặt Backend

Backend chạy trên cổng `4000` mặc định.

```bash
cd backend
npm install

# Tạo file .env trong thư mục backend
# Copy nội dung dưới đây vào file .env:
# PORT=4000
# MONGO_URL=mongodb://localhost:27017/food-deli  (Hoặc connection string của bạn)
# JWT_SECRET=chuoi_bi_mat_cua_ban
# STRIPE_SECRET_KEY=khoa_bi_mat_stripe_cua_ban

# Khởi chạy server
npm run server
```

Sau khi chạy, API sẽ hoạt động tại: `http://localhost:4000`

### 3. Cài đặt Frontend (App Khách hàng)

Frontend chạy trên cổng `5173` mặc định (Vite).

```bash
cd ../frontend
npm install

# Tạo file .env trong thư mục frontend (Nếu cần kết nối API khác localhost)
# VITE_API_URL=http://localhost:4000

# Khởi chạy ứng dụng
npm run dev
```

Truy cập App Khách hàng tại: `http://localhost:5173`

### 4. Cài đặt Admin Panel (Trang quản trị)

Admin Panel dùng để quản lý món ăn và đơn hàng.

```bash
cd ../admin
npm install

# Tạo file .env trong thư mục admin
# VITE_API_URL=http://localhost:4000

# Khởi chạy trang quản trị
npm run dev
```

Truy cập Admin Panel tại: `http://localhost:5173` (Lưu ý: Vite có thể tự đổi cổng nếu 5173 đang bận, hãy kiểm tra terminal)

## 🗃️ Khởi tạo dữ liệu mẫu (Database Seeding)

Để thêm sẵn danh sách món ăn Việt Nam vào database:

```bash
cd backend/scripts
node seedVietnameseMenu.js
```

**Lưu ý quan trọng (Dữ liệu Chi nhánh & Bàn ăn):**
Để khởi tạo lại toàn bộ dữ liệu Chi nhánh và Bàn ăn (tránh lỗi mất dữ liệu bàn khi ID chi nhánh thay đổi), hãy chạy lệnh:

```bash
node backend/scripts/seed_all.js
```

_Script này sẽ tự động xóa và tạo lại 17 chi nhánh, sau đó tạo mới ~1500 bàn ăn tương ứng._

## 🤖 Tính năng AI & Hướng dẫn Kiểm thử (AI Features & Testing)

Hệ thống tích hợp hai tính năng AI chính:

1. **Gợi ý món ăn thông minh (Combo Recommendation):** Dựa trên giỏ hàng hiện tại.
2. **Dự báo nhập hàng (Demand Forecasting):** Dựa trên lịch sử bán hàng 30 ngày qua.

### 1️⃣ Khởi động AI Service (Bắt buộc)

Trước khi test, hãy đảm bảo Python Service đang chạy.

```bash
cd ai_service
# Cài đặt thư viện nếu chưa có
pip install -r requirements.txt
# Chạy service
python app.py
# Server sẽ chạy tại http://localhost:5001
```

### 2️⃣ Kiểm tra Tổng thể (System Health Check)

Chạy script tự động để kiểm tra kết nối giữa Node.js, Python, và Database.

```bash
node backend/tests/manual_scripts/verify_ai_system.js
```

_Script này sẽ báo cáo trạng thái PASS/FAIL cho từng endpoint._

### 3️⃣ nạp dữ liệu mẫu (Data Seeding)

**Bước A: Nạp Menu (Nếu chưa có)**

```bash
node backend/scripts/seedVietnameseMenu.js
```

_Tạo danh sách 148 món ăn từ menu Quán Nhậu Tự Do._

**Bước B: Tạo dữ liệu giả lập cho Dự báo (Forecasting Test)**
Để test biểu đồ dự báo nhập hàng, bạn cần có lịch sử đơn hàng. Script dưới đây sẽ tạo 100 đơn hàng trong 30 ngày qua.

```bash
node backend/tests/manual_scripts/test_ai_service.js
```

**Kịch bản kiểm tra (Test Scenario):**

1.  **Health Check**: Ping kết nối tới Python Service và MongoDB.
2.  **Seeding**: Tự động tạo dữ liệu mẫu (Ví dụ: Order chứa Burger & Coke).
3.  **Simulation**: Gửi request hỏi "Mua Burger thì nên kèm gì?".
4.  **Verification**: Kiểm tra phản hồi của AI có gợi ý "Coke" hay không.
5.  **Cleanup**: P xóa toàn bộ dữ liệu rác sau khi test xong.
    \_Lưu ý: Script này sử dụng "COMBO 1" và "COMBO 2" thực tế từ menu để tạo đơn hàng

### 4️⃣ Kiểm tra trên Giao diện (UI)

1. Truy cập **Admin Panel** -> **Quản Lý Tồn Kho (Inventory)**.
2. Chọn tab **"📊 Dự báo AI"**.
3. Bạn sẽ thấy biểu đồ so sánh Tồn kho thực tế vs Nhu cầu dự kiến.
4. Các món cần nhập hàng sẽ có cảnh báo màu **Đỏ (Critical)** hoặc **Vàng (Warning)**.

## 📸 Screenshots

- **Home Page**: Interactive carousel and categorized menu.
- **Food Popup**: Detailed view of dishes.
- **Admin Dashboard**: Analytics and order charts.

## 📄 License

This project is open-source and available for educational purposes.
