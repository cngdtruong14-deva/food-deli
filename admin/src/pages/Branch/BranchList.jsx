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
      toast.error("Vui lòng đăng nhập");
      navigate("/");
    }
    fetchBranches();
  }, []);

  return (
    <div className="list add flex-col">
      <div className="list-header">
        <p>Hệ Thống Chi Nhánh</p>
        <button onClick={() => navigate("/branches/add")} className="add-btn">
          + Thêm Chi Nhánh
        </button>
      </div>
      <div className="list-table">
        <div className="list-table-format branch-format title">
          <b>Tên Chi Nhánh</b>
          <b>Địa Chỉ</b>
          <b>Số Điện Thoại</b>
          <b>Trạng Thái</b>
          <b>Hành Động</b>
        </div>
        {branches.map((item, index) => (
          <div key={index} className="list-table-format branch-format">
            <p>{item.name}</p>
            <p>{item.address}</p>
            <p>{item.phone || "-"}</p>
            <p className={item.isActive ? "active" : "inactive"}>
              {item.isActive ? "Hoạt động" : "Ngưng hoạt động"}
            </p>
            <p onClick={() => removeBranch(item._id)} className="cursor remove-btn">
              Xóa
            </p>
          </div>
        ))}
        {branches.length === 0 && (
          <p className="empty-message">Chưa có chi nhánh nào. Vui lòng thêm chi nhánh mới.</p>
        )}
      </div>
    </div>
  );
};

export default BranchList;
