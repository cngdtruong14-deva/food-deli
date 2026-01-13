import React, { useContext, useState } from "react";
import "./FoodItem.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";
import FoodDetailPopup from "../FoodDetailPopup/FoodDetailPopup";
import { Badge, Button, Tag, Typography, Rate } from "antd";
import { PlusOutlined, FireOutlined, EyeOutlined } from "@ant-design/icons";

const { Text } = Typography;

const FoodItem = ({ id, name, price, description, image, stock, originalPrice, soldCount = 0, averageRating = 0 }) => {
  const { cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);
  const [showDetail, setShowDetail] = useState(false);

  // Helper for Sold Count
  const formatNumber = (num) => {
      if (num >= 1000) {
          return (num / 1000).toFixed(1) + "k";
      }
      return num;
  };

  // --- LOGIC: Badge ---
  const isBestSeller = soldCount > 100; // Threshold can be adjusted
  const isMustTry = name.toLowerCase().includes("đặc biệt") || (averageRating >= 4.8 && soldCount > 50);

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
  
  // --- LOGIC: Quantity ---
  const totalQuantity = Object.keys(cartItems).reduce((sum, key) => {
      if (key.split('_note_')[0] === id) {
          return sum + cartItems[key];
      }
      return sum;
  }, 0);
  const isOutOfStock = (stock || 100) <= 0;
  const isMaxStock = totalQuantity >= (stock || 100);

  const handleRemove = () => {
       const firstVariant = Object.keys(cartItems).find(k => k.split('_note_')[0] === id);
       if (firstVariant) removeFromCart(firstVariant);
  };

  // --- RENDER HELPERS ---
  const renderRibbonText = () => {
    if (isBestSeller) return "Bán chạy nhất";
    if (isMustTry) return "Nên thử";
    return null;
  };

  return (
    <>
      <Badge.Ribbon 
        text={renderRibbonText()} 
        color={isBestSeller ? "red" : "blue"} 
        style={{ display: renderRibbonText() ? 'block' : 'none', right: 10, top: 10 }}
      >
        <div className={`food-item ${isOutOfStock ? 'out-of-stock' : ''} ${hasSavings ? 'has-savings' : ''}`}>
          
          {/* IMAGE SECTION */}
          <div className="food-item-img-container" onClick={() => setShowDetail(true)}>
            <img 
              src={url + "/images/" + image} 
              alt={name} 
              className={`food-item-image ${isOutOfStock ? 'grayscale' : ''}`}
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = assets.rating_starts // Fallback to a safe asset or placeholder
                    ? "https://placehold.co/600x400?text=No+Image" 
                    : "https://placehold.co/600x400?text=No+Image";
              }}
            />
            {isOutOfStock && <div className="out-of-stock-overlay">Hết hàng</div>}
            
            {/* Quick View Overlay Icon */}
            <div className="quick-view-icon">
                <EyeOutlined style={{ fontSize: 20, color: '#fff' }} />
            </div>

            {hasSavings && !isOutOfStock && (
               <div className="savings-badge">
                  <span className="savings-percent">-{savingsPercent}%</span>
                  <span className="savings-text">Tiết kiệm {savingsAmount.toLocaleString('vi-VN')}đ</span>
               </div>
            )}
          </div>

          {/* INFO SECTION */}
          <div className="food-item-info">
            <div className="food-item-header">
                <Text strong style={{ fontSize: 18, lineHeight: 1.2, display: 'block', marginBottom: 4 }} 
                      onClick={() => setShowDetail(true)} className="clickable-title">
                    {name}
                </Text>
                
                {/* Social Proof */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    {averageRating > 0 ? (
                        <Rate disabled allowHalf value={averageRating} style={{ fontSize: 12 }} />
                    ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>Chưa có đánh giá</Text>
                    )}
                    <Text type="secondary" style={{ fontSize: 12 }}>({formatNumber(soldCount)} đã bán)</Text>
                </div>
            </div>
            
            <p className="food-item-desc" style={{ fontSize: 13, color: '#666' }}>
                {description}
            </p>

            {/* Value Proposition */}
            {hasSavings && isCombo && (
                <div style={{ marginTop: 4, marginBottom: 4 }}>
                    <Tag color="green" icon={<FireOutlined />}>
                        Rẻ hơn {savingsPercent}% so với gọi lẻ
                    </Tag>
                </div>
            )}

            {/* PRICE & ACTION */}
            <div className="food-item-actions" style={{ marginTop: 'auto', paddingTop: 12 }}>
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
              
              {!isOutOfStock && (
                totalQuantity === 0 ? (
                  <Button 
                    type="primary" 
                    shape="round" 
                    size="large"
                    icon={<PlusOutlined />}
                    style={{ 
                        background: '#fa541c', // Deep Orange
                        borderColor: '#fa541c',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 10px rgba(250, 84, 28, 0.3)'
                    }}
                    onClick={() => addToCart(id)}
                  >
                    Thêm
                  </Button>
                ) : (
                  <div className="food-item-counter-new">
                     <button onClick={handleRemove}>−</button>
                     <span>{totalQuantity}</span>
                     <button onClick={() => !isMaxStock && addToCart(id)} disabled={isMaxStock}>+</button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </Badge.Ribbon>
      
      {showDetail && (
        <FoodDetailPopup 
          id={id}
          name={name} 
          description={description} 
          price={price} 
          image={image}
          stock={stock}
          originalPrice={finalOriginalPrice} // Pass consistent original price
          onClose={() => setShowDetail(false)} 
        />
      )}
    </>
  );
};

export default FoodItem;
