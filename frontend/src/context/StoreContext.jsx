import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const url = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [token, setToken] = useState("");
  const [guestId, setGuestId] = useState(""); // Guest Identity
  const [food_list, setFoodList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dine-in context
  const [tableId, setTableId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [orderType, setOrderType] = useState("Delivery");
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

  const addToCart = async (itemId) => {
    const itemInfo = food_list.find((product) => product._id === itemId);
    const currentQuantity = cartItems[itemId] || 0;

    if (itemInfo && itemInfo.stock !== undefined && itemInfo.trackStock) {
        if (currentQuantity + 1 > itemInfo.stock) {
            toast.error("Đã hết hàng hoặc vượt quá số lượng tồn kho!");
            return;
        }
    }

    if (!cartItems[itemId]) {
      setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
    } else {
      setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
    }
    // Only sync cart with backend if logged in (users), 
    // Guests keep cart local (or we could implement guest cart backend sync later)
    if (token) {
      const response = await axios.post(
        url + "/api/cart/add",
        { itemId },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Đã thêm vào giỏ hàng");
      } else {
        toast.error("Có lỗi xảy ra");
      }
    }
  };

  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    if (token) {
      const response = await axios.post(
        url + "/api/cart/remove",
        { itemId },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Đã xóa khỏi giỏ hàng");
      } else {
        toast.error("Có lỗi xảy ra");
      }
    }
  };

  // ... (getTotalCartAmount, fetchFoodList, fetchCategories, loadCardData, fetchBranches) ...
  // Wait, I need to include these or they will be lost.
  // Actually, I should use StartLine/EndLine to target specific blocks to minimize disruption.
  // But the tool doesn't support skipping.
  // I will just replace the initial specific state declarations and use `multi_replace` or smaller chunks if possible.
  // No, I'll use `replace_file_content` on the top block and the bottom block (useEffect).
  
  // Actually, I'll just Replace the top lines 10-40 and the useEffect at 170.
  
  /* THIS TOOL CALL IS ONLY FOR TOP BLOCK */


  // Clear dine-in context
  const clearDineInContext = () => {
    setTableId(null);
    setBranchId(null);
    setOrderType("Delivery");
    setTableName("");
    localStorage.removeItem("dineInSession");
  };

  const addToCart = async (itemId) => {
    const itemInfo = food_list.find((product) => product._id === itemId);
    const currentQuantity = cartItems[itemId] || 0;

    if (itemInfo && itemInfo.stock !== undefined && itemInfo.trackStock) {
        if (currentQuantity + 1 > itemInfo.stock) {
            toast.error("Đã hết hàng hoặc vượt quá số lượng tồn kho!");
            return;
        }
    }

    if (!cartItems[itemId]) {
      setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
    } else {
      setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
    }
    if (token) {
      const response = await axios.post(
        url + "/api/cart/add",
        { itemId },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Đã thêm vào giỏ hàng");
      } else {
        toast.error("Có lỗi xảy ra");
      }
    }
  };

  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    if (token) {
      const response = await axios.post(
        url + "/api/cart/remove",
        { itemId },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Đã xóa khỏi giỏ hàng");
      } else {
        toast.error("Có lỗi xảy ra");
      }
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = food_list.find((product) => product._id === item);
        if (itemInfo) {
          totalAmount += itemInfo.price * cartItems[item];
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
  };
  
  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
