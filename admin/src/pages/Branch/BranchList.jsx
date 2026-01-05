import React, { useEffect, useState, useContext } from "react";
import "./Branch.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const BranchList = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [branches, setBranches] = useState([]);

  const fetchBranches = async () => {
    const response = await axios.get(`${url}/api/branch/list`);
    if (response.data.success) {
      setBranches(response.data.data);
    } else {
      toast.error("Error fetching branches");
    }
  };

  const removeBranch = async (branchId) => {
    const response = await axios.post(
      `${url}/api/branch/remove`,
      { id: branchId },
      { headers: { token } }
    );
    await fetchBranches();
    if (response.data.success) {
      toast.success(response.data.message);
    } else {
      toast.error(response.data.message);
    }
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
    }
    fetchBranches();
  }, []);

  return (
    <div className="list add flex-col">
      <div className="list-header">
        <p>All Branches</p>
        <button onClick={() => navigate("/branches/add")} className="add-btn">
          + Add Branch
        </button>
      </div>
      <div className="list-table">
        <div className="list-table-format branch-format title">
          <b>Name</b>
          <b>Address</b>
          <b>Phone</b>
          <b>Status</b>
          <b>Action</b>
        </div>
        {branches.map((item, index) => (
          <div key={index} className="list-table-format branch-format">
            <p>{item.name}</p>
            <p>{item.address}</p>
            <p>{item.phone || "-"}</p>
            <p className={item.isActive ? "active" : "inactive"}>
              {item.isActive ? "Active" : "Inactive"}
            </p>
            <p onClick={() => removeBranch(item._id)} className="cursor remove-btn">
              Remove
            </p>
          </div>
        ))}
        {branches.length === 0 && (
          <p className="empty-message">No branches found. Add one to get started.</p>
        )}
      </div>
    </div>
  );
};

export default BranchList;
