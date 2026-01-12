import React from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Route, Routes, Navigate } from "react-router-dom";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import BranchList from "./pages/Branch/BranchList";
import AddBranch from "./pages/Branch/AddBranch";
import TableList from "./pages/Table/TableList";
import AddTable from "./pages/Table/AddTable";
import Dashboard from "./pages/Dashboard/Dashboard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Trash from "./pages/Trash/Trash";
import Inventory from "./pages/Inventory/Inventory";
import Import from "./pages/Import/Import";
import Analytics from "./pages/Analytics/Analytics";
import Reviews from "./pages/Reviews/Reviews";
import Kitchen from "./pages/Kitchen/Kitchen"; // Import Kitchen
import SimpleAuthGuard from "./components/SimpleAuthGuard";

const App = () => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:4000";
  return (
    <div className="admin-app">
      <ToastContainer />
      <Navbar />
      <Sidebar />
      <div className="app-content page-fade-in">
        <Routes>
          {/* Redirect root to dashboard - login is now handled via dropdown */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard - accessible to all, but shows login dropdown if not authenticated */}
          <Route path="/dashboard" element={<Dashboard url={url}/>} />
          <Route path="/analytics" element={<SimpleAuthGuard><Analytics url={url}/></SimpleAuthGuard>} />
          
          {/* All other admin routes - PROTECTED by SimpleAuthGuard */}
          <Route path="/add" element={<SimpleAuthGuard><Add url={url}/></SimpleAuthGuard>} />
          <Route path="/list" element={<SimpleAuthGuard><List url={url}/></SimpleAuthGuard>} />
          <Route path="/orders" element={<SimpleAuthGuard><Orders url={url}/></SimpleAuthGuard>} />
          <Route path="/branches" element={<SimpleAuthGuard><BranchList url={url}/></SimpleAuthGuard>} />
          <Route path="/branches/add" element={<SimpleAuthGuard><AddBranch url={url}/></SimpleAuthGuard>} />
          <Route path="/tables" element={<SimpleAuthGuard><TableList url={url}/></SimpleAuthGuard>} />
          <Route path="/tables/add" element={<SimpleAuthGuard><AddTable url={url}/></SimpleAuthGuard>} />
          <Route path="/inventory" element={<SimpleAuthGuard><Inventory url={url}/></SimpleAuthGuard>} />
          <Route path="/import" element={<SimpleAuthGuard><Import url={url}/></SimpleAuthGuard>} />
          <Route path="/reviews" element={<SimpleAuthGuard><Reviews url={url}/></SimpleAuthGuard>} />
          <Route path="/trash" element={<SimpleAuthGuard><Trash url={url}/></SimpleAuthGuard>} />
          <Route path="/kitchen" element={<SimpleAuthGuard><Kitchen url={url}/></SimpleAuthGuard>} /> {/* Kitchen Route */}
        </Routes>
      </div>
    </div>
  );
};

export default App;
