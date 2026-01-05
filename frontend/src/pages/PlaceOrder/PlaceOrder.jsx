import { useContext, useEffect, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const PlaceOrder = () => {
  const navigate = useNavigate();

  const {
    getTotalCartAmount,
    token,
    food_list,
    cartItems,
    url,
    orderType,
    tableId,
    branchId,
    tableName,
    clearDineInContext,
  } = useContext(StoreContext);

  const isDineIn = orderType === "Dine-in";

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const [paymentMethod, setPaymentMethod] = useState(isDineIn ? "Cash" : "Stripe");

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    let orderItems = [];
    food_list.forEach((item) => {
      if (cartItems[item._id] > 0) {
        let itemInfo = { ...item };
        itemInfo["quantity"] = cartItems[item._id];
        orderItems.push(itemInfo);
      }
    });

    let orderData = {
      items: orderItems,
      amount: getTotalCartAmount() + (isDineIn ? 0 : 15000),
      orderType: orderType,
      paymentMethod: paymentMethod,
    };

    if (isDineIn) {
      orderData.address = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      };
      orderData.tableId = tableId;
      orderData.branchId = branchId;
    } else {
      orderData.address = data;
    }

    let response = await axios.post(url + "/api/order/place", orderData, {
      headers: { token },
    });
    
    if (response.data.success) {
      if (response.data.paymentMethod === "Cash") {
        toast.success("Đặt hàng thành công! Vui lòng thanh toán tại quầy.");
        if (response.data.redirect_url) {
          window.location.replace(response.data.redirect_url);
        } else {
          navigate("/myorders");
        }
      } else {
        const { session_url } = response.data;
        window.location.replace(session_url);
      }
    } else {
      if (response.data.outOfStockItems) {
        toast.error(`Hết hàng: ${response.data.outOfStockItems.map(i => i.name).join(", ")}`);
      } else {
        toast.error(response.data.message || "Có lỗi xảy ra!");
      }
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("Vui lòng đăng nhập trước");
      navigate("/cart");
    } else if (getTotalCartAmount() === 0) {
      toast.error("Vui lòng thêm món vào giỏ hàng");
      navigate("/cart");
    }
  }, [token]);

  return (
    <form className="place-order" onSubmit={placeOrder}>
      <div className="place-order-left">
        {isDineIn && (
          <div className="dine-in-badge">
            <span className="badge">🍽️ Chế độ Tại Bàn</span>
            <p className="table-info">Bàn: {tableName || tableId}</p>
            <button
              type="button"
              className="clear-session"
              onClick={() => {
                clearDineInContext();
                toast.info("Đã chuyển sang chế độ Giao hàng");
              }}
            >
              Chuyển sang Giao hàng
            </button>
          </div>
        )}

        <p className="title">
          Các món đã chọn
        </p>

        <div className="place-order-items">
          {food_list.map((item, index) => {
            if (cartItems[item._id] > 0) {
              return (
                <div key={index} className="place-order-item">
                  <img src={url + "/images/" + item.image} alt="" />
                  <div className="place-order-item-info">
                    <p className="place-order-item-name">{item.name}</p>
                    <p className="place-order-item-qty">
                      {cartItems[item._id]} x {item.price.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <p className="place-order-item-price">
                    {(item.price * cartItems[item._id]).toLocaleString('vi-VN')} đ
                  </p>
                </div>
              )
            }
          })}
        </div>
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Tổng đơn hàng</h2>
          <div>
            <div className="cart-total-details">
              <p>Tạm tính</p>
              <p>{getTotalCartAmount().toLocaleString('vi-VN')} đ</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>{isDineIn ? "Phí phục vụ" : "Phí giao hàng"}</p>
              <p>{isDineIn ? "0 đ" : getTotalCartAmount() === 0 ? "0 đ" : "15.000 đ"}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Tổng cộng</b>
              <b>
                {getTotalCartAmount() === 0
                  ? "0 đ"
                  : (getTotalCartAmount() + (isDineIn ? 0 : 15000)).toLocaleString('vi-VN') + " đ"}
              </b>
            </div>
          </div>

          <div className="payment-method">
            <p className="payment-title">Phương thức thanh toán</p>
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === "Stripe" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Stripe"
                  checked={paymentMethod === "Stripe"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="payment-icon">💳</span>
                <span>Thẻ (Stripe)</span>
              </label>
              <label className={`payment-option ${paymentMethod === "Cash" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash"
                  checked={paymentMethod === "Cash"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="payment-icon">💵</span>
                <span>{isDineIn ? "Thanh toán tại quầy" : "Tiền mặt khi nhận"}</span>
              </label>
            </div>
          </div>

          <button type="submit">
            {paymentMethod === "Cash" 
              ? "ĐẶT HÀNG" 
              : "THANH TOÁN"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
