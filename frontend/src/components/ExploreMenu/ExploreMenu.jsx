import React, { useContext, useEffect, useRef, useState } from "react";
import "./ExploreMenu.css";
import { StoreContext } from "../../context/StoreContext";

const ExploreMenu = ({ category, setCategory }) => {
  const { categories } = useContext(StoreContext);
  const [isSticky, setIsSticky] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (listRef.current) {
        const rect = listRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="explore-menu" id="explore-menu">
      <div className="explore-menu-header">
        <h1>Khám phá thực đơn</h1>
        <p className="explore-menu-text">
          Lựa chọn từ thực đơn đa dạng với hơn 140 món ăn ngon. Sứ mệnh của chúng tôi 
          là mang đến cho bạn trải nghiệm ẩm thực tuyệt vời nhất.
        </p>
      </div>
      <div ref={listRef} className={`explore-menu-list ${isSticky ? 'sticky' : ''}`}>
        {/* All category option */}
        <div
          onClick={() => setCategory("All")}
          className={`explore-menu-list-item ${category === "All" ? "active" : ""}`}
        >
          <div className="category-icon">
            {getCategoryIcon("All")}
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
            className={`explore-menu-list-item ${category === cat.name ? "active" : ""}`}
          >
            <div className="category-icon">
              {getCategoryIcon(cat.name)}
            </div>
            <p>{cat.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Get SVG icon for category - Food-themed icons
function getCategoryIcon(name) {
  const iconSize = 24;
  const icons = {
    "All": (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
        <path d="M21 3v5h-5"></path>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
        <path d="M3 21v-5h5"></path>
      </svg>
    ),
    "Khai Vị & Gỏi": (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="8" rx="8" ry="3"></ellipse>
        <path d="M4 8v8c0 1.66 3.58 3 8 3s8-1.34 8-3V8"></path>
        <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"></path>
        <path d="M8 10h8"></path>
        <path d="M8 14h8"></path>
      </svg>
    ),
    "Combo": (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
        <path d="M7 7h.01"></path>
      </svg>
    ),
    "Hải Sản": (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M7 9l2 1"></path>
        <path d="M17 15l-2-1"></path>
        <path d="M7 15l2-1"></path>
        <path d="M17 9l-2 1"></path>
      </svg>
    ),
    "Thịt & Lợn Mán": (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
        <line x1="4" y1="10" x2="20" y2="10"></line>
        <line x1="4" y1="14" x2="20" y2="14"></line>
        <line x1="10" y1="4" x2="10" y2="20"></line>
        <line x1="14" y1="4" x2="14" y2="20"></line>
      </svg>
    ),
    "Gà & Ếch": (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
        <path d="M8 12c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"></path>
        <path d="M16 12c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"></path>
        <path d="M9 9h.01"></path>
        <path d="M15 9h.01"></path>
        <path d="M12 15v-1"></path>
      </svg>
    ),
    "Các Món Cá": (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 7v10"></path>
        <path d="M8 9l4-2 4 2"></path>
        <path d="M8 15l4 2 4-2"></path>
        <path d="M7 12h10"></path>
      </svg>
    ),
    "Lẩu": (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="8" rx="8" ry="4"></ellipse>
        <path d="M4 8v8c0 1.66 3.58 3 8 3s8-1.34 8-3V8"></path>
        <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"></path>
        <path d="M12 2v6"></path>
        <path d="M8 10h8"></path>
        <path d="M8 14h8"></path>
        <path d="M10 16h4"></path>
      </svg>
    ),
    "Rau & Đồ Xào": (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
        <path d="M8 8c0 1.1.9 2 2 2s2-.9 2-2"></path>
        <path d="M16 8c0 1.1.9 2 2 2s2-.9 2-2"></path>
        <path d="M8 16c0 1.1.9 2 2 2s2-.9 2-2"></path>
        <path d="M16 16c0 1.1.9 2 2 2s2-.9 2-2"></path>
        <path d="M12 4v16"></path>
        <path d="M4 12h16"></path>
        <path d="M8 4l8 16"></path>
        <path d="M16 4l-8 16"></path>
      </svg>
    ),
    "Đồ Nướng": (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v1"></path>
        <path d="M12 21v1"></path>
        <path d="M19.07 4.93l-.71.71"></path>
        <path d="M5.64 18.36l-.71.71"></path>
        <path d="M22 12h-1"></path>
        <path d="M3 12H2"></path>
        <path d="M19.07 19.07l-.71-.71"></path>
        <path d="M5.64 5.64l-.71-.71"></path>
        <circle cx="12" cy="12" r="5"></circle>
        <path d="M8 8l2 2 2-2"></path>
        <path d="M8 16l2-2 2 2"></path>
      </svg>
    ),
    "Đồ Uống": (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 2h14l-1 20H6L5 2z"></path>
        <path d="M5 2l1 4h12l1-4"></path>
        <path d="M9 10v6"></path>
        <path d="M15 10v6"></path>
        <path d="M12 10v6"></path>
      </svg>
    ),
  };
  return icons[name] || icons["All"];
}

export default ExploreMenu;
