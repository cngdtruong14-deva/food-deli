import React, { useContext } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import {useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate=useNavigate();
  const {token, admin, setAdmin, setToken } = useContext(StoreContext);
  const logout=()=>{
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    setToken("");
    setAdmin(false);
    toast.success("Đã đăng xuất thành công")
    navigate("/");
  }
  return (
    <div className="navbar">
      <div className="logo">Freedom.</div>
      {token && admin ? (
        <p className="login-conditon" onClick={logout}>Đăng xuất</p>
      ) : (
        <p className="login-conditon" onClick={()=>navigate("/")}>Đăng nhập</p>
      )}
      <img className="profile" src={assets.profile_image} alt="" />
    </div>
  );
};

export default Navbar;
