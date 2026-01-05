```markdown
# Hướng Dẫn Sử Dụng - Bếp (Kitchen Display System)

## Tổng Quan Hệ Thống Bếp

Hệ thống Kitchen Display System (KDS) giúp bếp nhận và quản lý đơn hàng theo thời gian thực, tối ưu quy trình chế biến.

---

## 🚀 Khởi Động Hệ Thống

### Đăng Nhập

1. Mở trình duyệt tại máy tính bếp
2. Truy cập: `https://admin.yourdomain.com/kitchen`
3. Đăng nhập với tài khoản bếp:
   - **Tài khoản**: chef@restaurant.com
   - **Mật khẩu**: (do quản lý cấp)

### Giao Diện Chính

Sau khi đăng nhập, bạn sẽ thấy:
- **Header**: Chi nhánh, thời gian, trạng thái kết nối
- **Grid đơn hàng**: Danh sách đơn đang chờ
- **Thông báo âm thanh**: Khi có đơn mới
- **Nút điều khiển**: Cài đặt, âm thanh, đăng xuất

---

## 📋 Nhận Đơn Hàng Mới

### Thông Báo Đơn Mới

Khi khách hàng gửi đơn:
- 🔔 **Âm thanh**: "Ting!" (3 lần)
- 🟢 **Thẻ đơn mới**: Nổi bật màu xanh
- 💻 **Desktop notification**: Popup trên màn hình
- 📱 **Rung**: (nếu dùng tablet)

### Thông Tin Trên Thẻ Đơn

```
┌─────────────────────────────────┐
│ ORD-20250115-0123    🕐 12:35  │ ← Mã đơn & thời gian
│ BÀN A05              PENDING    │ ← Bàn & trạng thái
├─────────────────────────────────┤
│ 2x Phở Bò Tái                  │ ← Số lượng & món
│    📝 Không hành               │ ← Ghi chú đặc biệt
│                                 │
│ 1x Bún Chả                     │
│    📝 Ít cay                   │
│                                 │
│ 1x Trà đá                      │
├─────────────────────────────────┤
│ ⏱️ Thời gian: 2 phút           │ ← Thời gian chờ
│ 🚨 Ưu tiên: NORMAL             │ ← Mức độ ưu tiên
├─────────────────────────────────┤
│ [Xác Nhận] [Từ Chối]          │ ← Nút thao tác
└─────────────────────────────────┘
```

---

## ✅ Xử Lý Đơn Hàng

### Bước 1: Xác Nhận Đơn

**Nhấn nút "Xác Nhận"** khi:
- ✓ Đã đọc kỹ đơn hàng
- ✓ Đủ nguyên liệu để chế biến
- ✓ Không có vấn đề gì

**Sau khi xác nhận:**
- Thẻ đơn chuyển sang **màu vàng**
- Trạng thái: **"PREPARING"** (Đang chuẩn bị)
- Khách hàng nhận thông báo: "Đầu bếp đang chuẩn bị"

### Bước 2: Chế Biến Món

**Quy trình chuẩn:**
1. **Kiểm tra ghi chú**: Đọc yêu cầu đặc biệt
2. **Chuẩn bị nguyên liệu**: Đúng khẩu phần
3. **Chế biến**: Theo công thức chuẩn
4. **Kiểm tra chất lượng**: Trước khi hoàn thành

### Bước 3: Đánh Dấu Hoàn Thành

**Khi món đã xong:**
1. Nhấn nút **"Sẵn Sàng"** trên từng món
2. Thẻ món chuyển sang **màu xanh lá**
3. Nhân viên phục vụ nhận thông báo
4. Khách hàng nhận thông báo: "Món của bạn đã sẵn sàng!"

**Khi tất cả món trong đơn đã xong:**
- Thẻ đơn tự động chuyển sang **"READY"**
- Di chuyển sang cột "Sẵn sàng"

### Bước 4: Đã Phục Vụ

- Nhân viên mang món ra → Nhấn **"Đã phục vụ"**
- Thẻ đơn biến mất khỏi màn hình bếp
- Lưu vào lịch sử hoàn thành

---

## 🚨 Xử Lý Trường Hợp Đặc Biệt

### Hết Nguyên Liệu

**Nếu không đủ nguyên liệu:**
1. Nhấn nút **"Từ Chối"** trên món đó
2. Chọn lý do: **"Hết nguyên liệu"**
3. Hệ thống tự động:
   - Thông báo cho khách hàng
   - Đề xuất món thay thế
   - Cập nhật trạng thái món

### Đơn Hàng Khẩn Cấp (VIP)

Đơn hàng từ khách VIP hoặc khẩn cấp:
- 🔴 **Thẻ màu đỏ**
- 🚨 **Tag "URGENT"**
- ⚡ **Ưu tiên xử lý trước**

**Quy tắc:**
- Làm trước các đơn thường
- Thời gian mục tiêu: < 10 phút

### Yêu Cầu Đặc Biệt Phức Tạp

**Nếu ghi chú không rõ:**
1. Nhấn nút **"Cần Hỗ Trợ"**
2. Gọi quản lý hoặc nhân viên phục vụ
3. Xác nhận lại với khách hàng

---

## 📊 Màn Hình Theo Dõi

### Cột Trạng Thái

```
┌──────────┬──────────┬──────────┬──────────┐
│ MỚI (5)  │ ĐANG (8) │ XONG (3) │ PHỤC VỤ  │
├──────────┼──────────┼──────────┼──────────┤
│ ORD-123  │ ORD-115  │ ORD-110  │ (Trống)  │
│ ORD-124  │ ORD-116  │ ORD-111  │          │
│ ORD-125  │ ORD-117  │ ORD-112  │          │
│ ...      │ ...      │          │          │
└──────────┴──────────┴──────────┴──────────┘
```

