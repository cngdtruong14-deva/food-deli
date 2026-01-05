# Coding Standards & Best Practices

## JavaScript/Node.js Standards

### 1. Naming Conventions

```javascript
// ✅ GOOD: camelCase cho biến và hàm
const userName = 'John Doe';
function calculateTotal() {}

// ✅ GOOD: PascalCase cho class và component
class ProductController {}
const UserProfile = () => {};

// ✅ GOOD: UPPER_SNAKE_CASE cho constants
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// ❌ BAD: Inconsistent naming
const user_name = 'John';
function Calculate_total() {}
```

### 2. File Naming

```
✅ GOOD:
- productController.js
- userService.js
- orderModel.js
- TableLayout.jsx (React component)

❌ BAD:
- Product-Controller.js
- user_service.js
- Order.model.js
```

### 3. Code Structure

```javascript
// ✅ GOOD: Clear and organized
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const ProductController = require('../controllers/product.controller');

// Routes
router.get('/', ProductController.getAll);
router.get('/:id', ProductController.getById);
router.post('/', authenticate, ProductController.create);

module.exports = router;

// ❌ BAD: Messy and unclear
const express=require('express');
const router=express.Router();
router.get('/',function(req,res){
  // Business logic directly in routes
});
```

### 4. Error Handling

```javascript
// ✅ GOOD: Try-catch with proper error handling
async function getProductById(id) {
  try {
    const product = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }
    
    return product;
  } catch (error) {
    logger.error('Error in getProductById:', error);
    throw error;
  }
}

// ❌ BAD: No error handling
async function getProductById(id) {
  const product = await db.query('SELECT * FROM products WHERE id = ?', [id]);
  return product;
}
```

### 5. Async/Await Best Practices

```javascript
// ✅ GOOD: Proper async/await usage
async function processOrder(orderId) {
  try {
    const order = await getOrder(orderId);
    const payment = await processPayment(order);
    await updateOrderStatus(orderId, 'paid');
    await sendNotification(order.customerId);
    
    return { success: true, payment };
  } catch (error) {
    logger.error('Order processing failed:', error);
    throw error;
  }
}

// ❌ BAD: Mixing promises and callbacks
function processOrder(orderId, callback) {
  getOrder(orderId).then(order => {
    processPayment(order, (err, payment) => {
      if (err) return callback(err);
      callback(null, payment);
    });
  });
}
```

---

## React/Next.js Standards

### 1. Component Structure

```jsx
// ✅ GOOD: Functional component with hooks
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ProductCard = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  
  useEffect(() => {
    // Side effects here
  }, [product]);
  
  const handleAddToCart = () => {
    onAddToCart({ ...product, quantity });
  };
  
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.price.toLocaleString('vi-VN')} đ</p>
      <button onClick={handleAddToCart}>Thêm vào giỏ</button>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    imageUrl: PropTypes.string
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired
};

export default ProductCard;

// ❌ BAD: Class component without proper structure
class ProductCard extends React.Component {
  render() {
    return <div>{this.props.product.name}</div>;
  }
}
```

### 2. Custom Hooks

```javascript
// ✅ GOOD: Reusable custom hook
import { useState, useEffect } from 'react';

export const useSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const newSocket = io(url);
    
    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));
    
    setSocket(newSocket);
    
    return () => newSocket.close();
  }, [url]);
  
  return { socket, connected };
};

// Usage
const { socket, connected } = useSocket('http://localhost:5000');
```

### 3. State Management

```javascript
// ✅ GOOD: Zustand store
import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  
  addItem: (product) => set((state) => ({
    items: [...state.items, product]
  })),
  
  removeItem: (productId) => set((state) => ({
    items: state.items.filter(item => item.id !== productId)
  })),
  
  getTotalPrice: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
  
  clearCart: () => set({ items: [] })
}));
```

---

## SQL Standards

### 1. Query Writing

```sql
-- ✅ GOOD: Clear and formatted
SELECT 
  p.id,
  p.name,
  p.price,
  c.name AS category_name,
  COUNT(oi.id) AS sold_count
FROM products p
INNER JOIN categories c ON p.category_id = c.id
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE p.status = 'available'
  AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.id
ORDER BY sold_count DESC
LIMIT 10;

-- ❌ BAD: Unreadable
SELECT p.id,p.name,p.price FROM products p WHERE p.status='available' ORDER BY p.name;
```

### 2. Parameterized Queries

```javascript
// ✅ GOOD: Prevents SQL injection
const getProductById = async (id) => {
  const [rows] = await db.query(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );
  return rows[0];
};

// ❌ BAD: SQL injection vulnerability
const getProductById = async (id) => {
  const query = `SELECT * FROM products WHERE id = '${id}'`;
  const [rows] = await db.query(query);
  return rows[0];
};
```

