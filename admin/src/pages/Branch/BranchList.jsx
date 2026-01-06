import React, { useEffect, useState, useContext } from "react";
import "./Branch.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";

const BranchList = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [branches, setBranches] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, type: null, id: null, data: null });

  const fetchBranches = async () => {
    const response = await axios.get(`${url}/api/branch/list`);
    if (response.data.success) {
      setBranches(response.data.data);
    } else {
      toast.error("Error fetching branches");
    }
  };

  const handleUpdateStatus = async (branchId, currentStatus) => {
    const response = await axios.put(
      `${url}/api/branch/update/${branchId}`,
      { isActive: !currentStatus },
      { headers: { token } }
    );
    if (response.data.success) {
      toast.success(response.data.message);
      fetchBranches();
    } else {
      toast.error("Error updating status");
    }
  };

  const handleRemoveBranch = async (branchId) => {
    const response = await axios.post(
      `${url}/api/branch/remove`,
      { id: branchId },
      { headers: { token } }
    );
    if (response.data.success) {
      toast.success(response.data.message);
      fetchBranches();
    } else {
      toast.error(response.data.message);
    }
  };

  const confirmAction = () => {
    if (modal.type === "delete") {
      handleRemoveBranch(modal.id);
    } else if (modal.type === "toggle") {
      handleUpdateStatus(modal.id, modal.data.isActive);
    }
    closeModal();
  };

  const openDeleteModal = (id) => {
    setModal({
      isOpen: true,
      type: "delete",
      id: id,
      title: "Xác nhận xóa",
      message: "Bạn có chắc chắn muốn xóa chi nhánh này không? Hành động này không thể hoàn tác.",
    });
  };

  const openToggleModal = (item) => {
    setModal({
      isOpen: true,
      type: "toggle",
      id: item._id,
      data: item,
      title: item.isActive ? "Tạm đóng chi nhánh" : "Mở lại chi nhánh",
      message: `Bạn có chắc muốn ${item.isActive ? "tạm đóng" : "mở hoạt động lại"} chi nhánh "${item.name}" không?`,
    });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: null, id: null, data: null });
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
          <b>Tỉ lệ lấp đầy</b>
          <b>Hành Động</b>
        </div>
        {branches.map((item, index) => (
          <div key={index} className="list-table-format branch-format">
            <p>{item.name}</p>
            <p>{item.address}</p>
            <p>{item.phone || "-"}</p>
            <div className="occupancy-info">
              {item.isActive ? (
                <>
                   <span className="occupancy-text">{item.occupancyRate || 0}%</span>
                   <div className="branch-progress-bar">
                      <div 
                         style={{ 
                             width: `${item.occupancyRate || 0}%`, 
                             background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)' 
                         }} 
                      ></div>
                   </div>
                </>
              ) : (
                <span className="inactive-text">Ngưng hoạt động</span>
              )}
            </div>
            <div className="action-buttons">
              <p 
                onClick={() => openToggleModal(item)} 
                className={`cursor status-action-btn ${item.isActive ? 'close-action' : 'open-action'}`}
              >
                {item.isActive ? "Tạm đóng" : "Mở lại"}
              </p>
              <p onClick={() => openDeleteModal(item._id)} className="cursor remove-btn">
                Xóa
              </p>
            </div>
          </div>
        ))}
        {branches.length === 0 && (
          <p className="empty-message">Chưa có chi nhánh nào. Vui lòng thêm chi nhánh mới.</p>
        )}
      </div>
      
      <ConfirmModal 
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={confirmAction}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
};

export default BranchList;
