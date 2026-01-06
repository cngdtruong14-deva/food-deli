import { useState, useEffect, useContext, useMemo } from "react";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Search, Filter, Clock, MapPin, Table as TableIcon, ChefHat, CheckCircle, XCircle, Trash2 } from 'lucide-react'; // Ensure lucide-react is installed

const Orders = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  
  // Smart OMS State
  const [activeTab, setActiveTab] = useState("Pending"); // Pending, Kitchen, Ready, History, All
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("oldest"); // oldest, newest

  // ... (Cancellation Modal State)

  // Auto-switch Sort Order based on Tab "Smart Logic"
  useEffect(() => {
      if (["Pending", "Kitchen", "Ready"].includes(activeTab)) {
          setSortOrder("oldest"); // Prioritize waiting/processing orders first
      } else {
          setSortOrder("newest"); // Show recent history first
      }
  }, [activeTab]);

  // ... (Backend Logic)

  // ... (Helper Functions)

  // ... (Stats Calculation)



  // ... (Stats Calculation)

  // 2. Filtering & Sorting Logic
  const filteredOrders = useMemo(() => {
    let filtered = [...orders]; // Create a copy for sorting

    // Tab Filter
    if (activeTab === "Pending") filtered = filtered.filter(o => o.status === "Pending");
    else if (activeTab === "Kitchen") filtered = filtered.filter(o => ["Confirmed", "Preparing"].includes(o.status));
    else if (activeTab === "Ready") filtered = filtered.filter(o => ["Served", "Out for delivery"].includes(o.status));
    else if (activeTab === "History") filtered = filtered.filter(o => ["Paid", "Delivered", "Cancelled"].includes(o.status));
    
    // Search Filter (Client-side)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => 
        (o.address?.firstName + " " + o.address?.lastName).toLowerCase().includes(term) || 
        o._id.toLowerCase().includes(term) ||
        (o.items.some(i => i.name.toLowerCase().includes(term)))
      );
    }

    // Smart Sorting
    filtered.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [orders, activeTab, searchTerm, sortOrder]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const PREDEFINED_REASONS = [
    "Hết món/Nguyên liệu",
    "Khách hàng yêu cầu hủy",
    "Khách hàng đổi ý",
    "Đơn hàng trùng lặp/Spam",
    "Không liên lạc được khách",
    "Chờ quá lâu",
    "Khác"
  ];

  // --- Backend Logic ---
  const fetchAllOrder = async () => {
    try {
      const response = await axios.get(url + "/api/order/list", {
        headers: { token },
      });
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
       console.error("Fetch error:", error);
    }
  };

  const statusHandler = async (orderId, newStatus) => {
    if (newStatus === "Cancelled") {
      setCancellingOrderId(orderId);
      setCancelReason(PREDEFINED_REASONS[0]);
      setCustomReason("");
      setShowCancelModal(true);
      return;
    }
    await updateOrderStatus(orderId, newStatus);
  };

  const updateOrderStatus = async (orderId, status, reason = null) => {
    try {
      const response = await axios.post(
        url + "/api/order/status",
        { orderId, status, reason },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        setShowCancelModal(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const confirmCancellation = () => {
    const finalReason = cancelReason === "Khác" ? customReason : cancelReason;
    if (!finalReason) {
      toast.error("Vui lòng nhập lý do hủy");
      return;
    }
    updateOrderStatus(cancellingOrderId, "Cancelled", finalReason);
  };

  // --- Helper Functions ---
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      Pending: "Chờ xác nhận",
      Confirmed: "Đã xác nhận",
      Preparing: "Đang nấu",
      Served: "Đã ra món",
      "Out for delivery": "Đang đi giao",
      Delivered: "Đã giao xong",
      Paid: "Đã thanh toán",
      Cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  // --- Smart OMS Logic ---

  // 1. Stats Calculation
  const stats = useMemo(() => {
    return {
      pending: orders.filter(o => o.status === "Pending").length,
      kitchen: orders.filter(o => ["Confirmed", "Preparing"].includes(o.status)).length,
      ready: orders.filter(o => ["Served", "Out for delivery"].includes(o.status)).length,
    };
  }, [orders]);

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Vui lòng đăng nhập");
      navigate("/");
      return;
    }
    fetchAllOrder();
    const socket = io(url);
    socket.on("order:new", (newOrder) => {
      toast.info("🆕 Có đơn hàng mới!", { autoClose: 3000 });
      setOrders((prev) => [newOrder, ...prev]);
      
      // Play Sound Alert
      try {
          const audio = new Audio("https://cdn.freesound.org/previews/533/533869_5828667-lq.mp3"); // Short crisp notification sound
          audio.volume = 0.8;
          audio.play().catch(e => console.log("Audio play blocked", e));
      } catch (e) {
          console.error("Audio error", e);
      }
    });
    socket.on("order:status_updated", ({ orderId, status }) => {
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status } : o));
    });
    return () => socket.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // --- Render Components ---

  const renderTabs = () => (
    <div className="oms-tabs">
      <button className={`oms-tab ${activeTab === "Pending" ? "active" : ""}`} onClick={() => setActiveTab("Pending")}>
        <div className="tab-icon warning-pulse"><Clock size={16} /></div>
        Chờ xác nhận
        {stats.pending > 0 && <span className="tab-badge error">{stats.pending}</span>}
      </button>
      <button className={`oms-tab ${activeTab === "Kitchen" ? "active" : ""}`} onClick={() => setActiveTab("Kitchen")}>
        <div className="tab-icon"><ChefHat size={16} /></div>
        Bếp đang nấu
        {stats.kitchen > 0 && <span className="tab-badge warning">{stats.kitchen}</span>}
      </button>
      <button className={`oms-tab ${activeTab === "Ready" ? "active" : ""}`} onClick={() => setActiveTab("Ready")}>
        <div className="tab-icon"><CheckCircle size={16} /></div>
        Đã Xong/Giao
        {stats.ready > 0 && <span className="tab-badge success">{stats.ready}</span>}
      </button>
      <button className={`oms-tab ${activeTab === "History" ? "active" : ""}`} onClick={() => setActiveTab("History")}>
       Lịch sử đơn hàng
      </button>
      <button className={`oms-tab ${activeTab === "All" ? "active" : ""}`} onClick={() => setActiveTab("All")}>
        Tất cả
      </button>
    </div>
  );

  const renderCard = (order) => (
    <div key={order._id} className="oms-card slide-in">
      <div className="oms-card-header">
        <div className="oms-order-id">
          <span className="hash">#</span>{order._id.slice(-6).toUpperCase()}
        </div>
        <div className="oms-time-badge">
          {formatDate(order.date)}
        </div>
        <div className={`oms-status-pill status-${order.status.toLowerCase()}`}>
          {getStatusLabel(order.status)}
        </div>
      </div>
      
      <div className="oms-card-body">
         <div className="oms-customer-info">
            {order.orderType === "Dine-in" ? (
                <div className="oms-tag dine-in">
                    <TableIcon size={14} /> 
                    <span>Bàn {order.tableId?.tableNumber || "?"}</span>
                    {order.tableId?.floor && <span className="text-muted"> (T{order.tableId.floor})</span>}
                </div>
            ) : (
                <div className="oms-tag delivery">
                    <MapPin size={14} /> <span>Giao đi</span>
                </div>
            )}
            <span className="customer-name">{order.address?.firstName} {order.address?.lastName}</span>
         </div>

         <div className="oms-items-list">
             {order.items.map((item, idx) => (
                 <div key={idx} className="oms-item-row">
                     <span className="oms-qty">x{item.quantity}</span>
                     <span className="oms-name">{item.name}</span>
                 </div>
             ))}
         </div>
      </div>

      <div className="oms-card-footer">
        <div className="oms-total">
            {order.amount.toLocaleString('vi-VN')}đ
        </div>
        <div className="oms-actions">
           {/* Dynamic Actions based on Status & Type */}
           {order.status === "Pending" && (
             <>
               <button className="oms-btn btn-cancel" onClick={() => statusHandler(order._id, "Cancelled")}>Từ chối</button>
               <button className="oms-btn btn-confirm" onClick={() => statusHandler(order._id, "Confirmed")}>Duyệt đơn</button>
             </>
           )}
           
           {order.status === "Confirmed" && (
             <button className="oms-btn btn-primary" onClick={() => statusHandler(order._id, "Preparing")}>👨‍🍳 Chuyển Bếp</button>
           )}

           {order.status === "Preparing" && (
              order.orderType === "Delivery" ? (
                  <button className="oms-btn btn-success" onClick={() => statusHandler(order._id, "Out for delivery")}>🚚 Giao hàng</button>
              ) : (
                  <button className="oms-btn btn-success" onClick={() => statusHandler(order._id, "Served")}>🍽️ Ra món</button>
              )
           )}

           {order.status === "Out for delivery" && (
              <button className="oms-btn btn-complete" onClick={() => statusHandler(order._id, "Delivered")}>✅ Đã giao xong</button>
           )}

           {order.status === "Served" && (
              <button className="oms-btn btn-complete" onClick={() => statusHandler(order._id, "Paid")}>💰 Thanh toán</button>
           )}

           {["Paid", "Delivered", "Cancelled"].includes(order.status) && (
               <span className="text-status-done">Hoàn tất</span>
           )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="oms-container">
       {/* Cancel Modal (Preserved) */}
       {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal-content cancel-modal">
            <div className="modal-header">
              <h3>❌ Xác nhận hủy đơn hàng</h3>
              <button className="close-btn" onClick={() => setShowCancelModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Lý do hủy đơn:</p>
              <div className="form-group">
                <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="reason-select">
                  {PREDEFINED_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {cancelReason === "Khác" && (
                <div className="form-group fade-in">
                  <textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Nhập lý do..." rows={3} className="custom-reason-input" />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>Đóng</button>
              <button className="btn-danger" onClick={confirmCancellation}>Hủy đơn</button>
            </div>
          </div>
        </div>
      )}
      <div className="oms-header">
         <div className="oms-title">
             <h2>Quản Lý Đơn Hàng</h2>
             <p className="oms-subtitle">Theo dõi và xử lý đơn hàng tập trung</p>
         </div>
         
         <div className="oms-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Cleanup Debug Button */}
             <button 
                onClick={async () => {
                    if(!window.confirm("Bạn có chắc muốn xóa tất cả đơn hàng có tên 'Debug'? Hành động này không thể hoàn tác.")) return;
                    try {
                        const response = await axios.post(url + "/api/order/cleanup", {}, { headers: { token } });
                        if (response.data.success) {
                            toast.success(response.data.message);
                            fetchAllOrder();
                        } else {
                            toast.error(response.data.message);
                        }
                    } catch (error) {
                        toast.error("Lỗi khi xóa đơn");
                    }
                }}
                className="oms-btn"
                style={{ background: '#cbd5e1', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="Xóa các đơn hàng thử nghiệm (Debug User)"
            >
                <Trash2 size={16} /> Xóa Đơn Rác
            </button>

            {/* Sort Control */}
            <div className="oms-sort">
                <select 
                    value={sortOrder} 
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="sort-select"
                    style={{ 
                        padding: '0.75rem', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0',
                        outline: 'none',
                        cursor: 'pointer',
                        color: '#475569',
                        fontWeight: '500'
                    }}
                >
                    <option value="oldest">🕒 Cũ nhất (Chờ lâu)</option>
                    <option value="newest">🕒 Mới nhất (Gần đây)</option>
                </select>
            </div>

            <div className="oms-search">
                 <Search className="search-icon" size={20} />
                 <input 
                    type="text" 
                    placeholder="Tìm tên khách, mã đơn..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
            </div>
         </div>
      </div>

      {/* Tabs */}
      {renderTabs()}

      {/* Order Grid */}
      <div className="oms-grid">
         {filteredOrders.length > 0 ? (
             filteredOrders.map(order => renderCard(order))
         ) : (
             <div className="oms-empty-state">
                  <div className="empty-icon"><Filter size={48} /></div>
                  <p>Không tìm thấy đơn hàng nào trong mục này.</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default Orders;