---

## API Response Standards

### Success Response Format

```javascript
// ✅ GOOD: Consistent format
res.status(200).json({
  success: true,
  data: {
    products: [...],
    pagination: {
      page: 1,
      limit: 20,
      total: 156
    }
  },
  message: 'Products retrieved successfully',
  timestamp: new Date().toISOString()
});
```

### Error Response Format

```javascript
// ✅ GOOD: Detailed error info
res.status(404).json({
  success: false,
  error: {
    code: 'PRODUCT_NOT_FOUND',
    message: 'Product with ID xyz not found',
    details: {
      productId: 'xyz',
      timestamp: new Date().toISOString()
    }
  }
});
```

---

## Security Best Practices

### 1. Input Validation

```javascript
// ✅ GOOD: Joi validation
const Joi = require('joi');

const orderSchema = Joi.object({
  tableId: Joi.string().uuid().required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).max(99).required()
    })
  ).min(1).required()
});

const validateOrder = (data) => {
  return orderSchema.validate(data);
};
```

### 2. Password Hashing

```javascript
// ✅ GOOD: Use bcrypt
const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

### 3. JWT Best Practices

```javascript
// ✅ GOOD: Secure JWT implementation
const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

---

## Testing Standards

### 1. Unit Test Example

```javascript
// ✅ GOOD: Clear test structure
describe('ProductController', () => {
  describe('getAll', () => {
    it('should return list of products', async () => {
      // Arrange
      const mockProducts = [{ id: '1', name: 'Test Product' }];
      jest.spyOn(ProductModel, 'findAll').mockResolvedValue(mockProducts);
      
      // Act
      const result = await ProductController.getAll();
      
      // Assert
      expect(result).toEqual(mockProducts);
      expect(ProductModel.findAll).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors gracefully', async () => {
      // Arrange
      jest.spyOn(ProductModel, 'findAll').mockRejectedValue(new Error('DB Error'));
      
      // Act & Assert
      await expect(ProductController.getAll()).rejects.toThrow('DB Error');
    });
  });
});
```

---

## Documentation Standards

### 1. Function Documentation

```javascript
/**
 * Tạo đơn hàng mới
 * 
 * @param {Object} orderData - Dữ liệu đơn hàng
 * @param {string} orderData.tableId - ID của bàn
 * @param {Array} orderData.items - Danh sách món
 * @param {string} orderData.customerId - ID khách hàng (optional)
 * @returns {Promise} Thông tin đơn hàng đã tạo
 * @throws {Error} Nếu dữ liệu không hợp lệ
 * 
 * @example
 * const order = await createOrder({
 *   tableId: 'table-123',
 *   items: [{ productId: 'prod-1', quantity: 2 }]
 * });
 */
async function createOrder(orderData) {
  // Implementation
}
```

---

## Performance Best Practices

### 1. Database Indexing

```sql
-- ✅ GOOD: Index for frequently queried columns
CREATE INDEX idx_products_category_status ON products(category_id, status);
CREATE INDEX idx_orders_table_date ON orders(table_id, created_at DESC);
CREATE INDEX idx_customers_phone ON customers(phone);
```

### 2. Caching Strategy

```javascript
// ✅ GOOD: Redis caching
const redis = require('../config/redis');

const getProductsWithCache = async () => {
  const cacheKey = 'products:all';
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const products = await ProductModel.findAll();
  
  // Store in cache (1 hour)
  await redis.setex(cacheKey, 3600, JSON.stringify(products));
  
  return products;
};
```

---

## Git Commit Standards

```bash
# ✅ GOOD: Clear commit messages
git commit -m "feat(products): add search functionality with filters"
git commit -m "fix(orders): resolve race condition in order status update"
git commit -m "docs(api): update authentication endpoint documentation"
git commit -m "refactor(database): optimize product query performance"

# ❌ BAD: Unclear messages
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Build process, dependencies

**Examples:**
```
feat(orders): add real-time order tracking
fix(auth): resolve JWT expiration issue
docs(api): update order endpoint documentation
refactor(database): optimize product queries
```

---

## Code Review Checklist

- [ ] Code follows naming conventions
- [ ] No hardcoded values (use environment variables)
- [ ] Proper error handling implemented
- [ ] Input validation added
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No console.log() in production code
- [ ] Security vulnerabilities checked
- [ ] Performance optimized
- [ ] Database queries use parameterized statements
- [ ] No commented-out code
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Functions are single-purpose
- [ ] Proper logging (use logger, not console)

---

## ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:node/recommended",
    "plugin:react/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"]
  }
}
```

---

## Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

---

## References

- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

