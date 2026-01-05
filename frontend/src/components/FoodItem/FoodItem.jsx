import React, { useContext, useState } from "react";
import "./FoodItem.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";

import FoodDetailPopup from "../FoodDetailPopup/FoodDetailPopup";

const FoodItem = ({ id, name, price, description, image }) => {
  const {cartItems,addToCart,removeFromCart,url}=useContext(StoreContext); 
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <div className="food-item">
        <div className="food-item-img-container">
          <img src={url+"/images/"+image} alt="" className="food-item-image" onClick={() => setShowDetail(true)} style={{cursor: 'pointer'}} />
          {!cartItems[id] ? (
            <img
              className="add"
              onClick={() => addToCart(id)}
              src={assets.add_icon_white}
              alt=""
            />
          ) : (
            <div className="food-item-counter">
              <img onClick={()=>removeFromCart(id)} src={assets.remove_icon_red} alt="" />
              <p>{cartItems[id]}</p>
              <img onClick={()=>addToCart(id)} src={assets.add_icon_green} alt="" />
            </div>
          )}
        </div>
        <div className="food-item-info">
          <div className="food-item-name-rating">
            <p onClick={() => setShowDetail(true)} style={{cursor: 'pointer'}}>{name}</p>
            <img src={assets.rating_starts} alt="" />
          </div>
          <p className="food-item-price">{price.toLocaleString('vi-VN')} đ</p>
        </div>
      </div>
      {showDetail && (
        <FoodDetailPopup 
          name={name} 
          description={description} 
          price={price} 
          image={image} 
          onClose={() => setShowDetail(false)} 
        />
      )}
    </>
  );
};

export default FoodItem;
