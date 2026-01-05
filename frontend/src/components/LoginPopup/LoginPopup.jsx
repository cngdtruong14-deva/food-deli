import { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken } = useContext(StoreContext);
  const [data, setData] = useState({
    name: "",
    phone: "",
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(url + "/api/user/customer", data);
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);
        toast.success("Xin chào, " + data.name + "!");
        setShowLogin(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  return (
    <div className="login-popup">
      <form onSubmit={onSubmit} className="login-popup-container">
        <div className="login-popup-title">
          <h2>Đặt hàng</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt=""
          />
        </div>
        <div className="login-popup-inputs">
          <input
            name="name"
            onChange={onChangeHandler}
            value={data.name}
            type="text"
            placeholder="Tên của bạn"
            required
          />
          <input
            name="phone"
            onChange={onChangeHandler}
            value={data.phone}
            type="tel"
            placeholder="Số điện thoại"
            required
          />
        </div>
        <button type="submit">Tiếp tục</button>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật.</p>
        </div>
      </form>
    </div>
  );
};

export default LoginPopup;

