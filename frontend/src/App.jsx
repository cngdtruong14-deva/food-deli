import { useState, useContext, useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import { Route, Routes, useSearchParams, useNavigate } from "react-router-dom";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import Branches from "./pages/Branches/Branches";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import SmartFab from "./components/SmartFab/SmartFab";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Verify from "./pages/Verify/Verify";
import MyOrders from "./pages/MyOrders/MyOrders";
import { StoreContext } from "./context/StoreContext";

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setDineInContext } = useContext(StoreContext);

  // Handle QR code entry
  useEffect(() => {
    const tableId = searchParams.get("tableId");
    const branchId = searchParams.get("branchId");
    
    if (tableId && branchId) {
      // Set dine-in context
      setDineInContext(tableId, branchId, "");
      
      // Clean URL by navigating to home without query params
      navigate("/", { replace: true });
    }
  }, [searchParams, setDineInContext, navigate]);

  return (
    <>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
      <div className="app page-fade-in">
        <ScrollToTop />
        <ToastContainer />
        <Navbar setShowLogin={setShowLogin} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/branches" element={<Branches />} />
        </Routes>
      </div>
      <SmartFab />
      <Footer />
    </>
  );
};

export default App;
