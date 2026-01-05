# Hướng Dẫn Sử Dụng - Quản Trị Viên

## Tổng Quan Hệ Thống Quản Trị

Admin Portal là trung tâm điều khiển toàn bộ hệ thống QR Order, giúp bạn quản lý menu, đơn hàng, khách hàng và phân tích kinh doanh.

---

## 🚀 Bắt Đầu

### Đăng Nhập

1. Truy cập: `https://admin.yourdomain.com`
2. Đăng nhập với tài khoản admin:
   - **Email**: admin@restaurant.com
   - **Mật khẩu**: (do hệ thống cấp)
3. **2FA** (nếu bật): Nhập mã từ Google Authenticator

### Dashboard Chính

Sau khi đăng nhập, bạn thấy:
- **📊 Tổng quan doanh thu**: Hôm nay, tuần, tháng
- **📈 Biểu đồ**: Doanh thu theo giờ
- **🎯 KPI**: Đơn hàng, khách hàng, tỷ lệ hoàn thành
- **⚡ Hoạt động real-time**: Đơn đang xử lý

---

## 📋 Quản Lý Menu

### Thêm Món Mới

1. Vào **Menu** → **Sản phẩm** → **Thêm mới**
2. Điền thông tin:
   - **Tên món**: Bắt buộc
   - **Danh mục**: Chọn từ dropdown
   - **Giá bán**: Nhập số (VNĐ)
   - **Giá vốn**: Để tính lợi nhuận
   - **Hình ảnh**: Upload (tối đa 2MB)
   - **Mô tả**: Chi tiết món ăn
   - **Thời gian chuẩn bị**: Phút
   - **Tags**: best-seller, new, promotion
3. Nhấn **"Lưu"**

### Chỉnh Sửa Món

1. Tìm món cần sửa (tìm kiếm hoặc lọc)
2. Nhấn **"Chỉnh sửa"**
3. Cập nhật thông tin
4. Nhấn **"Cập nhật"**

### Xóa/Ẩn Món

- **Xóa mềm**: Ẩn khỏi menu (có thể khôi phục)
- **Xóa vĩnh viễn**: Xóa hoàn toàn (cần xác nhận)

### Quản Lý Danh Mục

**Thêm danh mục:**
1. Menu → **Danh mục** → **Thêm mới**
2. Điền: Tên, Icon (emoji), Thứ tự hiển thị
3. Lưu

**Sắp xếp danh mục:**
- Kéo thả để thay đổi thứ tự
- Hoặc chỉnh số trong cột "Thứ tự"

---

## 📦 Quản Lý Đơn Hàng

### Xem Danh Sách Đơn

**Bộ lọc:**
- **Trạng thái**: Tất cả, Đang chờ, Đang chuẩn bị, Hoàn thành, Đã hủy
- **Thời gian**: Hôm nay, Tuần này, Tháng này, Tùy chọn
- **Bàn**: Lọc theo bàn cụ thể
- **Khách hàng**: Tìm theo tên/số điện thoại

**Sắp xếp:**
- Mặc định: Mới nhất trước
- Có thể sắp xếp theo: Thời gian, Tổng tiền, Trạng thái

### Chi Tiết Đơn Hàng

Nhấn vào đơn để xem:
- **Thông tin đơn**: Mã đơn, Bàn, Khách hàng, Thời gian
- **Danh sách món**: Số lượng, Giá, Ghi chú, Trạng thái từng món
- **Thanh toán**: Phương thức, Trạng thái, Hóa đơn
- **Timeline**: Lịch sử thay đổi trạng thái

### Cập Nhật Trạng Thái Đơn

**Các trạng thái:**
- 🕐 **Pending**: Đã nhận, chờ xác nhận
- ✅ **Confirmed**: Đã xác nhận, gửi bếp
- 👨‍🍳 **Preparing**: Đang chuẩn bị
- ✅ **Ready**: Sẵn sàng phục vụ
- 🍽️ **Served**: Đã phục vụ
- ✅ **Completed**: Hoàn thành
- ❌ **Cancelled**: Đã hủy

