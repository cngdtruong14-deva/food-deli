## Table Schemas

### 1. branches (Chi nhánh)

```sql
CREATE TABLE branches (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  address VARCHAR(500) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(100),
  manager_id VARCHAR(36),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opening_time TIME NOT NULL DEFAULT '08:00:00',
  closing_time TIME NOT NULL DEFAULT '22:00:00',
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. tables (Bàn ăn)

```sql
CREATE TABLE tables (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  branch_id VARCHAR(36) NOT NULL,
  table_number VARCHAR(10) NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  qr_code VARCHAR(500) UNIQUE NOT NULL,
  floor_number INT DEFAULT 1,
  zone VARCHAR(50), -- VIP, Regular, Outdoor
  status ENUM('available', 'occupied', 'reserved', 'cleaning') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_table_branch (branch_id, table_number),
  INDEX idx_status (status),
  INDEX idx_branch_status (branch_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. categories (Danh mục món)

```sql
CREATE TABLE categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  display_order INT DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_status_order (status, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4. products (Sản phẩm/Món ăn)

```sql
CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  category_id VARCHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2), -- Giá vốn (để tính lợi nhuận)
  image_url VARCHAR(500),
  preparation_time INT DEFAULT 15, -- minutes
  calories INT,
  is_spicy BOOLEAN DEFAULT FALSE,
  is_vegetarian BOOLEAN DEFAULT FALSE,
  tags JSON, -- ["best-seller", "new", "promotion"]
  status ENUM('available', 'out_of_stock', 'discontinued') DEFAULT 'available',
  sold_count INT DEFAULT 0, -- Số lượng đã bán
  rating DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category_status (category_id, status),
  INDEX idx_sold_count (sold_count DESC),
  INDEX idx_rating (rating DESC),
  FULLTEXT idx_name_desc (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5. customers (Khách hàng)

```sql
CREATE TABLE customers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  phone VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(100),
  email VARCHAR(100),
  gender ENUM('male', 'female', 'other'),
  date_of_birth DATE,
  segment_id VARCHAR(36), -- FK to segments
  total_orders INT DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0.00,
  avg_order_value DECIMAL(10, 2) DEFAULT 0.00,
  last_order_date TIMESTAMP NULL,
  favorite_products JSON, -- Array of product_ids
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE SET NULL,
  INDEX idx_phone (phone),
  INDEX idx_segment (segment_id),
  INDEX idx_total_spent (total_spent DESC),
  INDEX idx_last_order (last_order_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6. segments (Phân khúc khách hàng)

```sql
CREATE TABLE segments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(50) NOT NULL, -- New, Regular, VIP, Churned
  description TEXT,
  criteria JSON, -- {"min_orders": 5, "min_spent": 1000000}
  color VARCHAR(7), -- Hex color for UI
  discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 7. orders (Đơn hàng)

```sql
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_number VARCHAR(20) UNIQUE NOT NULL, -- ORD-20250115-0001
  table_id VARCHAR(36) NOT NULL,
  branch_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36),
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0.00,
  tax DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'card', 'vnpay', 'momo', 'zalopay') DEFAULT 'cash',
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE RESTRICT,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_order_number (order_number),
  INDEX idx_table_status (table_id, order_status),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_branch_date (branch_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 8. order_items (Chi tiết đơn hàng)

```sql
CREATE TABLE order_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  product_name VARCHAR(200) NOT NULL, -- Snapshot tên món
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  notes TEXT, -- "Không hành", "Ít cay"
  status ENUM('pending', 'preparing', 'ready', 'served') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 9. activity_logs (Nhật ký hành vi - dữ liệu cho AI)

```sql
CREATE TABLE activity_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(100), -- Browser session
  customer_id VARCHAR(36),
  product_id VARCHAR(36),
  action_type ENUM('view', 'add_to_cart', 'remove_from_cart', 'search', 'filter') NOT NULL,
  metadata JSON, -- {"duration_seconds": 10, "search_query": "pizza"}
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_customer_action (customer_id, action_type, created_at),
  INDEX idx_product_action (product_id, action_type, created_at),
  INDEX idx_session (session_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 10. loyalty_points (Điểm tích lũy)

```sql
CREATE TABLE loyalty_points (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  customer_id VARCHAR(36) NOT NULL,
  points INT DEFAULT 0,
  tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
  points_earned INT DEFAULT 0,
  points_redeemed INT DEFAULT 0,
  last_transaction_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  UNIQUE KEY unique_customer (customer_id),
  INDEX idx_tier (tier),
  INDEX idx_points (points DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 11. ingredients (Nguyên liệu)

```sql
CREATE TABLE ingredients (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- kg, lít, gram
  stock_quantity DECIMAL(10, 2) DEFAULT 0.00,
  min_stock_level DECIMAL(10, 2) DEFAULT 0.00, -- Ngưỡng cảnh báo
  cost_per_unit DECIMAL(10, 2),
  supplier VARCHAR(200),
  status ENUM('in_stock', 'low_stock', 'out_of_stock') DEFAULT 'in_stock',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_status (status),
  INDEX idx_stock (stock_quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 12. recipes (Continued)

```sql
CREATE TABLE recipes (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id VARCHAR(36) NOT NULL,
  ingredient_id VARCHAR(36) NOT NULL,
  quantity_required DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT,
  UNIQUE KEY unique_product_ingredient (product_id, ingredient_id),
  INDEX idx_product (product_id),
  INDEX idx_ingredient (ingredient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 13. promotions (Khuyến mãi)

```sql
CREATE TABLE promotions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  code VARCHAR(50) UNIQUE,
  discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_value DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2),
  applicable_to ENUM('all', 'category', 'product', 'segment') DEFAULT 'all',
  applicable_ids JSON, -- Array of category_ids, product_ids, or segment_ids
  usage_limit INT DEFAULT NULL, -- NULL = unlimited
  usage_count INT DEFAULT 0,
  per_user_limit INT DEFAULT 1,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_code (code),
  INDEX idx_status_dates (status, start_date, end_date),
  INDEX idx_applicable (applicable_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 14. promotion_usage (Lịch sử sử dụng khuyến mãi)

```sql
CREATE TABLE promotion_usage (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  promotion_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  order_id VARCHAR(36) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_promotion_customer (promotion_id, customer_id),
  INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 15. product_reviews (Đánh giá món ăn)

```sql
CREATE TABLE product_reviews (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  order_id VARCHAR(36) NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  image_urls JSON, -- Array of image URLs
  helpful_count INT DEFAULT 0,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY unique_customer_product_order (customer_id, product_id, order_id),
  INDEX idx_product_rating (product_id, rating DESC),
  INDEX idx_status (status),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 16. staff (Nhân viên)

```sql
CREATE TABLE staff (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  branch_id VARCHAR(36) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  role ENUM('admin', 'manager', 'chef', 'waiter', 'cashier') NOT NULL,
  avatar_url VARCHAR(500),
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_branch_role (branch_id, role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 17. notifications (Thông báo)

```sql
CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  recipient_type ENUM('customer', 'staff', 'branch') NOT NULL,
  recipient_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('order', 'promotion', 'system', 'reminder') NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  data JSON, -- Additional data (order_id, promotion_id, etc.)
  channel ENUM('in_app', 'email', 'sms', 'zalo') NOT NULL,
  status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_recipient (recipient_type, recipient_id, is_read),
  INDEX idx_status_sent (status, sent_at),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 18. inventory_transactions (Giao dịch kho)

```sql
CREATE TABLE inventory_transactions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  ingredient_id VARCHAR(36) NOT NULL,
  branch_id VARCHAR(36) NOT NULL,
  transaction_type ENUM('in', 'out', 'adjustment', 'waste') NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2),
  reference_type ENUM('purchase', 'order', 'manual', 'spoilage') NOT NULL,
  reference_id VARCHAR(36), -- order_id or purchase_id
  notes TEXT,
  performed_by VARCHAR(36), -- staff_id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  INDEX idx_ingredient_branch (ingredient_id, branch_id),
  INDEX idx_created (created_at DESC),
  INDEX idx_reference (reference_type, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 19. sales_reports (Báo cáo doanh thu)

```sql
CREATE TABLE sales_reports (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  branch_id VARCHAR(36) NOT NULL,
  report_date DATE NOT NULL,
  report_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
  total_orders INT DEFAULT 0,
  completed_orders INT DEFAULT 0,
  cancelled_orders INT DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_discount DECIMAL(12, 2) DEFAULT 0,
  net_revenue DECIMAL(12, 2) DEFAULT 0,
  total_customers INT DEFAULT 0,
  new_customers INT DEFAULT 0,
  returning_customers INT DEFAULT 0,
  avg_order_value DECIMAL(10, 2) DEFAULT 0,
  top_products JSON, -- Array of {product_id, name, quantity, revenue}
  peak_hours JSON, -- {hour: order_count}
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_branch_date_type (branch_id, report_date, report_type),
  INDEX idx_date_type (report_date DESC, report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 20. ai_recommendations (Gợi ý AI)

```sql
CREATE TABLE ai_recommendations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  customer_id VARCHAR(36),
  session_id VARCHAR(100),
  recommendation_type ENUM('product', 'combo', 'upsell', 'cross_sell') NOT NULL,
  recommended_items JSON NOT NULL, -- Array of product_ids with scores
  algorithm VARCHAR(50) NOT NULL, -- 'collaborative_filtering', 'content_based', etc.
  confidence_score DECIMAL(5, 4), -- 0.0000 to 1.0000
  context JSON, -- {current_cart, time_of_day, weather, etc.}
  was_shown BOOLEAN DEFAULT FALSE,
  was_clicked BOOLEAN DEFAULT FALSE,
  was_purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_customer_type (customer_id, recommendation_type),
  INDEX idx_session (session_id),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Database Indexes Optimization

```sql
-- Performance indexes for common queries

-- Orders: Find active orders by table
CREATE INDEX idx_orders_table_active ON orders(table_id, order_status, created_at DESC)
WHERE order_status IN ('pending', 'confirmed', 'preparing');

-- Products: Search with full-text
ALTER TABLE products ADD FULLTEXT INDEX ft_name_desc (name, description);

-- Activity logs: Customer behavior analysis
CREATE INDEX idx_activity_customer_action_time ON activity_logs(customer_id, action_type, created_at DESC);

-- Composite index for reporting
CREATE INDEX idx_orders_branch_date_status ON orders(branch_id, DATE(created_at), order_status);
```

---

## Stored Procedures

### 1. Calculate Daily Revenue

```sql
DELIMITER $$

CREATE PROCEDURE sp_calculate_daily_revenue(
  IN p_branch_id VARCHAR(36),
  IN p_date DATE
)
BEGIN
  SELECT 
    DATE(created_at) as report_date,
    COUNT(*) as total_orders,
    SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
    SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
    SUM(total) as total_revenue,
    SUM(discount) as total_discount,
    SUM(total - discount) as net_revenue,
    AVG(total) as avg_order_value,
    COUNT(DISTINCT customer_id) as unique_customers
  FROM orders
  WHERE branch_id = p_branch_id
    AND DATE(created_at) = p_date
  GROUP BY DATE(created_at);
END$$

DELIMITER ;
```

### 2. Update Product Stock After Order

```sql
DELIMITER $$

CREATE PROCEDURE sp_deduct_inventory(
  IN p_order_id VARCHAR(36)
)
BEGIN
  DECLARE v_branch_id VARCHAR(36);
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_product_id VARCHAR(36);
  DECLARE v_quantity INT;
  
  DECLARE cur CURSOR FOR
    SELECT product_id, quantity
    FROM order_items
    WHERE order_id = p_order_id;
    
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  -- Get branch_id
  SELECT branch_id INTO v_branch_id
  FROM orders
  WHERE id = p_order_id;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_product_id, v_quantity;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Deduct ingredients based on recipe
    INSERT INTO inventory_transactions (
      ingredient_id, 
      branch_id, 
      transaction_type, 
      quantity, 
      reference_type, 
      reference_id
    )
    SELECT 
      r.ingredient_id,
      v_branch_id,
      'out',
      r.quantity_required * v_quantity,
      'order',
      p_order_id
    FROM recipes r
    WHERE r.product_id = v_product_id;
    
    -- Update ingredient stock
    UPDATE ingredients i
    INNER JOIN recipes r ON i.id = r.ingredient_id
    SET i.stock_quantity = i.stock_quantity - (r.quantity_required * v_quantity)
    WHERE r.product_id = v_product_id;
    
  END LOOP;
  
  CLOSE cur;
END$$

DELIMITER ;
```

### 3. Auto-Assign Customer Segment

```sql
DELIMITER $$

CREATE PROCEDURE sp_update_customer_segment(
  IN p_customer_id VARCHAR(36)
)
BEGIN
  DECLARE v_total_orders INT;
  DECLARE v_total_spent DECIMAL(12, 2);
  DECLARE v_last_order_days INT;
  DECLARE v_segment_id VARCHAR(36);
  
  -- Get customer stats
  SELECT 
    COUNT(*),
    COALESCE(SUM(total), 0),
    DATEDIFF(NOW(), MAX(created_at))
  INTO v_total_orders, v_total_spent, v_last_order_days
  FROM orders
  WHERE customer_id = p_customer_id
    AND order_status = 'completed';
  
  -- Determine segment
  IF v_total_orders = 0 THEN
    SELECT id INTO v_segment_id FROM segments WHERE name = 'New';
  ELSEIF v_last_order_days > 30 THEN
    SELECT id INTO v_segment_id FROM segments WHERE name = 'Churned';
  ELSEIF v_total_spent > 5000000 AND v_total_orders >= 10 THEN
    SELECT id INTO v_segment_id FROM segments WHERE name = 'VIP';
  ELSEIF v_total_orders >= 5 THEN
    SELECT id INTO v_segment_id FROM segments WHERE name = 'Regular';
  ELSE
    SELECT id INTO v_segment_id FROM segments WHERE name = 'Casual';
  END IF;
  
  -- Update customer
  UPDATE customers
  SET 
    segment_id = v_segment_id,
    total_orders = v_total_orders,
    total_spent = v_total_spent,
    avg_order_value = v_total_spent / NULLIF(v_total_orders, 0)
  WHERE id = p_customer_id;
END$$

DELIMITER ;
```

---

## Triggers

### 1. Update Product Sold Count

```sql
DELIMITER $$

CREATE TRIGGER trg_update_product_sold_count
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  UPDATE products
  SET sold_count = sold_count + NEW.quantity
  WHERE id = NEW.product_id;
END$$

DELIMITER ;
```

### 2. Update Product Rating

```sql
DELIMITER $$

CREATE TRIGGER trg_update_product_rating
AFTER INSERT ON product_reviews
FOR EACH ROW
BEGIN
  UPDATE products
  SET rating = (
    SELECT AVG(rating)
    FROM product_reviews
    WHERE product_id = NEW.product_id
      AND status = 'approved'
  )
  WHERE id = NEW.product_id;
END$$

DELIMITER ;
```

### 3. Check Ingredient Stock

```sql
DELIMITER $$

CREATE TRIGGER trg_check_ingredient_stock
AFTER UPDATE ON ingredients
FOR EACH ROW
BEGIN
  IF NEW.stock_quantity <= NEW.min_stock_level THEN
    INSERT INTO notifications (
      recipient_type,
      recipient_id,
      title,
      message,
      type,
      priority,
      channel,
      data
    ) VALUES (
      'staff',
      (SELECT id FROM staff WHERE role = 'manager' LIMIT 1),
      'Low Stock Alert',
      CONCAT('Ingredient "', NEW.name, '" is running low: ', NEW.stock_quantity, ' ', NEW.unit),
      'system',
      'high',
      'in_app',
      JSON_OBJECT('ingredient_id', NEW.id, 'stock_quantity', NEW.stock_quantity)
    );
  END IF;
END$$

DELIMITER ;
```

---

## Views for Common Queries

### 1. Active Orders View

```sql
CREATE VIEW v_active_orders AS
SELECT 
  o.id,
  o.order_number,
  t.table_number,
  b.name as branch_name,
  c.name as customer_name,
  c.phone as customer_phone,
  o.total,
  o.order_status,
  o.created_at,
  TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as elapsed_minutes,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'product_name', oi.product_name,
      'quantity', oi.quantity,
      'status', oi.status
    )
  ) as items
FROM orders o
INNER JOIN tables t ON o.table_id = t.id
INNER JOIN branches b ON o.branch_id = b.id
LEFT JOIN customers c ON o.customer_id = c.id
INNER JOIN order_items oi ON o.id = oi.order_id
WHERE o.order_status IN ('pending', 'confirmed', 'preparing', 'ready')
GROUP BY o.id;
```

### 2. Product Performance View

```sql
CREATE VIEW v_product_performance AS
SELECT 
  p.id,
  p.name,
  c.name as category_name,
  p.price,
  p.cost_price,
  (p.price - p.cost_price) as profit_per_unit,
  ((p.price - p.cost_price) / p.price * 100) as profit_margin,
  p.sold_count,
  (p.sold_count * (p.price - p.cost_price)) as total_profit,
  p.rating,
  COUNT(DISTINCT pr.id) as review_count,
  p.status,
  CASE
    WHEN p.sold_count >= (SELECT AVG(sold_count) FROM products) 
      AND (p.price - p.cost_price) >= (SELECT AVG(price - cost_price) FROM products)
    THEN 'Star'
    WHEN p.sold_count >= (SELECT AVG(sold_count) FROM products)
    THEN 'Cash Cow'
    WHEN (p.price - p.cost_price) >= (SELECT AVG(price - cost_price) FROM products)
    THEN 'Question Mark'
    ELSE 'Dog'
  END as bcg_category
FROM products p
INNER JOIN categories c ON p.category_id = c.id
LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.status = 'approved'
GROUP BY p.id;
```

### 3. Customer Lifetime Value View

```sql
CREATE VIEW v_customer_ltv AS
SELECT 
  c.id,
  c.name,
  c.phone,
  s.name as segment,
  c.total_orders,
  c.total_spent,
  c.avg_order_value,
  DATEDIFF(NOW(), c.created_at) as customer_age_days,
  DATEDIFF(NOW(), c.last_order_date) as days_since_last_order,
  (c.total_spent / NULLIF(DATEDIFF(NOW(), c.created_at), 0) * 365) as projected_annual_value,
  lp.points as loyalty_points,
  lp.tier as loyalty_tier,
  CASE
    WHEN DATEDIFF(NOW(), c.last_order_date) > 30 THEN 'At Risk'
    WHEN c.total_orders >= 10 AND c.total_spent > 5000000 THEN 'Champion'
    WHEN c.total_orders >= 5 THEN 'Loyal'
    WHEN c.total_orders >= 2 THEN 'Potential'
    ELSE 'New'
  END as customer_category
FROM customers c
LEFT JOIN segments s ON c.segment_id = s.id
LEFT JOIN loyalty_points lp ON c.id = lp.customer_id
WHERE c.status = 'active';
```

---

## Sample Data Seeds

```sql
-- Insert sample segments
INSERT INTO segments (id, name, description, criteria, color, discount_percentage) VALUES
(UUID(), 'New', 'First-time customers', '{"min_orders": 0, "max_orders": 1}', '#3498db', 5.00),
(UUID(), 'Regular', 'Returning customers', '{"min_orders": 2, "max_orders": 9}', '#2ecc71', 10.00),
(UUID(), 'VIP', 'High-value customers', '{"min_orders": 10, "min_spent": 5000000}', '#f39c12', 15.00),
(UUID(), 'Churned', 'Inactive customers', '{"days_since_last_order": 30}', '#e74c3c', 20.00);

-- Insert sample categories
INSERT INTO categories (id, name, icon, display_order) VALUES
(UUID(), 'Appetizers', '🥗', 1),
(UUID(), 'Main Course', '🍜', 2),
(UUID(), 'Beverages', '🥤', 3),
(UUID(), 'Desserts', '🍰', 4);

-- Insert sample branch
INSERT INTO branches (id, name, address, phone, status) VALUES
(UUID(), 'Hanoi Central', '123 Hoan Kiem, Hanoi', '0243-xxx-xxxx', 'active');
```

---

## Database Maintenance

### Daily Tasks
```sql
-- Optimize tables
OPTIMIZE TABLE orders, order_items, activity_logs;

-- Update statistics
ANALYZE TABLE products, customers, orders;

-- Cleanup old logs (keep 90 days)
DELETE FROM activity_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### Weekly Tasks
```sql
-- Generate sales reports
CALL sp_generate_weekly_report();

-- Update customer segments
UPDATE customers c
SET segment_id = (
  SELECT segment_id FROM v_customer_ltv v WHERE v.id = c.id
);

-- Check for data integrity
SELECT * FROM orders o
LEFT JOIN tables t ON o.table_id = t.id
WHERE t.id IS NULL;
```

---

## Backup Strategy

```bash
# Full backup (daily at 2 AM)
mysqldump -u root -p \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  qr_order_db > backup_$(date +%Y%m%d).sql

# Incremental backup (hourly)
mysqlbinlog --read-from-remote-server \
  --host=localhost \
  --stop-never \
  mysql-bin.000001 > incremental_backup.sql
```