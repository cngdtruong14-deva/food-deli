import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { assets } from "../../assets/frontend_assets/assets";
import "./CartFAB.css";

const CartFAB = () => {
  const { getTotalCartAmount, cartItems } = useContext(StoreContext);
  const totalAmount = getTotalCartAmount();
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Calculate total items count
  const getTotalItems = () => {
    return Object.values(cartItems).reduce((sum, quantity) => sum + quantity, 0);
  };
  
  const totalItems = getTotalItems();
  const formattedAmount = totalAmount > 0 ? totalAmount.toLocaleString('vi-VN') : '0';

  return (
    <Link 
      to="/cart" 
      className="cart-fab"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="cart-fab-icon">
        <img src={assets.basket_icon} alt="Cart" />
        {totalItems > 0 && (
          <span className="cart-fab-badge">{totalItems > 99 ? '99+' : totalItems}</span>
        )}
      </div>
      {showTooltip && totalAmount > 0 && (
        <div className="cart-fab-tooltip">
          <div className="cart-fab-tooltip-content">
            <p className="cart-fab-tooltip-label">Tổng tiền</p>
            <p className="cart-fab-tooltip-amount">{formattedAmount} đ</p>
          </div>
        </div>
      )}
    </Link>
  );
};

export default CartFAB;

