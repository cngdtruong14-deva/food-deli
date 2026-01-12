import React, { useContext, useState, useRef, useEffect } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import LoginDropdown from "../Login/LoginDropdown";
import { LogOut, User, ChevronDown } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const { token, admin, setAdmin, setToken } = useContext(StoreContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    setToken("");
    setAdmin(false);
    toast.success("Đã đăng xuất thành công");
    setShowDropdown(false);
    navigate("/dashboard");
  };

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <div className="logo">Freedom.</div>
      </div>
      
      <div className="navbar-right">
        <div className="profile-section" ref={profileRef}>
          {token && admin ? (
            <>
              <div className="user-info" onClick={handleProfileClick}>
                <span className="user-name">Admin</span>
                <img 
                  className="profile" 
                  src={assets.profile_image} 
                  alt="Profile" 
                  onClick={handleProfileClick}
                />
                <ChevronDown 
                  size={16} 
                  className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}
                />
              </div>
              {showDropdown && (
                <div className="profile-dropdown" ref={dropdownRef}>
                  <div className="dropdown-header">
                    <img 
                      className="dropdown-profile-img" 
                      src={assets.profile_image} 
                      alt="Profile" 
                    />
                    <div className="dropdown-user-info">
                      <div className="dropdown-user-name">Admin</div>
                      <div className="dropdown-user-email">admin@demo.com</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={logout}>
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <img 
                className="profile" 
                src={assets.profile_image} 
                alt="Profile" 
                onClick={handleProfileClick}
              />
              {showDropdown && (
                <div className="profile-dropdown login-dropdown" ref={dropdownRef}>
                  <LoginDropdown 
                    url={import.meta.env.VITE_API_URL || "http://localhost:4000"}
                    onLoginSuccess={() => {
                      setShowDropdown(false);
                      navigate("/dashboard");
                    }}
                    onClose={() => setShowDropdown(false)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
