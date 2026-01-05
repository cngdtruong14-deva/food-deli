import React, { useContext } from "react";
import "./ExploreMenu.css";
import { StoreContext } from "../../context/StoreContext";

const ExploreMenu = ({ category, setCategory }) => {
  const { categories } = useContext(StoreContext);

  return (
    <div className="explore-menu" id="explore-menu">
      <h1>Khám phá thực đơn</h1>
      <p className="explore-menu-text">
        Lựa chọn từ thực đơn đa dạng với hơn 140 món ăn ngon. Sứ mệnh của chúng tôi 
        là mang đến cho bạn trải nghiệm ẩm thực tuyệt vời nhất.
      </p>
      <div className="explore-menu-list">
        {/* All category option */}
        <div
          onClick={() => setCategory("All")}
          className="explore-menu-list-item"
        >
          <div className={`category-icon ${category === "All" ? "active" : ""}`}>
            🍽️
          </div>
          <p>Tất cả</p>
        </div>
        
        {/* Dynamic categories from database */}
        {categories.map((cat) => (
          <div
            onClick={() =>
              setCategory((prev) => (prev === cat.name ? "All" : cat.name))
            }
            key={cat._id}
            className="explore-menu-list-item"
          >
            <div className={`category-icon ${category === cat.name ? "active" : ""}`}>
              {getCategoryIcon(cat.name)}
            </div>
            <p>{cat.name}</p>
          </div>
        ))}
      </div>
      <hr />
    </div>
  );
};

// Get icon for category
function getCategoryIcon(name) {
  const icons = {
    "Khai Vị & Gỏi": "🥗",
    "Combo": "🎁",
    "Hải Sản": "🦐",
    "Thịt & Lợn Mán": "🥩",
    "Gà & Ếch": "🍗",
    "Các Món Cá": "🐟",
    "Lẩu": "🍲",
    "Rau & Đồ Xào": "🥬",
    "Đồ Nướng": "🔥",
    "Đồ Uống": "🍺",
  };
  return icons[name] || "🍽️";
}

export default ExploreMenu;
