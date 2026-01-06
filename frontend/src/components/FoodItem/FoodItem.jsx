import React, { useContext, useState } from "react";
import "./FoodItem.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";

import FoodDetailPopup from "../FoodDetailPopup/FoodDetailPopup";

const FoodItem = ({ id, name, price, description, image, stock }) => {
  const { cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);
  const [showDetail, setShowDetail] = useState(false);

  const isOutOfStock = (stock || 100) <= 0;
  const isMaxStock = (cartItems[id] || 0) >= (stock || 100);

  return (
    <>
      <div className={`food-item ${isOutOfStock ? 'out-of-stock' : ''}`}>
        <div className="food-item-img-container">
          <img 
            src={url + "/images/" + image} 
            alt="" 
            className={`food-item-image ${isOutOfStock ? 'grayscale' : ''}`} 
            onClick={() => setShowDetail(true)} 
            style={{ cursor: 'pointer' }} 
          />
          {isOutOfStock && <div className="out-of-stock-overlay">Hết hàng</div>}
        </div>
        <div className="food-item-info">
          <div className="food-item-name-rating">
            <p onClick={() => setShowDetail(true)} style={{cursor: 'pointer'}}>{name}</p>
            <img src={assets.rating_starts} alt="" />
          </div>
          
          <div className="food-item-actions">
            <p className="food-item-price">{price.toLocaleString('vi-VN')} đ</p>
            
            {!isOutOfStock && (
              !cartItems[id] ? (
                <button 
                  className="add-btn-new"
                  onClick={() => addToCart(id)}
                >
                  Thêm
                </button>
              ) : (
                <div className="food-item-counter-new">
                   <button onClick={() => removeFromCart(id)}>−</button>
                   <span>{cartItems[id]}</span>
                   <button onClick={() => !isMaxStock && addToCart(id)} disabled={isMaxStock}>+</button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      {showDetail && (
        <FoodDetailPopup 
          id={id}
          name={name} 
          description={description} 
          price={price} 
          image={image}
          stock={stock}
          onClose={() => setShowDetail(false)} 
        />
      )}
    </>
  );
};

export default FoodItem;
