import { useContext, useEffect, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

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
    branches,
  } = useContext(StoreContext);

  const [selectedBranch, setSelectedBranch] = useState("");
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  // Determine if context implies dine-in (scanned QR)
  const isContextDineIn = orderType === "Dine-in";
  
  // Local state for toggle: 'delivery' or 'dine-in'
  // If QR scanned, default to 'dine-in', otherwise 'delivery'
  const [orderMethod, setOrderMethod] = useState(isContextDineIn ? "dine-in" : "delivery");

  // Sync if context changes (e.g. late scan)
  useEffect(() => {
    if (isContextDineIn) {
        setOrderMethod("dine-in");
    }
  }, [isContextDineIn]);

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

  const [paymentMethod, setPaymentMethod] = useState("Stripe");

  // Update payment method default when order method changes
  useEffect(() => {
      setPaymentMethod(orderMethod === "dine-in" ? "Cash" : "Stripe");
  }, [orderMethod]);

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

    // Check if effective order type is Dine-in
    const isOrdersDineIn = orderMethod === "dine-in";

    let orderData = {
      items: orderItems,
      amount: getTotalCartAmount() + (isOrdersDineIn ? 0 : 15000),
      orderType: isOrdersDineIn ? "Dine-in" : "Delivery",
      paymentMethod: paymentMethod,
    };

    if (isOrdersDineIn) {
      // If Dine-in, address fields might be empty or partial
      orderData.address = {
        firstName: "Khách",
        lastName: "Tại quán",
        phone: data.phone || "Tại quán", // Use entered phone or default
        // We can send empty or dummy data for required fields if backend enforces them
        street: "Tại quán", 
        city: "Tại quán" 
      };
      
      // Use context branch/table if available, else selected branch
      orderData.branchId = branchId || selectedBranch;
      orderData.tableId = tableId || selectedTable;

      if (!orderData.branchId) {
          toast.error("Vui lòng chọn chi nhánh phục vụ");
          return;
      }
      if (!orderData.tableId) {
          toast.error("Vui lòng chọn bàn");
          return;
      }

    } else {
      orderData.address = data;
      orderData.branchId = selectedBranch;
    }

    let response = await axios.post(url + "/api/order/place", orderData, {
      headers: { token },
    });
    
    if (response.data.success) {
      if (paymentMethod === "Cash") {
        toast.success(isOrdersDineIn ? "Đặt món thành công! Vui lòng đợi phục vụ." : "Đặt hàng thành công! Vui lòng thanh toán khi nhận hàng.");
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

  // Fetch tables and setup socket
  useEffect(() => {
    if (orderMethod === "dine-in" && !isContextDineIn && selectedBranch) {
      const fetchTables = async () => {
        try {
          const response = await axios.get(`${url}/api/table/list/${selectedBranch}`);
          if (response.data.success) {
            setTables(response.data.data);
          }
        } catch (error) {
          console.error("Error fetching tables:", error);
        }
      };

      fetchTables();

      // Socket connection for real-time updates
      const socket = io(url);
      
      socket.on("table:status_updated", ({ tableId, branchId, status }) => {
        if (branchId === selectedBranch) {
          setTables((prevTables) => 
            prevTables.map(table => 
              table._id === tableId ? { ...table, status } : table
            )
          );
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [orderMethod, isContextDineIn, selectedBranch, url]);

  return (
    <div className="place-order">
      <div className="place-order-container">
        <div className="place-order-header">
          <div className="place-order-breadcrumb">
            <a href="/cart">Giỏ hàng</a>
            <span>/</span>
            <span>Thanh toán</span>
          </div>
          <h1 className="place-order-main-title">Thông tin đặt hàng</h1>
        </div>

        <form className="place-order-grid" onSubmit={placeOrder}>
          <div className="place-order-left">
            {/* Delivery Mode Toggle Card */}
            <div className="place-order-card">
              <div className="delivery-mode-toggle">
                <div 
                  className={`delivery-mode-option ${orderMethod === 'delivery' ? 'active' : ''}`}
                  onClick={() => setOrderMethod('delivery')}
                >
                  🚚 Giao hàng
                </div>
                <div 
                  className={`delivery-mode-option ${orderMethod === 'dine-in' ? 'active' : ''}`}
                  onClick={() => setOrderMethod('dine-in')}
                >
                  🍽️ Ăn tại quán
                </div>
              </div>

              {isContextDineIn && (
                <div className="dine-in-badge">
                  <span className="badge">Đã quét mã QR</span>
                  <p className="table-info">Bàn: {tableName || tableId}</p>
                  <button
                    type="button"
                    className="clear-session"
                    onClick={() => {
                      clearDineInContext();
                      setOrderMethod("delivery");
                      toast.info("Đã thoát chế độ bàn");
                    }}
                  >
                    Thoát
                  </button>
                </div>
              )}
            </div>

            {/* Delivery Information Card */}
            {orderMethod === 'delivery' ? (
              <div className="place-order-card">
                <h3 className="place-order-card-title">Thông tin giao hàng</h3>
                <div className="multi-fields">
                  <input required name='firstName' onChange={onChangeHandler} value={data.firstName} type="text" placeholder='Họ' />
                  <input required name='lastName' onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Tên' />
                </div>
                <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email' />
                <input required name='street' onChange={onChangeHandler} value={data.street} type="text" placeholder='Địa chỉ (Số nhà, Tên đường)' />
                <div className="multi-fields">
                  <input required name='city' onChange={onChangeHandler} value={data.city} type="text" placeholder='Thành phố' />
                  <input required name='state' onChange={onChangeHandler} value={data.state} type="text" placeholder='Quận/Huyện' />
                </div>
                <div className="multi-fields">
                  <input required name='zipcode' onChange={onChangeHandler} value={data.zipcode} type="text" placeholder='Mã bưu điện' />
                  <input required name='country' onChange={onChangeHandler} value={data.country} type="text" placeholder='Quốc gia' />
                </div>
                <input required name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Số điện thoại' />
              </div>
            ) : (
              <div className="place-order-card">
                <h3 className="place-order-card-title">Thông tin đặt bàn</h3>
                <div className="dine-in-info">
                  <p>Bạn đã chọn chế độ <b>Ăn tại quán</b>.</p>
                  <p>Vui lòng chọn chi nhánh và xác nhận đơn hàng. Nhân viên sẽ phục vụ món ăn cho bạn.</p>
                </div>
              </div>
            )}

            {/* Branch Selection Card */}
            {(!isContextDineIn || !branchId) && (
              <div className="place-order-card">
                <h3 className="place-order-card-title">Chọn Chi Nhánh Phục Vụ</h3>
                <select 
                  className="branch-select"
                  value={selectedBranch} 
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    setSelectedTable(""); // Reset table when branch changes
                  }}
                  required={orderMethod === 'dine-in'}
                >
                  <option value="">-- Chọn chi nhánh --</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Table Selection Card (Only for manual Dine-in) */}
            {orderMethod === 'dine-in' && !isContextDineIn && selectedBranch && (
              <div className="place-order-card">
                <h3 className="place-order-card-title">Chọn Bàn</h3>
                <div className="table-selection-grid">
                  {tables.length > 0 ? (
                    tables.map((table) => {
                      const isSelected = selectedTable === table._id;
                      const isAvailable = table.status === "Available";
                      return (
                        <div
                          key={table._id}
                          className={`table-option ${isSelected ? "selected" : ""} ${!isAvailable ? "occupied" : ""}`}
                          onClick={() => isAvailable && setSelectedTable(table._id)}
                        >
                          <div className="table-number">{table.tableNumber}</div>
                          <div className="table-capacity">
                            👤 {table.capacity} người
                          </div>
                          <div className="table-status">
                            {isAvailable ? "Trống" : "Đang dùng"}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p>Đang tải danh sách bàn hoặc chưa có bàn...</p>
                  )}
                </div>
                {!selectedTable && <p className="error-text">Vui lòng chọn bàn trống</p>}
              </div>
            )}

            {/* Order Items Review Card */}
            <div className="place-order-card">
              <h3 className="place-order-card-title">Các món đã chọn</h3>
              <div className="place-order-items">
                {food_list.map((item, index) => {
                  if (cartItems[item._id] > 0) {
                    return (
                      <div key={index} className="place-order-item">
                        <img src={url + "/images/" + item.image} alt={item.name} />
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
                  <p>{orderMethod === "dine-in" ? "Phí phục vụ" : "Phí giao hàng"}</p>
                  <p>{orderMethod === "dine-in" ? "0 đ" : getTotalCartAmount() === 0 ? "0 đ" : "15.000 đ"}</p>
                </div>
                <hr />
                <div className="cart-total-details">
                  <b>Tổng cộng</b>
                  <b>
                    {getTotalCartAmount() === 0
                      ? "0 đ"
                      : (getTotalCartAmount() + (orderMethod === "dine-in" ? 0 : 15000)).toLocaleString('vi-VN') + " đ"}
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
                    <span>{orderMethod === "dine-in" ? "Thanh toán tại quầy" : "Tiền mặt khi nhận"}</span>
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
      </div>
    </div>
  );
};

export default PlaceOrder;
