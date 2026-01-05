import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const url = "http://localhost:4000";
  const [token, setToken] = useState("");
  const [food_list, setFoodList] = useState([]);
  const [categories, setCategories] = useState([]);
  
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

  const fetchFoodList = async () => {
    const response = await axios.get(url + "/api/food/list");
    if (response.data.success) {
      setFoodList(response.data.data);
    } else {
      alert("Lỗi! Không thể tải sản phẩm..");
    }
  };

  const fetchCategories = async () => {
    const response = await axios.get(url + "/api/food/categories");
    if (response.data.success) {
      setCategories(response.data.data);
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

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      await fetchCategories();
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
    // Dine-in context
    tableId,
    branchId,
    orderType,
    tableName,
    setDineInContext,
    clearDineInContext,
  };
  
  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
