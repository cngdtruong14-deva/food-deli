import { useState, useEffect, useContext } from "react";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const Orders = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);

  const fetchAllOrder = async () => {
    const response = await axios.get(url + "/api/order/list", {
      headers: { token },
    });
    if (response.data.success) {
      setOrders(response.data.data);
    }
  };

  const statusHandler = async (event, orderId) => {
    const response = await axios.post(
      url + "/api/order/status",
      {
        orderId,
        status: event.target.value,
      },
      { headers: { token } }
    );
    if (response.data.success) {
      toast.success(response.data.message);
      // Don't refetch - socket will update the state
    } else {
      toast.error(response.data.message);
    }
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
      return;
    }

    fetchAllOrder();

    // Connect to Socket.io
    const socket = io(url);

    // Listen for new orders
    socket.on("order:new", (newOrder) => {
      toast.info("🆕 New Order Received!", { autoClose: 3000 });
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
    });

    // Listen for status updates
    socket.on("order:status_updated", ({ orderId, status }) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status } : order
        )
      );
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="order add">
      <h3>Order Page</h3>
      <div className="order-list">
        {orders.map((order, index) => (
          <div key={order._id || index} className="order-item">
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className="order-item-food">
                {order.items.map((item, idx) => {
                  if (idx === order.items.length - 1) {
                    return item.name + " x " + item.quantity;
                  } else {
                    return item.name + " x " + item.quantity + ", ";
                  }
                })}
              </p>
              <p className="order-item-name">
                {order.address?.firstName + " " + order.address?.lastName}
              </p>
              {order.orderType === "Dine-in" ? (
                <div className="order-item-address dine-in">
                  <span className="order-type-badge">🍽️ Dine-in</span>
                  {order.tableId && (
                    <p>Table: {order.tableId.tableNumber || order.tableId}</p>
                  )}
                  {order.branchId && (
                    <p>Branch: {order.branchId.name || order.branchId}</p>
                  )}
                </div>
              ) : (
                <div className="order-item-address">
                  <p>{order.address?.street + ","}</p>
                  <p>
                    {order.address?.city +
                      ", " +
                      order.address?.state +
                      ", " +
                      order.address?.country +
                      ", " +
                      order.address?.zipcode}
                  </p>
                </div>
              )}
              <p className="order-item-phone">{order.address?.phone}</p>
            </div>
            <p>Items: {order.items.length}</p>
            <p>{order.amount.toLocaleString('vi-VN')} đ</p>
            <select
              onChange={(event) => statusHandler(event, order._id)}
              value={order.status}
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Preparing">Preparing</option>
              <option value="Served">Served</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        ))}
        {orders.length === 0 && (
          <p className="empty-message">No orders yet.</p>
        )}
      </div>
    </div>
  );
};

export default Orders;
