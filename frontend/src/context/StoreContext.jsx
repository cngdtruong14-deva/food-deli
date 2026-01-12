import axios from "axios";
import { createContext, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

export const StoreContext = createContext(null);

// Helper: Extract userId from JWT token
const getUserIdFromToken = (token) => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.id || null;
  } catch (e) {
    console.error("Failed to decode token:", e);
    return null;
  }
};

// Helper: Vietnamese status messages
const getStatusMessage = (status) => {
  const messages = {
    "Pending": "🕒 Đơn hàng đang chờ xác nhận",
    "Confirmed": "✅ Đơn hàng đã được xác nhận!",
    "Preparing": "👨‍🍳 Bếp đang chuẩn bị món của bạn",
    "Food Processing": "🔥 Món ăn đang được nấu",
    "Out for delivery": "🚚 Shipper đang giao hàng đến bạn!",
    "Served": "🍽️ Món ăn đã được phục vụ!",
    "Delivered": "🎉 Đơn hàng đã giao thành công!",
    "Paid": "💰 Đã thanh toán thành công!",
    "Cancelled": "❌ Đơn hàng đã bị hủy"
  };
  return messages[status] || `Trạng thái đơn hàng: ${status}`;
};

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const url = import.meta.env.VITE_API_URL || "http://localhost:4000";
  console.log("Current API URL:", url);
  const [token, setToken] = useState("");
  const [guestId, setGuestId] = useState(""); // Guest Identity
  const [food_list, setFoodList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Socket.io reference
  const socketRef = useRef(null);
  
  // Dine-in context
  const [tableId, setTableId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [orderType, setOrderType] = useState(""); // Default to Not Selected
  const [tableName, setTableName] = useState("");

  // Set dine-in context from QR scan
  const setDineInContext = (newTableId, newBranchId, tableNumber = "") => {
    setTableId(newTableId);
    setBranchId(newBranchId);
    setOrderType("Dine-in");
    setTableName(tableNumber);
    
    // Auto-generate guestId if missing when scanning QR
    if (!localStorage.getItem("guestId")) {
        const newGuestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("guestId", newGuestId);
        setGuestId(newGuestId);
    }
    
    localStorage.setItem("dineInSession", JSON.stringify({
      tableId: newTableId,
      branchId: newBranchId,
      orderType: "Dine-in",
      tableName: tableNumber
    }));
  };

  // Clear dine-in context
  const clearDineInContext = () => {
    setTableId(null);
    setBranchId(null);
    setOrderType("Delivery");
    setTableName("");
    localStorage.removeItem("dineInSession");
  };

  // Helper to parse cart key
  const parseCartKey = (key) => {
      const parts = key.split('_note_');
      return {
          itemId: parts[0],
          note: parts.length > 1 ? parts[1] : ""
      };
  };

  const addToCart = async (itemId, note = "") => {
    // Generate Key
    const key = note ? `${itemId}_note_${note}` : itemId;
    
    // Check Stock across all variants
    const itemInfo = food_list.find((product) => product._id === itemId);
    
    // Calculate total quantity of this item across all notes
    let totalStockUsed = 0;
    for (const k in cartItems) {
        if (parseCartKey(k).itemId === itemId) {
            totalStockUsed += cartItems[k];
        }
    }

    if (itemInfo && itemInfo.stock !== undefined && itemInfo.trackStock) {
        if (totalStockUsed + 1 > itemInfo.stock) {
            toast.error("Đã hết hàng hoặc vượt quá số lượng tồn kho!");
            return;
        }
    }

    if (!cartItems[key]) {
      setCartItems((prev) => ({ ...prev, [key]: 1 }));
    } else {
      setCartItems((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    }
    
    if (token) {
      await axios.post(
        url + "/api/cart/add",
        { itemId: key, note }, // Send Key as itemId (or handle in backend), passing note separately for legacy/hybrid
        { headers: { token } }
      );
      toast.success(note ? "Đã thêm (có ghi chú)" : "Đã thêm vào giỏ hàng");
    }
  };

  const removeFromCart = async (key) => {
    setCartItems((prev) => {
        const newCart = { ...prev };
        if (newCart[key] > 1) {
            newCart[key] -= 1;
        } else {
            delete newCart[key];
        }
        return newCart;
    });

    if (token) {
      await axios.post(
        url + "/api/cart/remove",
        { itemId: key }, // Key contains the note info
        { headers: { token } }
      );
      toast.success("Đã xóa khỏi giỏ hàng");
    }
  };

  const updateCartNote = async (itemId, oldNote, newNote, quantity) => {
      // Current Key
      const oldKey = oldNote ? `${itemId}_note_${oldNote}` : itemId;
      const newKey = newNote ? `${itemId}_note_${newNote}` : itemId;

      if (oldKey === newKey) return; // No change

      setCartItems((prev) => {
          const newCart = { ...prev };
          // Remove old
          delete newCart[oldKey];
          // Add new (Merge)
          if (newCart[newKey]) {
              newCart[newKey] += quantity;
          } else {
              newCart[newKey] = quantity;
          }
          return newCart;
      });

      if (token) {
          // Call new endpoint
          // Note: We haven't added route for this yet, so we assume it exists or we use add/remove sequence?
          // User Task 1.2 "Controller Update". So we SHOULD add route.
          // But I need to add Route to `cartRoute.js`. Use fallback sequence if endpoint fails?
          // Since I edited controller, I MUST edit Route file too.
          // I will edit Route file in next step.
          await axios.post(
              url + "/api/cart/update-note",
              { itemId, oldNote, newNote, quantity },
              { headers: { token } }
          );
      }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const key in cartItems) {
      if (cartItems[key] > 0) {
        const { itemId } = parseCartKey(key);
        let itemInfo = food_list.find((product) => product._id === itemId);
        if (itemInfo) {
          totalAmount += itemInfo.price * cartItems[key];
        }
      }
    }
    return totalAmount;
  };

  const [isFoodLoading, setIsFoodLoading] = useState(true);

  const fetchFoodList = async () => {
    setIsFoodLoading(true);
    try {
      const response = await axios.get(url + "/api/food/list");
      if (response.data.success) {
        // Sort items alphabetically by name
        const sortedData = response.data.data.sort((a, b) => a.name.localeCompare(b.name));
        setFoodList(sortedData);
      } else {
        alert("Lỗi! Không thể tải sản phẩm..");
      }
    } catch (error) {
      console.error("Failed to fetch food list", error);
    } finally {
      setIsFoodLoading(false);
    }
  };

  const fetchCategories = async () => {
    const response = await axios.get(url + "/api/food/categories");
    if (response.data.success) {
      // Custom Order based on User Requirement
      const order = [
          "COMBO", "Món Mới", "Món Nhậu", "Dê Tươi", "Đồ Nướng", "Thiết Bản", 
          "Rau Xanh", "Lẩu", "Hải Sản", "Cá Các Món", "Món Ăn Chơi", "Salad - Nộm", "Cơm",
          "Món Khác", "Đồ Uống"
      ];
      
      const sortedData = response.data.data.sort((a, b) => {
          const indexA = order.findIndex(o => o.toUpperCase() === a.name.toUpperCase());
          const indexB = order.findIndex(o => o.toUpperCase() === b.name.toUpperCase());
          
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0;
      });

      setCategories(sortedData);
    }
  };

  const loadCardData = async (token) => {
    const response = await axios.post(
      url + "/api/cart/get",
      {},
      { headers: { token } }
    );
    setCartItems(response.data.cartData);
  };

  const [branches, setBranches] = useState([]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(url + "/api/branch/list");
      if (response.data.success) {
        setBranches(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      await fetchCategories();
      await fetchBranches();
      
      // Load or Create Guest ID (Persistent identity for non-logged users)
      let currentGuestId = localStorage.getItem("guestId");
      if (!currentGuestId) {
          currentGuestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem("guestId", currentGuestId);
      }
      setGuestId(currentGuestId);

      if (localStorage.getItem("token")) {
        setToken(localStorage.getItem("token"));
        await loadCardData(localStorage.getItem("token"));
      }
      
      // Restore dine-in session from localStorage
      const savedSession = localStorage.getItem("dineInSession");
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          setTableId(session.tableId);
          setBranchId(session.branchId);
          setOrderType(session.orderType);
          setTableName(session.tableName || "");
        } catch (e) {
          console.error("Error parsing dineInSession", e);
        }
      }
    }
    loadData();
  }, []);

  // Sync Cart with Food List (Cleanup deleted items)
  useEffect(() => {
     if (food_list.length > 0 && Object.keys(cartItems).length > 0) {
         let updatedCart = { ...cartItems };
         let hasChanges = false;
         
         for (const itemId in cartItems) {
             if (cartItems[itemId] > 0) {
                 const exists = food_list.find(f => f._id === itemId);
                 if (!exists) {
                     delete updatedCart[itemId];
                     hasChanges = true;
                 }
             }
         }
         
         if (hasChanges) {
             setCartItems(updatedCart);
         }
     }
  }, [food_list, cartItems]);

  // ========== SOCKET.IO REAL-TIME NOTIFICATIONS ==========
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(url, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      auth: { token } // Send JWT for auth
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
      
      // Join user room if logged in
      const userId = getUserIdFromToken(token);
      if (userId) {
        socket.emit("join_user", userId);
        console.log("📡 Joined user room:", userId);
      }
    });

    // Listen for order status updates
    socket.on("order:status_updated", (data) => {
      console.log("📦 Order status update received:", data);
      
      // Show toast notification
      const message = getStatusMessage(data.status);
      
      // Different toast types based on status
      if (data.status === "Cancelled") {
        toast.error(message, { icon: "❌" });
      } else if (data.status === "Delivered" || data.status === "Served") {
        toast.success(message, { icon: "🎉" });
      } else {
        toast.info(message, { autoClose: 5000 });
      }
    });

    // Listen for Stock Updates (Real-time inventory sync)
    socket.on("food:stock_updated", (updates) => {
        console.log("📦 Stock update received:", updates);
        setFoodList((prevList) => {
            return prevList.map(food => {
                const update = updates.find(u => u.id === food._id);
                if (update) {
                    return { ...food, stock: food.stock + update.change };
                }
                return food;
            });
        });
    });

    // Listen for Full Menu Updates (Admin changes)
    socket.on("food:list_updated", () => {
        console.log("📜 Menu update received. Refreshing list...");
        fetchFoodList();
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [url, token]);

  // Re-join room when token changes (login/logout)
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected) {
      const userId = getUserIdFromToken(token);
      if (userId) {
        socketRef.current.emit("join_user", userId);
        console.log("📡 Re-joined user room after token change:", userId);
      }
    }
  }, [token]);

  const contextValue = {
    food_list,
    categories,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    token,
    setToken,
    guestId,
    // Dine-in context
    tableId,
    branchId,
    orderType,
    tableName,
    setDineInContext,
    clearDineInContext,
    searchQuery,
    setSearchQuery,
    branches,
    isFoodLoading,
    // Socket for advanced usage
    socket: socketRef.current,
  };
  
  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
