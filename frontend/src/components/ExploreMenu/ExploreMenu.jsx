import React, { useContext, useEffect, useRef, useState } from "react";
import "./ExploreMenu.css";
import { StoreContext } from "../../context/StoreContext";

const ExploreMenu = ({ category, setCategory }) => {
  const { categories } = useContext(StoreContext);
  const [isSticky, setIsSticky] = useState(false);
  const wrapperRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Smart Sticky Logic
  useEffect(() => {
    const handleScroll = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        // Sticky when it hits top (considering navbar height ~80px)
        setIsSticky(rect.top <= 80); 
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="explore-menu" id="explore-menu">
      <div className="explore-menu-header animate-slide-up">
        <h1>Khám phá thực đơn</h1>
        <p className="explore-menu-text">
          Lựa chọn từ thực đơn đa dạng với hơn 140 món ăn ngon. Sứ mệnh của chúng tôi 
          là mang đến cho bạn trải nghiệm ẩm thực tuyệt vời nhất.
        </p>
      </div>

      <div ref={wrapperRef} className={`explore-menu-sticky-wrapper ${isSticky ? 'is-sticky' : ''}`}>
           <div className="sticky-container">
               <button className="nav-btn prev" onClick={scrollLeft}>&#8249;</button>
               
               <div ref={scrollContainerRef} className="categories-scroll">
                   <div 
                      className={`category-pill ${category === "All" ? "active" : ""}`}
                      onClick={() => setCategory("All")}
                   >
                       TẤT CẢ
                   </div>
                   {categories.map((cat, index) => (
                       <div 
                          key={index}
                          className={`category-pill ${category === cat.name ? "active" : ""}`}
                          onClick={() => setCategory(prev => prev === cat.name ? "All" : cat.name)}
                       >
                           {cat.name}
                       </div>
                   ))}
               </div>

               <button className="nav-btn next" onClick={scrollRight}>&#8250;</button>
           </div>
      </div>
    </div>
  );
};

export default ExploreMenu;
