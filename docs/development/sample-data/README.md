# Sample Data

Thư mục này chứa các file dữ liệu mẫu để phục vụ cho việc phát triển và testing.

## Files

### `menu.json`
Thực đơn mẫu cho nhà hàng với đầy đủ:
- **Categories**: 4 danh mục (Khai Vị, Món Chính, Đồ Uống, Tráng Miệng)
- **Products**: 20 món ăn mẫu với đầy đủ thông tin

## Cấu trúc dữ liệu

### Categories
```json
{
  "id": "cat-001",
  "name": "Khai Vị",
  "description": "Các món khai vị đặc sắc",
  "icon": "🥗",
  "display_order": 1,
  "status": "active"
}
```

### Products
```json
{
  "id": "prod-001",
  "category_id": "cat-001",
  "name": "Gỏi Cuốn Tôm Thịt",
  "description": "Mô tả món ăn",
  "price": 45000,
  "cost_price": 20000,
  "image_url": "https://example.com/images/goi-cuon.jpg",
  "preparation_time": 10,
  "calories": 180,
  "is_spicy": false,
  "is_vegetarian": false,
  "tags": ["best-seller", "signature"],
  "status": "available",
  "sold_count": 0,
  "rating": 0.00
}
```

## Cách sử dụng

### 1. Import vào Database

```bash
# Sử dụng script import
node scripts/import-menu.js sample-data/menu.json
```

### 2. Sử dụng trong Testing

```javascript
const menuData = require('./sample-data/menu.json');

// Sử dụng trong unit tests
describe('Menu API', () => {
  it('should return all categories', () => {
    const categories = menuData.categories;
    expect(categories).toHaveLength(4);
  });
});
```

### 3. Sử dụng trong Development

```javascript
// Seed database với dữ liệu mẫu
const menuData = require('./docs/development/sample-data/menu.json');

async function seedMenu() {
  // Insert categories
  for (const category of menuData.categories) {
    await db.query('INSERT INTO categories ...', [category]);
  }
  
  // Insert products
  for (const product of menuData.products) {
    await db.query('INSERT INTO products ...', [product]);
  }
}
```

## Lưu ý

- **IDs**: Các ID trong file mẫu là tạm thời, sẽ được thay thế bằng UUID khi import vào database
- **Image URLs**: Các URL hình ảnh là placeholder, cần thay thế bằng URL thực tế
- **Prices**: Giá cả có thể được điều chỉnh theo thực tế
- **Status**: Tất cả món đều ở trạng thái "available" mặc định

## Mở rộng

Có thể thêm các file mẫu khác:
- `tables.json` - Danh sách bàn ăn mẫu
- `customers.json` - Khách hàng mẫu
- `orders.json` - Đơn hàng mẫu
- `promotions.json` - Khuyến mãi mẫu