**Cách cập nhật:**
1. Vào chi tiết đơn
2. Chọn trạng thái mới
3. Nhấn **"Cập nhật"**
4. Hệ thống tự động thông báo cho khách hàng

### Hủy Đơn Hàng

**Khi nào hủy:**
- Khách hàng yêu cầu
- Hết nguyên liệu
- Lỗi hệ thống

**Quy trình:**
1. Vào chi tiết đơn
2. Nhấn **"Hủy đơn"**
3. Chọn lý do hủy
4. Nhập ghi chú (nếu cần)
5. Xác nhận hủy

**Lưu ý:**
- Đơn đã vào bếp: Cần xác nhận từ bếp
- Đơn đã thanh toán: Tự động hoàn tiền

---

## 👥 Quản Lý Khách Hàng

### Xem Danh Sách Khách Hàng

**Thông tin hiển thị:**
- Tên, Số điện thoại, Email
- Hạng thành viên (Đồng, Bạc, Vàng, Kim Cương)
- Tổng đơn, Tổng chi tiêu
- Lần đặt cuối

**Bộ lọc:**
- **Hạng**: Lọc theo hạng thành viên
- **Tìm kiếm**: Theo tên/số điện thoại
- **Sắp xếp**: Theo tổng chi tiêu, số đơn, lần đặt cuối

### Chi Tiết Khách Hàng

Nhấn vào khách hàng để xem:
- **Thông tin cá nhân**: Tên, SĐT, Email, Ngày sinh
- **Lịch sử đơn hàng**: Tất cả đơn đã đặt
- **Điểm tích lũy**: Số điểm hiện tại, Hạng
- **Món yêu thích**: Top món thường gọi
- **Phân khúc**: New, Regular, VIP, Churned

### Phân Khúc Khách Hàng

**Tự động phân loại:**
- **New**: 0-1 đơn
- **Regular**: 2-9 đơn
- **VIP**: 10+ đơn và tổng chi tiêu > 5,000,000đ
- **Churned**: Không đặt > 30 ngày

**Thủ công phân loại:**
1. Vào chi tiết khách hàng
2. Chọn phân khúc
3. Lưu

### Gửi Thông Báo

**Gửi qua Zalo ZNS:**
1. Chọn khách hàng
2. Nhấn **"Gửi thông báo"**
3. Chọn template: Chào mừng, Khuyến mãi, Nhắc nhở
4. Điền thông tin
5. Gửi

---

## 📊 Phân Tích & Báo Cáo

### Dashboard Tổng Quan

**Các chỉ số chính:**
- **Doanh thu**: Hôm nay, Tuần này, Tháng này
- **Đơn hàng**: Tổng số, Hoàn thành, Hủy
- **Khách hàng**: Mới, Quay lại, Tỷ lệ giữ chân
- **Trung bình đơn**: Giá trị đơn trung bình

**Biểu đồ:**
- Doanh thu theo giờ (heatmap)
- Doanh thu theo ngày (line chart)
- Top món bán chạy (bar chart)
- Phân khúc khách hàng (pie chart)

### Báo Cáo Doanh Thu

**Xem báo cáo:**
1. Vào **Báo cáo** → **Doanh thu**
2. Chọn khoảng thời gian
3. Chọn chi nhánh (hoặc tất cả)
4. Xem báo cáo

**Thông tin báo cáo:**
- Tổng doanh thu
- Số đơn hàng
- Giá trị đơn trung bình
- Tỷ lệ hoàn thành
- So sánh với kỳ trước

**Xuất báo cáo:**
- Excel (.xlsx)
- PDF
- Gửi email

### Báo Cáo Món Ăn

**Ma trận BCG (Boston Consulting Group):**
- ⭐ **Stars**: Bán nhiều + Lợi nhuận cao
- 💰 **Cash Cows**: Bán nhiều + Lợi nhuận thấp
- ❓ **Question Marks**: Bán ít + Lợi nhuận cao
- 🐕 **Dogs**: Bán ít + Lợi nhuận thấp

**Hành động:**
- **Stars**: Tiếp tục quảng bá
- **Cash Cows**: Tối ưu giá vốn
- **Question Marks**: Tăng marketing
- **Dogs**: Xem xét loại bỏ

