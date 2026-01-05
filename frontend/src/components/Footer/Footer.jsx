import React from "react";
import "./Footer.css";
import { assets } from "../../assets/frontend_assets/assets";

const Footer = () => {
  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <div className="logo footer-logo">Freedom.</div>
          <p>
            Chúng tôi cam kết mang đến cho bạn những trải nghiệm ẩm thực tuyệt vời 
            nhất với thực đơn đa dạng và chất lượng phục vụ hàng đầu. Đặt hàng 
            ngay để thưởng thức những món ăn ngon!
          </p>
          <div className="footer-social-icons">
            <img src={assets.facebook_icon} alt="" />
            <img src={assets.twitter_icon} alt="" />
            <img src={assets.linkedin_icon} alt="" />
          </div>
        </div>
        <div className="footer-content-center">
          <h2>Về chúng tôi</h2>
          <ul>
            <li>Trang chủ</li>
            <li>Giới thiệu</li>
            <li>Giao hàng</li>
            <li>Chính sách bảo mật</li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>Liên hệ</h2>
          <ul>
            <li>+84 123 456 789</li>
            <li>contact@nhahang.vn</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        Bản quyền 2024 @ Freedom - Đã đăng ký bản quyền.
      </p>
    </div>
  );
};

export default Footer;
