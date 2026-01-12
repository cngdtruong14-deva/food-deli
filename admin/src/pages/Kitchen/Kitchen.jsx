import React, { useState, useEffect, useRef } from 'react';
import './Kitchen.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from "socket.io-client";

const Kitchen = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // pending, cooking, completed
  const [socket, setSocket] = useState(null);
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.m4a'));

  // Define Status Groupings
  const TABS = {
    pending: { label: 'Chờ nấu', statuses: ['Food Processing'] }, // Note: Frontend usually maps 'Food Processing' as Pending/Confirmed
    cooking: { label: 'Đang nấu', statuses: ['Cooking'] },
    completed: { label: 'Đã xong', statuses: ['Cooked', 'Served', 'Delivered'] }
  };
  
  // Note: Backend statuses: 'Food Processing' (Default after pay/confirm), 'Out for delivery', 'Delivered', 'Cancelled'
  // We need to support custom statuses if we want "Cooking" and "Cooked" 
  // OR we map existing ones.
  // Standard Flow: Food Processing -> Out for delivery -> Delivered
  // KDS Flow implies: Food Processing (Pending) -> Cooking -> Cooked -> (Waiter takes it) -> Served
  // We might need to handle these custom statuses in Backend if they don't exist, but 'updateStatus' allows any string.
  
  useEffect(() => {
    fetchOrders();
    
    // Connect Socket
    const token = localStorage.getItem("token");
    const newSocket = io(url, {
        auth: { token }
    });
    setSocket(newSocket);

    // Get staff branch (if any) to join room?
    // Actually Backend auto-joins 'branch_{id}' if staff.
    // We just listen to 'order:new' or generic events.
    newSocket.on("connect", () => {
        // If staff, join branch room manually just in case (though backend handles it)
        const branchId = localStorage.getItem("branchId"); // Assuming stored
        if(branchId) newSocket.emit("join_branch", branchId);
    });

    newSocket.on("order:new", (order) => {
        toast.info(`🔔 New Order! Table ${order.tableId?.tableNumber || '?'}`);
        playSound();
        fetchOrders(); // Refresh to get full data
    });

    newSocket.on("order:status_updated", ({ orderId, status }) => {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    });

    return () => newSocket.disconnect();
  }, [url]);

  const fetchOrders = async () => {
    try {
        const token = localStorage.getItem("token");
        // We reuse listOrders or generic order list. 
        // Need to ensure we get ALL orders if admin, or Branch orders if staff.
        // listOrders is generic.
        const response = await axios.get(`${url}/api/order/list`, { headers: { token }}); // Using standard list
        if (response.data.success) {
            setOrders(response.data.data);
        } else {
            toast.error("Error fetching orders");
        }
    } catch (error) {
        toast.error("Error fetching data");
    }
  };

  const playSound = () => {
      audioRef.current.play().catch(e => console.log("Audio play failed (user interaction needed)"));
  };

  const updateStatus = async (orderId, newStatus) => {
      // Optimistic Update
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      
      try {
          const token = localStorage.getItem("token");
          // Assuming we use the standard updateStatus API
          await axios.post(`${url}/api/order/status`, {
              orderId,
              status: newStatus,
              userId: localStorage.getItem("userId") // Need to send userId for backend check
          }, { headers: { token }});
          
          toast.success(`Moved to ${newStatus}`);
      } catch (error) {
          toast.error("Update failed");
          fetchOrders(); // Revert
      }
  };

  // Filter Orders for Current Tab
  const getTabOrders = () => {
      // Logic:
      // PENDING: 'Food Processing' (Default) OR 'Confirmed'
      // COOKING: 'Cooking'
      // COMPLETED: 'Cooked'
      // We exclude 'Delivered', 'Served', 'Cancelled' from main KDS view usually, or put in Completed.
      
      return orders.filter(order => {
          const s = order.status;
          if (activeTab === 'pending') return s === 'Food Processing' || s === 'Confirmed' || s === 'Pending';
          if (activeTab === 'cooking') return s === 'Cooking';
          if (activeTab === 'completed') return s === 'Cooked'; 
          return false;
      }).sort((a,b) => new Date(a.date) - new Date(b.date)); // Oldest first
  };

  const formatTimeElapsed = (dateStr) => {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      return `${mins} min`;
  };

  const printTicket = (order) => {
      // Simple Print Logic
      const win = window.open('', '', 'width=400,height=600');
      win.document.write(`
          <html>
            <head>
                <title>TICKET #${order._id.slice(-4)}</title>
                <style>
                    body { font-family: monospace; padding: 20px; text-align: left; }
                    .header { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                    .info { font-size: 14px; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
                    .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 16px; }
                    .note { font-size: 12px; margin-left: 20px; font-style: italic; }
                    .footer { margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px; font-size: 12px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">TABLE: ${order.tableId?.tableNumber || 'TAKEAWAY'}</div>
                <div class="info">
                    ID: #${order._id.slice(-4)}<br/>
                    Time: ${new Date(order.date).toLocaleTimeString()}
                </div>
                ${order.items.map(item => `
                    <div class="item">
                        <span>${item.quantity}x ${item.name}</span>
                    </div>
                     ${item.note ? `<div class="note">Note: ${item.note}</div>` : ''}
                `).join('')}
                <div class="footer">
                    END OF TICKET
                </div>
            </body>
          </html>
      `);
      win.document.close();
      win.print();
  };

  return (
    <div className='kitchen-board'>
        <div className="kitchen-header">
            <h2>🧑‍🍳 KITCHEN DISPLAY SYSTEM</h2>
            <div className="kitchen-tabs">
                <button 
                    className={activeTab === 'pending' ? 'active' : ''} 
                    onClick={() => setActiveTab('pending')}
                >
                    Chờ nấu ({orders.filter(o => o.status === 'Food Processing' || o.status === 'Confirmed').length})
                </button>
                <button 
                    className={activeTab === 'cooking' ? 'active' : ''} 
                    onClick={() => setActiveTab('cooking')}
                >
                    Đang nấu ({orders.filter(o => o.status === 'Cooking').length})
                </button>
                <button 
                    className={activeTab === 'completed' ? 'active' : ''} 
                    onClick={() => setActiveTab('completed')}
                >
                    Đã xong ({orders.filter(o => o.status === 'Cooked').length})
                </button>
            </div>
            <button className="test-sound-btn" onClick={playSound}>🔊 Test Sound</button>
        </div>

        <div className="kitchen-grid">
            {getTabOrders().map(order => {
                const mins = Math.floor((Date.now() - new Date(order.date).getTime()) / 60000);
                const isLate = mins > 15;
                
                return (
                    <div key={order._id} className={`kitchen-card ${isLate ? 'late' : ''}`}>
                        <div className="card-header">
                            <span className="table-num">{order.tableId ? `Table ${order.tableId.tableNumber}` : 'Takeaway'}</span>
                            <span className="timer">{mins} min</span>
                        </div>
                        <div className="card-body">
                            {order.items.map((item, idx) => (
                                <div key={idx} className={`order-item ${item.note ? 'has-note' : ''}`}>
                                    <div className="item-main">
                                        <span className="qty">{item.quantity}x</span>
                                        <span className="name">{item.name}</span>
                                    </div>
                                    {item.note && <div className="item-note">📝 {item.note}</div>}
                                </div>
                            ))}
                        </div>
                        <div className="card-actions">
                            <button className="icon-btn print-btn" onClick={() => printTicket(order)}>🖨️</button>
                            
                            {activeTab === 'pending' && (
                                <>
                                    <button className="action-btn start-btn" onClick={() => updateStatus(order._id, 'Cooking')}>🔥 Nấu</button>
                                    <button className="action-btn done-btn" onClick={() => updateStatus(order._id, 'Cooked')}>✅ Xong</button>
                                </>
                            )}
                            {activeTab === 'cooking' && (
                                <button className="action-btn done-btn" onClick={() => updateStatus(order._id, 'Cooked')}>✅ Xong</button>
                            )}
                            {activeTab === 'completed' && (
                                <button className="action-btn undo-btn" onClick={() => updateStatus(order._id, 'Cooking')}>↩️ Quay lại</button>
                            )}
                        </div>
                    </div>
                );
            })}
             {getTabOrders().length === 0 && <div className="no-orders">Không có đơn hàng nào</div>}
        </div>
    </div>
  );
};

export default Kitchen;
