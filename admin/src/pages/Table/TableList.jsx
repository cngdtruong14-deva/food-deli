import React, { useEffect, useState, useContext } from "react";
import "./Table.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const TableList = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [tables, setTables] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  const fetchBranches = async () => {
    const response = await axios.get(`${url}/api/branch/list`);
    if (response.data.success) {
      setBranches(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedBranch(response.data.data[0]._id);
      }
    }
  };

  const fetchTables = async (branchId) => {
    if (!branchId) return;
    const response = await axios.get(`${url}/api/table/list/${branchId}`);
    if (response.data.success) {
      setTables(response.data.data);
    } else {
      toast.error("Error fetching tables");
    }
  };

  const removeTable = async (tableId) => {
    const response = await axios.post(
      `${url}/api/table/remove`,
      { id: tableId },
      { headers: { token } }
    );
    await fetchTables(selectedBranch);
    if (response.data.success) {
      toast.success(response.data.message);
    } else {
      toast.error(response.data.message);
    }
  };

  const copyQRLink = (table) => {
    const link = `http://localhost:5173/menu?tableId=${table._id}&branchId=${table.branchId._id || table.branchId}`;
    navigator.clipboard.writeText(link);
    toast.success("QR Link copied to clipboard!");
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
    }
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchTables(selectedBranch);
    }
  }, [selectedBranch]);

  return (
    <div className="list add flex-col">
      <div className="list-header">
        <p>Tables</p>
        <button onClick={() => navigate("/tables/add")} className="add-btn">
          + Add Table
        </button>
      </div>

      <div className="branch-filter">
        <label>Select Branch: </label>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
        >
          {branches.map((branch) => (
            <option key={branch._id} value={branch._id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      <div className="list-table">
        <div className="list-table-format table-format title">
          <b>Table #</b>
          <b>Capacity</b>
          <b>Status</b>
          <b>QR Link</b>
          <b>Action</b>
        </div>
        {tables.map((item, index) => (
          <div key={index} className="list-table-format table-format">
            <p>{item.tableNumber}</p>
            <p>{item.capacity}</p>
            <p className={`status-${item.status.toLowerCase()}`}>{item.status}</p>
            <button className="qr-btn" onClick={() => copyQRLink(item)}>
              Copy QR Link
            </button>
            <p onClick={() => removeTable(item._id)} className="cursor remove-btn">
              Remove
            </p>
          </div>
        ))}
        {tables.length === 0 && (
          <p className="empty-message">
            {branches.length === 0 
              ? "No branches available. Please add a branch first." 
              : "No tables for this branch. Add one to get started."}
          </p>
        )}
      </div>
    </div>
  );
};

export default TableList;
