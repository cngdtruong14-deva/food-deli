import React, { useContext, useState, useEffect } from "react";
import "./Navbar.css";
import { assets } from "../../assets/frontend_assets/assets";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const { getTotalCartAmount, token, setToken, searchQuery, setSearchQuery, cartItems } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Count total items in cart
  const cartItemCount = Object.values(cartItems || {}).reduce((sum, qty) => sum + qty, 0);

  useEffect(() => {
    if (location.pathname === "/") {
      if (location.hash === "#explore-menu") setMenu("menu");
      else if (location.hash === "#app-download") setMenu("mobile-app");
      else if (location.hash === "#footer") setMenu("contact-us");
      else setMenu("home");
    } else if (location.pathname === "/branches") {
      setMenu("branches");
    } else if (location.pathname === "/cart") {
      setMenu("cart");
    } else if (location.pathname === "/myorders") {
      setMenu("profile");
    } else {
      setMenu("");
    }
  }, [location]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    toast.success("Đăng xuất thành công");
    navigate("/");
  };

  return (
    <>
      <div className="navbar">
        <div className="navbar-left">
          <Link to='/' className="logo-container">
            <div className="logo-text">Freedom.</div>
          </Link>
          <div className="navbar-hotline">
            <div className="hotline-label">HOTLINE</div>
            <div className="hotline-number">*1986</div>
          </div>
        </div>
        
        {/* Desktop Menu - Hidden on Mobile */}
        <ul className="navbar-menu desktop-only">
          <Link
            to="/"
            onClick={() => setMenu("home")}
            className={menu === "home" ? "active" : ""}
          >
            THỰC ĐƠN
          </Link>
          <Link
            to="/branches"
            onClick={() => setMenu("branches")}
            className={menu === "branches" ? "active" : ""}
          >
            CƠ SỞ
          </Link>
          <a
            href="#app-download"
            onClick={() => setMenu("mobile-app")}
            className={menu === "mobile-app" ? "active" : ""}
          >
            ƯU ĐÃI
          </a>
          <a
            href="#footer"
            onClick={() => setMenu("contact-us")}
            className={menu === "contact-us" ? "active" : ""}
          >
            LIÊN HỆ
          </a>
        </ul>

        <div className="navbar-right">
          {showSearchInput ? (
            <div className="navbar-search-input-container">
              <input 
                type="text" 
                placeholder="Tìm món ăn..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                onBlur={() => !searchQuery && setShowSearchInput(false)}
              />
              <img src={assets.search_icon} alt="" onClick={() => setShowSearchInput(false)} />
            </div>
          ) : (
            <img src={assets.search_icon} alt="" onClick={() => setShowSearchInput(true)} className="desktop-only" />
          )}
          
          {/* Desktop Cart Icon */}
          <div className="navbar-search-icon desktop-only">
            <Link to="/cart" className={location.pathname === "/cart" ? "active" : ""}>
              <img src={assets.basket_icon} alt="" />
            </Link>
            <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
          </div>
          
          {/* Desktop Profile/Login */}
          <div className="desktop-only">
            {!token ? (
              <button className="navbar-book-btn" onClick={() => setShowLogin(true)}>ĐẶT BÀN</button>
            ) : (
              <div className="navbar-profile">
                <img src={assets.profile_icon} alt="" />
                <ul className="nav-profile-dropdown">
                  <li onClick={() => navigate("/myorders")}>
                    <img src={assets.bag_icon} alt="" />
                    <p>Đơn Hàng</p>
                  </li>
                  <hr />
                  <li onClick={logout}>
                    <img src={assets.logout_icon} alt="" />
                    <p>Đăng Xuất</p>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== MOBILE BOTTOM NAVIGATION BAR ========== */}
      <nav className="mobile-bottom-nav">
        <Link 
          to="/" 
          className={`bottom-nav-item ${menu === "home" ? "active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Trang chủ</span>
        </Link>
        
        <Link 
          to="/#explore-menu" 
          className={`bottom-nav-item ${menu === "menu" ? "active" : ""}`}
          onClick={() => setMenu("menu")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <span>Thực đơn</span>
        </Link>
        
        <Link 
          to="/cart" 
          className={`bottom-nav-item cart-nav-item ${menu === "cart" ? "active" : ""}`}
        >
          <div className="cart-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount > 99 ? "99+" : cartItemCount}</span>
            )}
          </div>
          <span>Giỏ hàng</span>
        </Link>
        
        <div 
          className={`bottom-nav-item ${menu === "profile" ? "active" : ""}`}
          onClick={() => {
            if (token) {
              navigate("/myorders");
            } else {
              setShowLogin(true);
            }
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>{token ? "Tài khoản" : "Đăng nhập"}</span>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
