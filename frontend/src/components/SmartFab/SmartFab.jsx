import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/frontend_assets/assets';
import './SmartFab.css';

const SmartFab = () => {
  const { cartItems, getTotalCartAmount } = useContext(StoreContext);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  // Check if cart has items
  const hasItems = getTotalCartAmount() > 0;
  
  // Calculate total count (optional)
  const totalCount = Object.values(cartItems).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show FAB if scrolled down > 300px AND has items
      if (window.scrollY > 300 && hasItems) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [hasItems]);

  if (!hasItems) return null;

  return (
    <button 
        className={`smart-fab ${isVisible ? 'visible' : ''}`}
        onClick={() => navigate('/cart')}
        aria-label="View Cart"
    >
        <div className="fab-icon">
            <img src={assets.basket_icon} alt="" />
            <span className="fab-badge">{totalCount}</span>
        </div>
        <span className="fab-text">Xem giỏ hàng</span>
        <span className="fab-price">{getTotalCartAmount().toLocaleString()}đ</span>
    </button>
  );
};

export default SmartFab;
