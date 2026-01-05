import React, { useContext } from "react";
import "./FoodDetailPopup.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";

const FoodDetailPopup = ({ name, description, price, image, onClose }) => {
  const { url } = useContext(StoreContext);

  return (
    <div className="food-detail-popup" onClick={onClose}>
      <div className="food-detail-popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="food-detail-popup-title">
          <h2>{name}</h2>
          <img onClick={onClose} src={assets.cross_icon} alt="Close" />
        </div>
        <div className="food-detail-content">
          <img src={url + "/images/" + image} alt={name} className="food-detail-image" />
          <p className="food-detail-desc">{description}</p>
          <p className="food-detail-price">{price.toLocaleString('vi-VN')} đ</p>
        </div>
      </div>
    </div>
  );
};

export default FoodDetailPopup;
