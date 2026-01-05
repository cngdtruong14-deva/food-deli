import React, { useContext, useEffect, useState } from "react";
import { StoreContext } from "../../context/StoreContext";
import "./Header.css";

const Header = () => {
  const { food_list, url } = useContext(StoreContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Filter for "Combo" or get top items if no Combos
  const [displayItems, setDisplayItems] = useState([]);

  useEffect(() => {
    if (food_list.length > 0) {
      const combos = food_list.filter(item => item.category === "Combo" || item.category === "Khai Vị & Gỏi"); // Broaden search to ensure items
      // If filtering yields too few results, just take first 5 of food_list
      const items = combos.length > 0 ? combos.slice(0, 5) : food_list.slice(0, 5);
      setDisplayItems(items);
    }
  }, [food_list]);

  useEffect(() => {
    if (displayItems.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }, 5000); // 5 seconds per slide
    return () => clearInterval(interval);
  }, [displayItems]);

  const currentItem = displayItems.length > 0 ? displayItems[currentIndex] : null;

  return (
    <div className="header">
      {displayItems.map((item, index) => (
        <div 
          key={item._id} 
          className={`header-slide ${index === currentIndex ? "active" : ""}`}
          style={{
            backgroundImage: `url(${url}/images/${item.image})`
          }}
        />
      ))}
      {/* Fallback Static Image if no items */}
      {displayItems.length === 0 && <div className="header-slide active static-bg" />}

      <div className="header-contents">
        {currentItem ? (
          <>
            <h2 key={currentItem._id + "-title"} className="slide-title">{currentItem.name}</h2>
            <p key={currentItem._id + "-desc"} className="slide-desc">{currentItem.description}</p>
            <button className="btn-primary" onClick={() => window.location.href='#explore-menu'}>
              Đặt Ngay
            </button>
            <div className="slider-dots">
              {displayItems.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`dot ${idx === currentIndex ? "active" : ""}`}
                  onClick={() => setCurrentIndex(idx)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <h2>Đặt món ăn yêu thích của bạn tại đây</h2>
            <p>
              Khám phá thực đơn đa dạng với những món ăn ngon được chế biến từ 
              nguyên liệu tươi ngon nhất. Sứ mệnh của chúng tôi là mang đến cho bạn 
              những trải nghiệm ẩm thực tuyệt vời nhất.
            </p>
            <button className="btn-primary">Xem Thực Đơn</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
