import React, { useContext, useEffect } from "react";
import "./FoodDetailPopup.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";

import ReviewSection from "../Review/ReviewSection";

const FoodDetailPopup = ({ name, description, price, image, onClose, id, stock }) => {
  const { url, cartItems, addToCart, removeFromCart } = useContext(StoreContext);
  
  // Note State
  const [note, setNote] = React.useState("");
  
  const currentKey = note ? `${id}_note_${note}` : id;
  const currentQuantity = cartItems[currentKey] || 0;
  
  const isOutOfStock = (stock || 100) <= 0;
  
  // Calculate total stuck used across all variants
  const totalStockUsed = Object.keys(cartItems).reduce((sum, k) => k.split('_note_')[0] === id ? sum + cartItems[k] : sum, 0);
  const isMaxStock = totalStockUsed >= (stock || 100);

  useEffect(() => {
    // Lock body scroll when popup is open
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      // Unlock body scroll when popup closes
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const handleAddToCart = () => {
      addToCart(id, note);
      setNote(""); // Reset note
      // optionally onClose()
  };

  return (
    <div className="food-detail-popup" onClick={onClose}>
      <div className="food-detail-popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="food-detail-popup-title">
          <button 
            className="food-detail-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <img src={assets.cross_icon} alt="Close" />
          </button>
          <h2>{name}</h2>
          <div className="food-detail-title-spacer"></div>
        </div>
        <div className="food-detail-content">
          <img src={url + "/images/" + image} alt={name} className="food-detail-image" />
          
          <div className="food-detail-info">
              <div className="food-detail-info-header">MÔ TẢ MÓN ĂN</div>
              <div className="food-detail-desc-content">
                  {description ? description.split('\n').map((line, index) => {
                      const trimmed = line.trim();
                      if (!trimmed) return <br key={index} />;
                      
                      const isList = ['-', '•', '+'].some(char => trimmed.startsWith(char));
                      
                      if (isList) {
                          return (
                              <div key={index} className="desc-list-item">
                                  <span className="desc-bullet"></span>
                                  <span>{trimmed.substring(1).trim()}</span>
                                </div>
                          );
                      }
                      return <p key={index} className="desc-text">{trimmed}</p>;
                  }) : <p className="desc-text">Chưa có mô tả</p>}
              </div>
          </div>

          {/* NOTE INPUT SECTION */}
          <div className="food-detail-note-section">
              <label>Ghi chú món ăn</label>
              <textarea 
                  className="food-detail-note-input"
                  placeholder="VD: Không hành, ít cay..."
                  maxLength={200}
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
              />
              <span className="note-char-count">{note.length}/200</span>
          </div>

          <p className="food-detail-price">{price.toLocaleString('vi-VN')} đ</p>
          
          {!isOutOfStock && (
            <div className="food-detail-quantity-selector">
              {currentQuantity === 0 && !note ? ( 
                 <button
                  className="food-detail-add-btn"
                  onClick={handleAddToCart}
                >
                  Thêm vào giỏ
                </button>
              ) : (
                <div className="food-detail-quantity-controls">
                  <button
                    className="quantity-btn quantity-btn-minus"
                    onClick={() => removeFromCart(currentKey)} 
                    aria-label="Giảm số lượng"
                  >
                    −
                  </button>
                  <span className="quantity-value">{currentQuantity}</span>
                  <button
                    className="quantity-btn quantity-btn-plus"
                    onClick={() => addToCart(id, note)}
                    disabled={isMaxStock}
                    aria-label="Tăng số lượng"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          )}
          
          {isOutOfStock && (
            <div className="food-detail-out-of-stock">
              <p>Hết hàng</p>
            </div>
          )}

          {/* PRODUCT REVIEW SECTION */}
          <ReviewSection foodId={id} />

        </div>
      </div>
    </div>
  );
};

export default FoodDetailPopup;
