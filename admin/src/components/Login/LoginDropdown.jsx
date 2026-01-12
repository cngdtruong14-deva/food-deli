import React, { useContext, useState } from "react";
import "./LoginDropdown.css";
import { toast } from "react-toastify";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { X, Mail, Lock } from "lucide-react";

const LoginDropdown = ({ url, onLoginSuccess, onClose }) => {
  const { setAdmin, setToken } = useContext(StoreContext);
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(url + "/api/user/login", data);
      if (response.data.success) {
        if (response.data.role === "admin") {
          setToken(response.data.token);
          setAdmin(true);
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("admin", true);
          toast.success("Đăng nhập thành công");
          onLoginSuccess();
        } else {
          toast.error("Bạn không phải là admin");
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Đăng nhập thất bại: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-dropdown-container">
      <div className="login-dropdown-header">
        <h3 className="login-dropdown-title">Đăng nhập</h3>
        <button className="login-dropdown-close" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={onLogin} className="login-dropdown-form">
        <div className="login-input-group">
          <label htmlFor="email" className="login-label">
            <Mail size={18} className="input-icon" />
            Email
          </label>
          <input
            id="email"
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="admin@demo.com"
            required
            className="login-input"
            autoComplete="email"
          />
        </div>

        <div className="login-input-group">
          <label htmlFor="password" className="login-label">
            <Lock size={18} className="input-icon" />
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Nhập mật khẩu"
            required
            className="login-input"
            autoComplete="current-password"
          />
        </div>

        <button 
          type="submit" 
          className="login-submit-btn"
          disabled={loading}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
};

export default LoginDropdown;
