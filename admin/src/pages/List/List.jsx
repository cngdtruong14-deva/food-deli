import React, { useEffect, useState, useMemo } from "react";
import "./List.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import EditFoodModal from "../../components/EditFoodModal/EditFoodModal";

const List = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [list, setList] = useState([]);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [stockFilter, setStockFilter] = useState("all");

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list`);
    if (response.data.success) {
      setList(response.data.data);
    } else {
      toast.error("Lỗi tải danh sách");
    }
  };

  // Modal state
  const [modal, setModal] = useState({ isOpen: false, id: null });
  // Edit modal state
  const [editModal, setEditModal] = useState({ isOpen: false, item: null });

  const confirmRemove = async () => {
    if (modal.id) {
      await removeFood(modal.id);
    }
    closeModal();
  };

  const openRemoveModal = (id) => {
    setModal({ isOpen: true, id: id });
  };

  const closeModal = () => {
    setModal({ isOpen: false, id: null });
  };
  
  const openEditModal = (item) => {
      setEditModal({ isOpen: true, item: item });
  };

  const closeEditModal = () => {
      setEditModal({ isOpen: false, item: null });
  };
  
  const onUpdateSuccess = () => {
      fetchList(); // Refresh list after edit
  };
  
  const removeFood = async (foodId) => {
    const response = await axios.post(
      `${url}/api/food/remove`,
      { id: foodId },
      { headers: { token } }
    );
    await fetchList();
    if (response.data.success) {
      toast.success("Đã chuyển món vào thùng rác");
    } else {
      toast.error("Có lỗi xảy ra");
    }
  };

  // Filter and group items
  const filteredAndGroupedList = useMemo(() => {
    // ... (keep existing logic)
    let filtered = [...list];

    // Apply stock filter
    if (stockFilter === "in-stock") {
      filtered = filtered.filter((item) => (item.stock || 100) > 20);
    } else if (stockFilter === "low-stock") {
      filtered = filtered.filter((item) => {
        const stock = item.stock || 100;
        return stock > 0 && stock <= 20;
      });
    } else if (stockFilter === "out-of-stock") {
      filtered = filtered.filter((item) => (item.stock || 100) === 0);
    }

    // Sort filtered list by name alphabetically
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    // Group by category if enabled
    if (groupByCategory) {
      const grouped = {};
      filtered.forEach((item) => {
        const category = item.category || "Khác";
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(item);
      });
      return grouped;
    }

    return filtered;
  }, [list, groupByCategory, stockFilter]);

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Vui lòng đăng nhập trước");
      navigate("/");
    }
    fetchList();
  }, []);

  const renderFoodItem = (item, index) => (
    <div key={item._id || index} className="list-table-format">
      <img src={`${url}/images/` + item.image} alt={item.name} />
      <p>{item.name}</p>
      <p>{item.category}</p>
      <p>{item.price.toLocaleString('vi-VN')} đ</p>
      <p className={getStockClass(item.stock || 100)}>{item.stock || 100}</p>
      <div className="action-buttons">
          <p onClick={() => openEditModal(item)} className="cursor edit-btn-text">Sửa</p>
          <p onClick={() => openRemoveModal(item._id)} className="cursor remove-btn">Xóa</p>
      </div>
    </div>
  );

  const getStockClass = (stock) => {
    if (stock === 0) return "stock-out";
    if (stock <= 20) return "stock-low";
    return "stock-ok";
  };

  return (
    <div className="list add flex-col">
      <div className="list-header">
        <p>Danh sách món ăn ({list.length} món)</p>
        <div className="list-controls">
          <div className="list-filter-group">
            <label htmlFor="stock-filter">Lọc tồn kho:</label>
            <select
              id="stock-filter"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả</option>
              <option value="in-stock">Còn hàng (&gt;20)</option>
              <option value="low-stock">Sắp hết (1-20)</option>
              <option value="out-of-stock">Hết hàng (0)</option>
            </select>
          </div>
          <button
            onClick={() => setGroupByCategory(!groupByCategory)}
            className={`toggle-group-btn ${groupByCategory ? 'active' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            {groupByCategory ? 'Hiển thị thường' : 'Chia theo danh mục'}
          </button>
        </div>
      </div>

      {groupByCategory ? (
        // Grouped view by category
        <div className="list-grouped">
          {Object.keys(filteredAndGroupedList).sort().map((category) => (
            <div key={category} className="category-group">
              <div className="category-header">
                <h3>{category}</h3>
                <span className="category-count">{filteredAndGroupedList[category].length} món</span>
              </div>
              <div className="list-table">
                <div className="list-table-format title">
                  <b>Hình ảnh</b>
                  <b>Tên món</b>
                  <b>Danh mục</b>
                  <b>Giá</b>
                  <b>Tồn kho</b>
                  <b>Thao tác</b>
                </div>
                {filteredAndGroupedList[category].map((item, index) =>
                  renderFoodItem(item, index)
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Normal table view
        <div className="list-table">
          <div className="list-table-format title">
            <b>Hình ảnh</b>
            <b>Tên món</b>
            <b>Danh mục</b>
            <b>Giá</b>
            <b>Tồn kho</b>
            <b>Thao tác</b>
          </div>
          {Array.isArray(filteredAndGroupedList) && filteredAndGroupedList.length > 0 ? (
            filteredAndGroupedList.map((item, index) => renderFoodItem(item, index))
          ) : (
            <div className="empty-message">
              {stockFilter !== "all" 
                ? "Không có món ăn nào phù hợp với bộ lọc." 
                : "Chưa có món ăn nào."}
            </div>
          )}
        </div>
      )}

      <ConfirmModal 
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={confirmRemove}
        title="Xác nhận xóa"
        message="Bạn có chắc muốn chuyển món ăn này vào thùng rác không?"
      />
      
      <EditFoodModal
        isOpen={editModal.isOpen}
        item={editModal.item}
        onClose={closeEditModal}
        url={url}
        onUpdate={onUpdateSuccess}
      />
    </div>
  );
};

export default List;
