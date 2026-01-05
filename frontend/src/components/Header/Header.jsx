import React from "react";
import "./Header.css";

const Header = () => {
  return (
    <div className="header">
      <div className="header-contents">
        <h2>Đặt món ăn yêu thích của bạn tại đây</h2>
        <p>
          Khám phá thực đơn đa dạng với những món ăn ngon được chế biến từ 
          nguyên liệu tươi ngon nhất. Sứ mệnh của chúng tôi là mang đến cho bạn 
          những trải nghiệm ẩm thực tuyệt vời nhất.
        </p>
        <button>Xem Thực Đơn</button>
      </div>
    </div>
  );
};

export default Header;