### Báo Cáo Khách Hàng

**Customer Lifetime Value (CLV):**
- Tổng chi tiêu
- Số đơn trung bình/tháng
- Tỷ lệ quay lại
- Dự đoán giá trị tương lai

**Phân tích hành vi:**
- Giờ đặt món phổ biến
- Món thường gọi
- Phương thức thanh toán
- Khu vực ngồi

---

## 🎁 Quản Lý Khuyến Mãi

### Tạo Khuyến Mãi

1. Vào **Khuyến mãi** → **Thêm mới**
2. Điền thông tin:
   - **Tên chương trình**: VD: "Giảm 20% cuối tuần"
   - **Mã khuyến mãi**: Tự động hoặc nhập thủ công
   - **Loại giảm giá**: % hoặc số tiền cố định
   - **Giá trị**: 20% hoặc 50,000đ
   - **Đơn tối thiểu**: Số tiền tối thiểu
   - **Giảm tối đa**: Giới hạn số tiền giảm
   - **Áp dụng cho**: Tất cả, Danh mục, Món cụ thể
   - **Giới hạn sử dụng**: Số lần tối đa
   - **Thời gian**: Ngày bắt đầu - Kết thúc
3. Lưu

### Quản Lý Mã Giảm Giá

**Xem danh sách:**
- Mã đang hoạt động
- Mã đã hết hạn
- Mã đã dùng hết lượt

**Chỉnh sửa:**
- Gia hạn thời gian
- Tăng giới hạn sử dụng
- Tạm dừng/Kích hoạt lại

### Theo Dõi Sử Dụng

**Thống kê:**
- Số lần đã sử dụng
- Tổng giá trị giảm
- Top khách hàng sử dụng
- Hiệu quả chương trình

---

## 🏢 Quản Lý Chi Nhánh

### Thêm Chi Nhánh

1. Vào **Cài đặt** → **Chi nhánh** → **Thêm mới**
2. Điền thông tin:
   - **Tên chi nhánh**
   - **Địa chỉ**
   - **Số điện thoại**
   - **Email**
   - **Giờ mở cửa**: 8:00 - 22:00
   - **Tọa độ**: Latitude, Longitude (cho map)
3. Lưu

### Quản Lý Bàn

**Thêm bàn:**
1. Vào **Bàn ăn** → **Thêm mới**
2. Chọn chi nhánh
3. Điền: Số bàn, Sức chứa, Tầng, Khu vực
4. Hệ thống tự tạo QR code
5. In QR code và dán lên bàn

**Quản lý trạng thái:**
- **Available**: Trống
- **Occupied**: Có khách
- **Reserved**: Đã đặt trước
- **Cleaning**: Đang dọn dẹp

### Tạo QR Code Cho Bàn

1. Vào danh sách bàn
2. Chọn bàn cần tạo QR
3. Nhấn **"Tạo QR Code"**
4. Download file PDF/PNG
5. In và dán lên bàn

---

## 👨‍💼 Quản Lý Nhân Viên

### Thêm Nhân Viên

1. Vào **Nhân viên** → **Thêm mới**
2. Điền thông tin:
   - **Email**: Dùng để đăng nhập
   - **Mật khẩu**: Tạm thời (yêu cầu đổi lần đầu)
   - **Họ tên**
   - **Số điện thoại**
   - **Vai trò**: Admin, Manager, Chef, Waiter, Cashier
   - **Chi nhánh**: Gán vào chi nhánh
3. Lưu

### Phân Quyền

**Các vai trò:**
- **Super Admin**: Toàn quyền
- **Manager**: Quản lý chi nhánh
- **Chef**: Xem đơn, cập nhật trạng thái
- **Waiter**: Xem đơn, cập nhật trạng thái bàn
- **Cashier**: Thanh toán, xuất hóa đơn

**Cấp quyền:**
1. Vào chi tiết nhân viên
2. Chọn vai trò
3. Tùy chỉnh quyền (nếu cần)
4. Lưu

### Theo Dõi Hoạt Động

**Xem log:**
- Lịch sử đăng nhập
- Hành động đã thực hiện
- Thời gian làm việc
- Số đơn đã xử lý

