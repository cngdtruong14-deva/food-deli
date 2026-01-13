import React, { useEffect, useState, useContext, useMemo } from "react";
import "./Table.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";

const TableList = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [tables, setTables] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // "all", "Available", "Occupied", "Reserved"
  const [modal, setModal] = useState({ isOpen: false, type: null, id: null });

  const fetchBranches = async () => {
    const response = await axios.get(`${url}/api/branch/list`);
    if (response.data.success) {
      setBranches(response.data.data);
      if (response.data.data.length > 0 && !selectedBranch) {
        setSelectedBranch(response.data.data[0]._id);
      }
    } else {
      toast.error("Error fetching branches");
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
    if (response.data.success) {
      toast.success("Bàn đã được xóa");
      fetchTables(selectedBranch);
    } else {
      toast.error("Lỗi xóa bàn");
    }
  };

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      const response = await axios.put(
        `${url}/api/table/status/${tableId}`,
        { status: newStatus },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Trạng thái đã được cập nhật");
        fetchTables(selectedBranch);
      } else {
        toast.error("Lỗi cập nhật trạng thái");
      }
    } catch (error) {
      toast.error("Lỗi server");
    }
  };

  const handleConfirmDelete = () => {
      if(modal.id) {
          removeTable(modal.id);
      }
      closeModal();
  };

  const openDeleteModal = (id) => {
      setModal({
          isOpen: true,
          type: 'delete',
          id: id,
          title: "Xác nhận xóa",
          message: "Bạn có chắc chắn muốn xóa bàn này không? Hành động này không thể hoàn tác."
      });
  };

  const closeModal = () => {
      setModal({ isOpen: false, type: null, id: null });
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Vui lòng đăng nhập");
      navigate("/");
    }
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchTables(selectedBranch);
    }
  }, [selectedBranch]);

  const filteredTables = useMemo(() => {
    if (filterStatus === "all") return tables;
    return tables.filter((table) => table.status === filterStatus);
  }, [tables, filterStatus]);

  // Calculate occupancy rate
  const calculateOccupancyRate = () => {
    if (tables.length === 0) return 0;
    const occupiedTables = tables.filter(
      (table) => table.status !== "Available"
    ).length;
    return Math.round((occupiedTables / tables.length) * 100);
  };

  const occupancyRate = calculateOccupancyRate();

  const getOccupancyClass = (rate) => {
    if (rate <= 30) return "occupancy-low";
    if (rate <= 70) return "occupancy-medium";
    if (rate <= 90) return "occupancy-high";
    return "occupancy-very-high";
  };

  const copyQRLink = (table) => {
    // Determine Client URL
    // Ideally this comes from an env var, but for now we can infer or fallback
    // If the admin is on the same domain/port as client (unlikely in dev, possible in prod if served together)
    // fallback to a prompt or standard port 5173
    const clientPort = '5173';
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // Construct base URL - adjust port if we are in dev (usually admin 5174, client 5173)
    const baseUrl = `${protocol}//${hostname}:${clientPort}`; // Default to dev standard
    
    const link = `${baseUrl}/menu?tableId=${table._id}&branchId=${table.branchId._id || table.branchId}`;
    navigator.clipboard.writeText(link);
    toast.success("QR Link copied to clipboard!");
  };

  return (
    <div className="list add flex-col">
      <div className="list-header">
        <p>Quản Lý Bàn Ăn</p>
        <button onClick={() => navigate("/tables/add")} className="add-btn">
          + Thêm Bàn
        </button>
      </div>

      <div className="branch-filter-wrapper">
        <div className="branch-filter">
          <label>Chọn Chi Nhánh: </label>
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
        
        <div className="table-status-filter">
          <label>Trạng Thái:</label>
          <div className="status-filter-buttons">
            <button
              className={`status-filter-btn ${filterStatus === "all" ? "active" : ""}`}
              onClick={() => setFilterStatus("all")}
            >
              Tất cả
            </button>
            <button
              className={`status-filter-btn ${filterStatus === "Available" ? "active" : ""}`}
              onClick={() => setFilterStatus("Available")}
            >
              Trống ({tables.filter(t => t.status === "Available").length})
            </button>
            <button
              className={`status-filter-btn ${filterStatus === "Occupied" ? "active" : ""}`}
              onClick={() => setFilterStatus("Occupied")}
            >
              Đang sử dụng ({tables.filter(t => t.status === "Occupied").length})
            </button>
            <button
              className={`status-filter-btn ${filterStatus === "Reserved" ? "active" : ""}`}
              onClick={() => setFilterStatus("Reserved")}
            >
              Đã đặt ({tables.filter(t => t.status === "Reserved").length})
            </button>
          </div>
        </div>

        {tables.length > 0 && (
          <div className="occupancy-indicator">
            <div className="occupancy-label">
              <span>Tỉ lệ lấp đầy:</span>
              <span className="occupancy-percentage">{occupancyRate}%</span>
            </div>
            <div className="occupancy-progress-bar">
              <div
                className={`occupancy-progress-fill ${getOccupancyClass(occupancyRate)}`}
                style={{ width: `${occupancyRate}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="list-table">
        <div className="list-table-format table-format title">
          <b>Số Bàn</b>
          <b>Sức Chứa</b>
          <b>Trạng Thái</b>
          <b>QR Code</b>
          <b>Hành Động</b>
        </div>
        {filteredTables.map((item, index) => (
          <div key={index} className="list-table-format table-format">
            <p>{item.tableNumber}</p>
            <p>{item.capacity} người</p>
            <select
              value={item.status}
              onChange={(e) => handleStatusChange(item._id, e.target.value)}
              className={`status-select status-${item.status.toLowerCase()}`}
            >
              <option value="Available">Trống</option>
              <option value="Occupied">Đang sử dụng</option>
              <option value="Reserved">Đã đặt</option>
            </select>
            <button className="qr-btn" onClick={() => copyQRLink(item)}>
              Sao Chép Link QR
            </button>
            <p onClick={() => openDeleteModal(item._id)} className="cursor remove-btn">
              Xóa
            </p>
          </div>
        ))}
         {tables.length === 0 && (
          <p className="empty-message">
            {branches.length === 0 
              ? "Chưa có chi nhánh nào. Vui lòng thêm chi nhánh trước." 
              : "Chi nhánh này chưa có bàn nào. Vui lòng thêm bàn mới."}
          </p>
        )}
      </div>

      <ConfirmModal 
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirmDelete}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
};

export default TableList;
