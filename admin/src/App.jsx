import React from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Route, Routes } from "react-router-dom";
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
import Login from "./components/Login/Login";

const App = () => {
  const url = "http://localhost:4000";
  return (
    <div>
      <ToastContainer />
      <Navbar />
      <hr />
      <div className="app-content">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Login url={url}/>} />
          <Route path="/dashboard" element={<Dashboard url={url}/>} />
          <Route path="/add" element={<Add url={url}/>} />
          <Route path="/list" element={<List url={url}/>} />
          <Route path="/orders" element={<Orders url={url}/>} />
          <Route path="/branches" element={<BranchList url={url}/>} />
          <Route path="/branches/add" element={<AddBranch url={url}/>} />
          <Route path="/tables" element={<TableList url={url}/>} />
          <Route path="/tables/add" element={<AddTable url={url}/>} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
