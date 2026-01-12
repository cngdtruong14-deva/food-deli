// ============================================
// CRITICAL & HIGH PRIORITY FIXES FOR FoodItem.jsx
// ============================================
// Apply these fixes to: frontend/src/components/FoodItem/FoodItem.jsx

// ============ FIX 1: Division by Zero & Negative Savings ============
// Location: Lines 27-38

// REPLACE THIS:
// --- LOGIC: Smart Savings ---
let finalOriginalPrice = originalPrice;
const isCombo = name.toLowerCase().includes("combo") || description.toLowerCase().includes("combo");

if (isCombo && (!finalOriginalPrice || finalOriginalPrice <= price)) {
    // Synthetic Savings: ~15% markup
    finalOriginalPrice = Math.ceil(price * 1.15 / 1000) * 1000; 
}

const hasSavings = finalOriginalPrice > price;
const savingsAmount = finalOriginalPrice - price;
const savingsPercent = finalOriginalPrice > 0 ? Math.round((savingsAmount / finalOriginalPrice) * 100) : 0;

// WITH THIS:
// --- LOGIC: Smart Savings (FIXED) ---
// Validate and sanitize originalPrice
let finalOriginalPrice = 0;
if (originalPrice && typeof originalPrice === 'number' && originalPrice > 0) {
  finalOriginalPrice = originalPrice;
}

const isCombo = name.toLowerCase().includes("combo") || description.toLowerCase().includes("combo");

// Validate: If originalPrice is set but invalid (lower than price), ignore it
if (finalOriginalPrice > 0 && finalOriginalPrice <= price) {
  console.warn(`[FoodItem] Invalid originalPrice (${finalOriginalPrice}) <= price (${price}) for ${name}. Ignoring.`);
  finalOriginalPrice = 0;
}

// Generate synthetic price for combos if needed
if (isCombo && (!finalOriginalPrice || finalOriginalPrice <= price)) {
    // Synthetic Savings: ~15% markup
    finalOriginalPrice = Math.ceil(price * 1.15 / 1000) * 1000; 
}

// Calculate savings with proper validation
const hasSavings = finalOriginalPrice > 0 && finalOriginalPrice > price;
const savingsAmount = hasSavings ? (finalOriginalPrice - price) : 0;

// CRITICAL FIX: Prevent division by zero
let savingsPercent = 0;
if (hasSavings && finalOriginalPrice > 0) {
  const rawPercent = (savingsAmount / finalOriginalPrice) * 100;
  savingsPercent = Math.round(rawPercent);
  
  // Additional safety: Clamp to valid range and minimum threshold
  savingsPercent = Math.max(0, Math.min(100, savingsPercent));
  
  // Don't show savings if percentage is too low (< 1%)
  if (savingsPercent < 1) {
    hasSavings = false;
  }
}

// ============ FIX 2: Ghost Click Prevention ============
// Location: Line 72 - Image container onClick

// REPLACE THIS:
<div className="food-item-img-container" onClick={() => setShowDetail(true)}>
  <img 
    src={url + "/images/" + image} 
    alt={name} 
    className={`food-item-image ${isOutOfStock ? 'grayscale' : ''}`} 
  />
  {/* ... */}
</div>

// WITH THIS:
<div 
  className="food-item-img-container" 
  onClick={(e) => {
    e.stopPropagation(); // Prevent parent Link navigation (if exists)
    e.preventDefault(); // Prevent default anchor behavior
    setShowDetail(true);
  }}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setShowDetail(true);
    }
  }}
  aria-label={`Xem chi tiết ${name}`}
>
  <img 
    src={url + "/images/" + image} 
    alt={name} 
    className={`food-item-image ${isOutOfStock ? 'grayscale' : ''}`}
    onClick={(e) => {
      e.stopPropagation(); // Additional safety layer
      e.preventDefault();
    }}
    draggable="false" // Prevent drag issues
  />
  {/* ... rest of content ... */}
</div>

// ============ FIX 3: Title Click Also Needs Propagation Stop ============
// Location: Line 96-99

// REPLACE THIS:
<Text strong style={{ fontSize: 18, lineHeight: 1.2, display: 'block', marginBottom: 4 }} 
      onClick={() => setShowDetail(true)} className="clickable-title">
  {name}
</Text>

// WITH THIS:
<Text 
  strong 
  style={{ fontSize: 18, lineHeight: 1.2, display: 'block', marginBottom: 4 }} 
  onClick={(e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDetail(true);
  }} 
  className="clickable-title"
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setShowDetail(true);
    }
  }}
>
  {name}
</Text>

// ============ FIX 4: Add Error Boundary for Price Display ============
// Location: Lines 128-135

// REPLACE THIS:
<div className="price-container">
    {hasSavings && (
        <Text delete type="secondary" style={{ fontSize: 13 }}>
            {finalOriginalPrice.toLocaleString('vi-VN')} đ
        </Text>
    )}
    <Text type="danger" strong style={{ fontSize: 20 }}>
        {price.toLocaleString('vi-VN')} đ
    </Text>
</div>

// WITH THIS:
<div className="price-container">
    {hasSavings && finalOriginalPrice > 0 && (
        <Text delete type="secondary" style={{ fontSize: 13 }}>
            {finalOriginalPrice.toLocaleString('vi-VN')} đ
        </Text>
    )}
    <Text type="danger" strong style={{ fontSize: 20 }}>
        {price && typeof price === 'number' && price >= 0 
          ? price.toLocaleString('vi-VN') + ' đ'
          : 'Liên hệ'
        }
    </Text>
</div>

// ============ FIX 5: Safety Check for Savings Badge Display ============
// Location: Lines 85-90

// REPLACE THIS:
{hasSavings && !isOutOfStock && (
   <div className="savings-badge">
      <span className="savings-percent">-{savingsPercent}%</span>
      <span className="savings-text">Tiết kiệm {savingsAmount.toLocaleString('vi-VN')}đ</span>
   </div>
)}

// WITH THIS:
{hasSavings && !isOutOfStock && savingsPercent >= 1 && savingsAmount > 0 && (
   <div className="savings-badge">
      <span className="savings-percent">-{savingsPercent}%</span>
      <span className="savings-text">Tiết kiệm {savingsAmount.toLocaleString('vi-VN')}đ</span>
   </div>
)}