### Bộ Lọc & Sắp Xếp

**Lọc theo:**
- ⏰ Thời gian chờ (mới nhất/cũ nhất)
- 🍽️ Loại món (Chính/Phụ/Đồ uống)
- 🏷️ Ưu tiên (Khẩn cấp/Thường)
- 🎯 Bàn/Khu vực

**Sắp xếp:**
- Mặc định: Thời gian tạo
- Khuyến nghị: Ưu tiên → Thời gian chờ

---

## ⏱️ Quản Lý Thời Gian

### Chỉ Báo Thời Gian

| Thời Gian Chờ | Màu Sắc | Hành Động |
|---------------|---------|-----------|
| < 5 phút | 🟢 Xanh lá | Bình thường |
| 5-10 phút | 🟡 Vàng | Tăng tốc |
| 10-15 phút | 🟠 Cam | Cảnh báo |
| > 15 phút | 🔴 Đỏ | Khẩn cấp! |

### Mục Tiêu Thời Gian

| Loại Món | Thời Gian Chuẩn |
|----------|-----------------|
| Khai vị | 5-7 phút |
| Món chính | 12-15 phút |
| Đồ uống | 2-3 phút |
| Tráng miệng | 5 phút |

### Cảnh Báo Chậm Trễ

**Khi đơn quá 15 phút:**
- 🚨 Thẻ nhấp nháy đỏ
- 📢 Âm thanh cảnh báo liên tục
- 📱 Thông báo đến quản lý

---

## 🔧 Tính Năng Nâng Cao

### Chế Độ Hiển Thị

**Chuyển đổi giữa:**
1. **Grid View**: Thẻ lưới (mặc định)
2. **List View**: Danh sách chi tiết
3. **Timeline View**: Dòng thời gian

**Phím tắt:**
- `G`: Grid
- `L`: List  
- `T`: Timeline

### In Phiếu Bếp (Kitchen Ticket)

**Tự động in khi:**
- Có đơn mới (tùy cấu hình)
- Nhấn nút "In" trên thẻ đơn

**Thông tin trên phiếu:**
- Mã đơn, bàn, thời gian
- Danh sách món + ghi chú
- Thứ tự ưu tiên

### Thống Kê Ca Làm

**Nhấn nút "Thống Kê"** để xem:
- 📦 Tổng đơn đã xử lý
- ⏱️ Thời gian trung bình/đơn
- ⭐ Tỷ lệ hoàn thành đúng hạn
- 🏆 Món được gọi nhiều nhất

---

## 🎯 Best Practices

### Quy Trình Làm Việc Hiệu Quả

1. **Ưu tiên đơn theo:**
   - Thời gian chờ lâu nhất
   - Đơn VIP/Khẩn cấp
   - Món có thời gian chế biến ngắn

2. **Batch cooking:**
   - Nhóm các món giống nhau
   - Chuẩn bị cùng lúc để tiết kiệm thời gian

3. **Giao tiếp:**
   - Thông báo ngay nếu thiếu nguyên liệu
   - Cập nhật trạng thái liên tục
   - Hỏi khi không chắc chắn

### Checklist Đầu Ca

- [ ] Kiểm tra kết nối mạng
- [ ] Bật âm thanh thông báo
- [ ] Kiểm tra máy in phiếu bếp
- [ ] Xác nhận danh sách nguyên liệu
- [ ] Đăng nhập hệ thống

### Checklist Cuối Ca

- [ ] Hoàn thành tất cả đơn đang chờ
- [ ] Dọn dẹp khu vực bếp
- [ ] Cập nhật tình trạng nguyên liệu
- [ ] Đăng xuất hệ thống
- [ ] Bàn giao ca tiếp theo

---

## ❓ Xử Lý Sự Cố

### Không Nhận Được Đơn Mới

**Kiểm tra:**
1. Kết nối Internet (biểu tượng WiFi)
2. Trạng thái đăng nhập
3. F5 (Refresh) trang

**Nếu vẫn không được:**
- Gọi IT Support: ext. 123
- Chuyển sang chế độ dự phòng (giấy)

### Hệ Thống Chậm/Lag

**Giải pháp:**
1. Đóng các tab không cần thiết
2. Xóa cache trình duyệt (Ctrl + Shift + Delete)
3. Khởi động lại trình duyệt
4. Liên hệ IT nếu vẫn chậm

### Mất Kết Nối Đột Ngột

**Hệ thống tự động:**
- Lưu trạng thái hiện tại
- Tự động kết nối lại
- Đồng bộ dữ liệu

**Bạn cần làm:**
- Giữ trình duyệt mở
- Không tắt máy
- Chờ kết nối lại (< 30 giây)

---

## 📞 Liên Hệ Hỗ Trợ

### Hỗ Trợ Kỹ Thuật
- 📞 Ext: **123** (nội bộ)
- 📧 Email: kitchen-support@restaurant.com

### Báo Lỗi
- Chụp màn hình lỗi
- Ghi rõ: Thời gian, hành động đang làm
- Gửi qua Zalo nhóm "Bếp IT"

### Đào Tạo Lại
- Yêu cầu đào tạo lại qua quản lý
- Video hướng dẫn: https://training.restaurant.com

---

**Chúc các bạn làm việc hiệu quả! 👨‍🍳**

```

---