---

## ⚙️ Cài Đặt Hệ Thống

### Cài Đặt Chung

**Thông tin nhà hàng:**
- Tên nhà hàng
- Logo
- Địa chỉ
- Hotline
- Email
- Website
- Social media

**Cài đặt thanh toán:**
- Bật/tắt các phương thức
- Cấu hình VNPay, Momo, ZaloPay
- Phí giao dịch

**Cài đặt thông báo:**
- Zalo ZNS: Bật/tắt, Template
- Email: SMTP settings
- SMS: Provider settings

### Cài Đặt Menu

**Hiển thị:**
- Sắp xếp danh mục
- Số món/trang
- Hiển thị giá vốn (cho admin)
- Hiển thị đánh giá

**Tự động:**
- Ẩn món hết hàng
- Cảnh báo khi hết nguyên liệu
- Tự động cập nhật giá

### Cài Đặt Khách Hàng

**Chương trình tích điểm:**
- Tỷ lệ tích điểm: 1 điểm = ? VNĐ
- Quy đổi điểm: ? điểm = ? VNĐ
- Hạng thành viên: Điều kiện, Ưu đãi

**Phân khúc tự động:**
- Tiêu chí phân loại
- Tần suất cập nhật

---

## 🔒 Bảo Mật

### Đổi Mật Khẩu

1. Vào **Cài đặt** → **Tài khoản**
2. Nhấn **"Đổi mật khẩu"**
3. Nhập mật khẩu cũ
4. Nhập mật khẩu mới (tối thiểu 8 ký tự)
5. Xác nhận
6. Lưu

### Bật 2FA (Two-Factor Authentication)

1. Vào **Cài đặt** → **Bảo mật**
2. Nhấn **"Bật 2FA"**
3. Quét QR code bằng Google Authenticator
4. Nhập mã xác nhận
5. Lưu mã dự phòng

### Quản Lý Phiên Đăng Nhập

**Xem danh sách:**
- Thiết bị đang đăng nhập
- Địa chỉ IP
- Thời gian đăng nhập
- Vị trí (nếu có)

**Đăng xuất từ xa:**
- Chọn thiết bị
- Nhấn **"Đăng xuất"**

---

## 📱 Ứng Dụng Di Động (Nếu có)

### Cài Đặt App

1. Tải app từ App Store/Google Play
2. Đăng nhập với tài khoản admin
3. Cho phép thông báo

### Tính Năng Trên App

- Xem dashboard
- Quản lý đơn hàng
- Nhận thông báo real-time
- Xem báo cáo nhanh

---

## ❓ Câu Hỏi Thường Gặp

### Q1: Làm sao để xem đơn hàng của chi nhánh khác?
**A:** Chọn chi nhánh từ dropdown ở header, hoặc vào **Cài đặt** → **Chuyển chi nhánh**.

### Q2: Tôi quên mật khẩu admin?
**A:** Nhấn **"Quên mật khẩu"** ở trang đăng nhập, hoặc liên hệ Super Admin.

### Q3: Làm sao để xuất báo cáo Excel?
**A:** Vào báo cáo, chọn khoảng thời gian, nhấn **"Xuất Excel"**.

### Q4: Có thể xóa đơn hàng đã hoàn thành không?
**A:** Không thể xóa, chỉ có thể xem. Đơn hàng được lưu để báo cáo và phân tích.

### Q5: Làm sao để thay đổi logo nhà hàng?
**A:** Vào **Cài đặt** → **Thông tin nhà hàng** → Upload logo mới.

---

## 🆘 Hỗ Trợ

### Liên Hệ Kỹ Thuật

- 📞 Hotline: **1900-xxxx**
- 📧 Email: admin-support@restaurant.com
- 💬 Chat: Nhấn nút "Hỗ trợ" trong app

### Tài Liệu

- [Video hướng dẫn](https://docs.restaurant.com/videos)
- [FAQ chi tiết](https://docs.restaurant.com/faq)
- [API Documentation](../architecture/api-design.md)

---

**Chúc bạn quản lý hiệu quả! 🎯**

