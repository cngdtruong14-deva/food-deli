import React, { useContext, useState, useEffect } from "react";
import "./Navbar.css";
import { assets } from "../../assets/frontend_assets/assets";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getTotalCartAmount, token, setToken, searchQuery, setSearchQuery } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      if (location.hash === "#explore-menu") setMenu("menu");
      else if (location.hash === "#app-download") setMenu("mobile-app");
      else if (location.hash === "#footer") setMenu("contact-us");
      else setMenu("home");
    } else if (location.pathname === "/branches") {
      setMenu("branches");
    } else {
      setMenu(""); // De-activate text menu items for other pages like /cart
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
      <button 
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {mobileMenuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </>
          )}
        </svg>
      </button>
        <ul className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link
            to="/"
            onClick={() => {
              setMenu("home");
              setMobileMenuOpen(false);
            }}
            className={menu === "home" ? "active" : ""}
          >
            THỰC ĐƠN
          </Link>
          <Link
            to="/branches"
            onClick={() => {
              setMenu("branches");
              setMobileMenuOpen(false);
            }}
            className={menu === "branches" ? "active" : ""}
          >
            CƠ SỞ
          </Link>
          <a
            href="#app-download"
            onClick={() => {
              setMenu("mobile-app");
              setMobileMenuOpen(false);
            }}
            className={menu === "mobile-app" ? "active" : ""}
          >
            ƯU ĐÃI
          </a>
          <a
            href="#footer"
            onClick={() => {
              setMenu("contact-us");
              setMobileMenuOpen(false);
            }}
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
          <img src={assets.search_icon} alt="" onClick={() => setShowSearchInput(true)} />
        )}
        <div className="navbar-search-icon">
          <Link to="/cart" className={location.pathname === "/cart" ? "active" : ""}>
            <img src={assets.basket_icon} alt="" />
          </Link>
          <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
        </div>
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
    </>
  );
};

export default Navbar;
