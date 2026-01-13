import { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import ReviewModal from "../../components/ReviewModal/ReviewModal";

const MyOrders = () => {
  const { url, token, addToCart, guestId } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active"); // "active" | "history"
  
  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState(new Set());

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // If no token, send guestId in body to fetch guest orders
      const payload = token ? {} : { guestId };
      const config = token ? { headers: { token } } : {};

      const response = await axios.post(
        url + "/api/order/userorders",
        payload,
        config
      );
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token || guestId) {
      fetchOrders();
    }
  }, [token, guestId]);

  // --- Logic Helpers ---

  const isOrderActive = (status) => {
    return ["Pending", "Confirmed", "Preparing", "Food Processing", "Out for delivery"].includes(status);
  };

  const activeOrders = data
        .filter(order => isOrderActive(order.status))
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest active first

  const historyOrders = data
        .filter(order => !isOrderActive(order.status))
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest completed first (Smart Sort)

  const handleReorder = (order) => {
    order.items.forEach(item => {
        addToCart(item._id, item.quantity); // Assuming addToCart takes (id, quantity) or typically just id, handling qty might require loop
        // Simple re-add strategy: just add 1 of each for now or loop if context supports qty
        // For standard StoreContext usually addToCart(id) adds 1. 
        // We will loop to add quantity.
        for(let i=0; i< (item.quantity || 1); i++) {
            addToCart(item._id);
        }
    });
    // Scroll to cart or notify? For now just simple add.
    alert("Đã thêm các món vào giỏ hàng! 🛒");
  };

  // --- UI Components ---
  
  /* Updated Logic: Context-aware Order Tracker */
  const OrderTracker = ({ order }) => {
     const isDineIn = order.orderType === "Dine-in";
     
     // Define steps based on Order Type
     const steps = isDineIn 
        ? [
            { key: "Pending", label: "Chờ xác nhận", icon: "🕒" },
            { key: "Confirmed", label: "Đã nhận đơn", icon: "✅" },
            { key: "Preparing", label: "Đang bếp", icon: "👨‍🍳" }, 
            { key: "Served", label: "Đã ra món", icon: "🍽️" }
          ]
        : [
            { key: "Pending", label: "Chờ xác nhận", icon: "🕒" },
            { key: "Confirmed", label: "Đã nhận đơn", icon: "✅" },
            { key: "Preparing", label: "Đang đóng gói", icon: "📦" }, 
            { key: "Out for delivery", label: "Đang giao", icon: "🛵" },
            { key: "Delivered", label: "Đã giao", icon: "🎉" }
          ];
     
     // Normalize current status to find active step index
     let normalizeStatus = order.status;
     
     // Map backend status to steps logic
     if (normalizeStatus === "Food Processing") normalizeStatus = "Preparing";
     
     // For Dine-in: Paid also means process is complete (Served)
     if (isDineIn && normalizeStatus === "Paid") normalizeStatus = "Served";
     
     // Find active index
     let activeIndex = steps.findIndex(s => s.key === normalizeStatus);
     
     // Fallback: If status is ahead of steps (e.g. Delivered is step 4, but let's say "Paid" for Delivery?)
     if (normalizeStatus === "Delivered") activeIndex = 4;
     if (normalizeStatus === "Paid" && !isDineIn) activeIndex = 4; // Treated as done
     
     // Special Case: "Out for delivery" should highlight previous steps
     if (normalizeStatus === "Out for delivery" && !isDineIn) activeIndex = 3;

     if (activeIndex === -1 && normalizeStatus !== "Cancelled") {
         // If status matches a step key directly
         activeIndex = steps.findIndex(s => s.key === normalizeStatus);
     }
     
     // If Cancelled, don't show tracker or show failed state (handled by parent usually)
     if (order.status === "Cancelled") return null;

     return (
        <div className="order-tracker">
            {steps.map((step, idx) => (
                <div key={idx} className={`tracker-step ${idx <= activeIndex ? 'completed' : ''}`}>
                    <div className="step-icon">{step.icon}</div>
                    <div className="step-label">{step.label}</div>
                    {idx < steps.length - 1 && <div className="step-line"></div>}
                </div>
            ))}
        </div>
     );
  };

  const renderOrderCard = (order, isHistory = false) => {
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const orderDate = new Date(order.date).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
      <div key={order._id} className="smart-order-card">
        <div className="card-header-smart">
             <div className="header-info">
                 <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                 <span className="order-date">{orderDate}</span>
             </div>
             <div className={`status-pill ${order.status.toLowerCase().replace(/\s/g, '-')}`}>
                 {order.status === "Pending" && "🕒 Chờ xác nhận"}
                 {order.status === "Confirmed" && "✅ Đã xác nhận"}
                 {order.status === "Preparing" && "👨‍🍳 Đang chuẩn bị"}
                 {order.status === "Food Processing" && "🔥 Đang nấu"}
                 {order.status === "Out for delivery" && "🚚 Đang giao"}
                 {order.status === "Served" && "🍽️ Đã phục vụ"}
                 {order.status === "Paid" && "💰 Đã thanh toán"}
                 {order.status === "Cancelled" && "❌ Đã hủy"}
                 {order.status === "Delivered" && "✅ Đã giao"}
             </div>
        </div>

        <div className="card-body-smart">
             {/* Visual Tracker for Active Orders Only */}
             {!isHistory && order.status !== "Cancelled" && <OrderTracker order={order} />}
             
             <div className="smart-items-list">
                 {order.items.slice(0, 3).map((item, idx) => (
                     <div key={idx} className="smart-item-row">
                         <span className="item-qty">x{item.quantity}</span>
                         <span className="item-name">{item.name}</span>
                         <span className="item-price">{(item.price * item.quantity).toLocaleString()}đ</span>
                     </div>
                 ))}
                 {order.items.length > 3 && (
                     <div className="more-items">...và {order.items.length - 3} món khác</div>
                 )}
             </div>
             
             <div className="smart-summary">
                 <div className="summary-row">
                     <span>Tổng tiền ({totalItems} món):</span>
                     <span className="total-price">{order.amount.toLocaleString()}đ</span>
                 </div>
                 <div className="summary-row detail">
                      {order.orderType === "Dine-in" ? (
                          <span>🍽️ Tại bàn {order.tableId?.tableNumber || ""}</span>
                      ) : (
                          <span>🚚 Giao tận nơi</span>
                      )}
                 </div>
             </div>
        </div>

        <div className="card-footer-smart">
            {isHistory ? (
                <>
                   <button className="smart-btn outline" onClick={() => handleReorder(order)}>🔄 Đặt lại</button>
                   {/* Rate Order Button - Only for completed orders not yet reviewed */}
                   {["Delivered", "Served", "Paid"].includes(order.status) && !order.isReviewed && !reviewedOrders.has(order._id) && (
                     <button 
                       className="smart-btn review-btn" 
                       onClick={() => {
                         setSelectedOrderId(order._id);
                         setReviewModalOpen(true);
                       }}
                     >
                       ⭐ Đánh giá
                     </button>
                   )}
                   {(order.isReviewed || reviewedOrders.has(order._id)) && (
                     <span className="reviewed-badge">✓ Đã đánh giá</span>
                   )}
                </>
            ) : (
                 <button className="smart-btn primary" onClick={fetchOrders}>Cập nhật</button>
            )}
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="my-orders-smart">
       <div className="smart-container">
           <div className="smart-header">
               <h1>Đơn hàng của tôi</h1>
               <div className="smart-tabs">
                   <button 
                      className={`smart-tab ${activeTab === "active" ? "active" : ""}`}
                      onClick={() => setActiveTab("active")}
                   >
                      Đang xử lý
                      {activeOrders.length > 0 && <span className="smart-badge">{activeOrders.length}</span>}
                   </button>
                   <button 
                      className={`smart-tab ${activeTab === "history" ? "active" : ""}`}
                      onClick={() => setActiveTab("history")}
                   >
                      Lịch sử đơn hàng
                   </button>
               </div>
           </div>

           <div className="smart-content-area">
               {loading ? (
                   <div className="smart-loading">Đang tải...</div>
               ) : (
                   <>
                      {activeTab === "active" ? (
                          activeOrders.length > 0 ? (
                              <div className="smart-grid">
                                  {activeOrders.map(order => renderOrderCard(order, false))}
                              </div>
                          ) : (
                              <div className="smart-empty">
                                  <div className="empty-emoji">🥣</div>
                                  <h3>Không có đơn đang xử lý</h3>
                                  <p>Bạn đang đói? Hãy đặt món ngay nhé!</p>
                                  <a href="/" className="smart-cta">Xem thực đơn</a>
                              </div>
                          )
                      ) : (
                          historyOrders.length > 0 ? (
                              <div className="smart-grid">
                                  {historyOrders.map(order => renderOrderCard(order, true))}
                              </div>
                          ) : (
                              <div className="smart-empty">
                                  <div className="empty-emoji">📜</div>
                                  <h3>Chưa có lịch sử đơn hàng</h3>
                              </div>
                          )
                      )}
                   </>
               )}
           </div>
       </div>
    </div>
    
    {/* Review Modal */}
    <ReviewModal
      isOpen={reviewModalOpen}
      onClose={() => {
        setReviewModalOpen(false);
        setSelectedOrderId(null);
      }}
      orderId={selectedOrderId}
      url={url}
      token={token}
      onSuccess={() => {
        // Mark order as reviewed locally
        setReviewedOrders(prev => new Set([...prev, selectedOrderId]));
      }}
    />
  </>
  );
};

export default MyOrders;
