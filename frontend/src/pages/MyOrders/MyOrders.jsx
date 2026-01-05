import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/frontend_assets/assets";

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const response = await axios.post(
      url + "/api/order/userorders",
      {},
      { headers: { token } }
    );
    if (response.data.success) {
      setData(response.data.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  // Status Translation Map
  const statusMap = {
    "Pending": "Chờ xác nhận",
    "Confirmed": "Đã xác nhận",
    "Preparing": "Đang chuẩn bị",
    "Served": "Đang giao / Đã hoàn thành",
    "Paid": "Đã thanh toán",
    "Cancelled": "Đã hủy",
    "Food Processing": "Đang chế biến",
    "Out for delivery": "Đang giao hàng",
    "Delivered": "Đã giao hàng"
  };

  const getStatusDisplay = (status) => {
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      "Pending": "status-pending",
      "Confirmed": "status-confirmed",
      "Preparing": "status-preparing",
      "Food Processing": "status-preparing",
      "Served": "status-served",
      "Out for delivery": "status-served",
      "Delivered": "status-delivered",
      "Paid": "status-paid",
      "Cancelled": "status-cancelled"
    };
    return colors[status] || "status-pending";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalItems = (items) => {
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  // Categorize orders into active and completed
  const isOrderCompleted = (status) => {
    const completedStatuses = ["Delivered", "Paid", "Cancelled", "Served"];
    return completedStatuses.includes(status);
  };

  const activeOrders = data.filter(order => !isOrderCompleted(order.status));
  const completedOrders = data.filter(order => isOrderCompleted(order.status));

  const renderOrderCard = (order, index) => {
    const totalItems = getTotalItems(order.items);
    const orderDate = formatDate(order.date);
    
    return (
      <div key={index} className="my-orders-card">
        <div className="order-card-header">
          <div className="order-header-left">
            <div className="order-number">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              <span>Đơn hàng #{order._id.slice(-6).toUpperCase()}</span>
            </div>
            <div className="order-date">{orderDate}</div>
          </div>
          <div className={`order-status-badge ${getStatusColor(order.status)}`}>
            {getStatusDisplay(order.status)}
          </div>
        </div>

        <div className="order-card-body">
          <div className="order-items-section">
            <h4 className="order-section-title">Món đã đặt</h4>
            <div className="order-items-list">
              {order.items.map((item, itemIndex) => (
                <div key={itemIndex} className="order-item-row">
                  <div className="order-item-image">
                    {item.image ? (
                      <img src={`${url}/images/${item.image}`} alt={item.name} />
                    ) : (
                      <div className="order-item-placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="order-item-details">
                    <p className="order-item-name">{item.name}</p>
                    <p className="order-item-meta">
                      Số lượng: {item.quantity || 1} • {item.price ? `${item.price.toLocaleString('vi-VN')} đ` : ''}
                    </p>
                  </div>
                  <div className="order-item-total">
                    {item.price && item.quantity ? 
                      `${(item.price * (item.quantity || 1)).toLocaleString('vi-VN')} đ` : 
                      ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-summary-section">
            <div className="order-summary-row">
              <span>Tổng số món:</span>
              <span className="order-summary-value">{totalItems} món</span>
            </div>
            {order.orderType && (
              <div className="order-summary-row">
                <span>Loại đơn:</span>
                <span className="order-summary-value order-type-badge">
                  {order.orderType === "Dine-in" ? "🍽️ Ăn tại quán" : order.orderType === "Delivery" ? "🚚 Giao hàng" : "📦 Mang đi"}
                </span>
              </div>
            )}
            <div className="order-summary-row order-total-row">
              <span>Tổng tiền:</span>
              <span className="order-summary-total">{order.amount.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>

        <div className="order-card-footer">
          <button className="order-refresh-btn" onClick={fetchOrders}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            Cập nhật trạng thái
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="my-orders">
      <div className="my-orders-container">
        <div className="my-orders-header">
          <div className="my-orders-breadcrumb">
            <a href="/">Trang chủ</a>
            <span>/</span>
            <span>Đơn hàng của tôi</span>
          </div>
          <h1 className="my-orders-title">Đơn hàng của tôi</h1>
          <p className="my-orders-subtitle">Theo dõi và quản lý đơn hàng của bạn</p>
        </div>

        {loading ? (
          <div className="my-orders-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải đơn hàng...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="my-orders-empty">
            <div className="empty-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4"></path>
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3z"></path>
                <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3z"></path>
              </svg>
            </div>
            <h3>Bạn chưa có đơn hàng nào</h3>
            <p>Hãy đặt món để bắt đầu trải nghiệm ẩm thực tuyệt vời!</p>
            <a href="/" className="empty-cta">Đặt món ngay</a>
          </div>
        ) : (
          <div className="orders-columns-layout">
            {/* Active Orders Column */}
            <div className="orders-column active-column">
              <div className="orders-section-header">
                <div className="section-header-left">
                  <div className="section-icon active-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 6v6l4 2"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="orders-section-title">Đang xử lý</h2>
                    <p className="orders-section-subtitle">Các đơn hàng đang chờ xác nhận hoặc đang được chuẩn bị</p>
                  </div>
                </div>
                <div className="section-badge active-badge">{activeOrders.length}</div>
              </div>
              {activeOrders.length > 0 ? (
                <div className="my-orders-list">
                  {activeOrders.map((order, index) => renderOrderCard(order, index))}
                </div>
              ) : (
                <div className="orders-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                  <p>Không có đơn hàng đang xử lý</p>
                </div>
              )}
            </div>

            {/* Completed Orders Column */}
            <div className="orders-column completed-column">
              <div className="orders-section-header">
                <div className="section-header-left">
                  <div className="section-icon completed-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h2 className="orders-section-title">Đã hoàn thành</h2>
                    <p className="orders-section-subtitle">Lịch sử các đơn hàng đã hoàn thành</p>
                  </div>
                </div>
                <div className="section-badge completed-badge">{completedOrders.length}</div>
              </div>
              {completedOrders.length > 0 ? (
                <div className="my-orders-list">
                  {completedOrders.map((order, index) => renderOrderCard(order, `completed-${index}`))}
                </div>
              ) : (
                <div className="orders-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <p>Chưa có đơn hàng đã hoàn thành</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
