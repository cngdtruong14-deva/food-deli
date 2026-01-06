import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Inventory.css';
import { FaPlus, FaTrash, FaEdit, FaExclamationTriangle, FaBoxOpen, FaSearch, FaFilter } from 'react-icons/fa';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const Inventory = ({ url }) => {
  const [ingredients, setIngredients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'good', 'out'
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [currentItem, setCurrentItem] = useState({
    name: '',
    category: 'Thịt',
    unit: 'kg',
    stock: 0,
    minStock: 5,
    costPrice: 0
  });

  const categories = ["Thịt", "Hải Sản", "Rau Củ", "Gia Vị", "Đồ Khô", "Đồ Uống", "Thực Phẩm Mát", "Khác"];
  const units = ["kg", "g", "lít", "ml", "bó", "quả", "lon", "chai", "gói", "con", "hộp"];

  const fetchIngredients = async () => {
    try {
      const response = await axios.get(`${url}/api/ingredient/list`);
      if (response.data.success) {
        setIngredients(response.data.data);
      } else {
        toast.error("Error fetching inventory");
      }
    } catch (error) {
      toast.error("Error fetching inventory");
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem({ ...currentItem, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (isEditing) {
        response = await axios.post(`${url}/api/ingredient/update`, { ...currentItem, id: currentItem._id });
      } else {
        response = await axios.post(`${url}/api/ingredient/add`, currentItem);
      }

      if (response.data.success) {
        toast.success(isEditing ? "Updated successfully" : "Added successfully");
        setShowModal(false);
        fetchIngredients();
        resetForm();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Error saving ingredient");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.post(`${url}/api/ingredient/remove`, { id });
      if (response.data.success) {
        toast.success("Đã xóa nguyên liệu thành công");
        fetchIngredients();
      } else {
        toast.error("Lỗi xóa nguyên liệu");
      }
    } catch (error) {
      toast.error("Lỗi xóa nguyên liệu");
    }
  };

  const openDeleteModal = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, id: null });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      handleDelete(deleteModal.id);
    }
    closeDeleteModal();
  };

  /* ... inside function component ... */
  const [scrollPos, setScrollPos] = useState(0);

  /* Update handleEdit */
  const handleEdit = (item) => {
    setScrollPos(window.scrollY);
    setCurrentItem(item);
    setIsEditing(true);
    setShowModal(true);
  };

  /* Update Add Button click handler is inline, need to be careful or extract it */
  const handleAddNew = () => {
    setScrollPos(window.scrollY);
    resetForm();
    setShowModal(true);
  };
  
  /* Logic & State Updates */
  const updateStock = async (id, newStock) => {
    if (newStock < 0) return;
    try {
      const response = await axios.post(`${url}/api/ingredient/update`, { id, stock: newStock });
      if (response.data.success) {
        setIngredients(ingredients.map(ing => ing._id === id ? { ...ing, stock: newStock } : ing));
      }
    } catch (error) {
      toast.error("Error updating stock");
    }
  };

  const resetForm = () => {
    setCurrentItem({
      name: '',
      category: 'Thịt',
      unit: 'kg',
      stock: 0,
      minStock: 5,
      costPrice: 0
    });
    setIsEditing(false);
  };

  const filteredIngredients = useMemo(() => {
    let filtered = [...ingredients];
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    if (stockFilter === 'low') {
      filtered = filtered.filter(item => item.stock <= item.minStock && item.stock > 0);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(item => item.stock === 0);
    } else if (stockFilter === 'good') {
      filtered = filtered.filter(item => item.stock > item.minStock);
    }
    return filtered;
  }, [ingredients, searchQuery, categoryFilter, stockFilter]);

  const lowStockCount = ingredients.filter(i => i.stock <= i.minStock && i.stock > 0).length;
  const outOfStockCount = ingredients.filter(i => i.stock === 0).length;
  const totalItems = ingredients.length;
  const totalValue = ingredients.reduce((sum, item) => sum + (item.stock * (item.costPrice || 0)), 0);

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <div className="inventory-header-content">
          <h2>Kho Nguyên Liệu</h2>
          <p className="inventory-subtitle">Quản lý nhập xuất tồn kho</p>
        </div>
        <button className="btn-add-inventory" onClick={handleAddNew}>
          <FaPlus /> Thêm Mới
        </button>
      </div>

      <div className="inventory-stats">
        <div className="stat-card stat-total">
          <div className="stat-icon-container stat-icon-total">
            <FaBoxOpen />
          </div>
          <div className="stat-info">
            <div className="stat-label">Tổng số loại</div>
            <div className="stat-value">{totalItems}</div>
          </div>
        </div>
        <div className={`stat-card stat-warning ${lowStockCount > 0 ? 'warning-active' : ''}`}>
          <div className="stat-icon-container stat-icon-warning">
            <FaExclamationTriangle />
          </div>
          <div className="stat-info">
            <div className="stat-label">Sắp hết</div>
            <div className="stat-value">{lowStockCount}</div>
          </div>
        </div>
        <div className={`stat-card stat-danger ${outOfStockCount > 0 ? 'danger-active' : ''}`}>
          <div className="stat-icon-container stat-icon-danger">
            <FaExclamationTriangle />
          </div>
          <div className="stat-info">
            <div className="stat-label">Hết hàng</div>
            <div className="stat-value">{outOfStockCount}</div>
          </div>
        </div>
        <div className="stat-card stat-value">
          <div className="stat-icon-container stat-icon-value">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-label">Tổng giá trị</div>
            <div className="stat-value">{totalValue.toLocaleString('vi-VN')} đ</div>
          </div>
        </div>
      </div>

      <div className="inventory-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm nguyên liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <label>Danh mục:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Trạng thái:</label>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả</option>
            <option value="good">Đủ hàng</option>
            <option value="low">Sắp hết</option>
            <option value="out">Hết hàng</option>
          </select>
        </div>
      </div>

      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Tên Nguyên Liệu</th>
              <th>Danh Mục</th>
              <th>Đơn Vị</th>
              <th>Tồn Kho</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.length > 0 ? (
              filteredIngredients.map((item) => (
                <tr key={item._id} className="inventory-row">
                  <td>
                    <strong className="ingredient-name">{item.name}</strong>
                  </td>
                  <td>
                    <span className="category-tag">{item.category}</span>
                  </td>
                  <td>{item.unit}</td>
                  <td>
                    <div className="stock-control">
                      <button 
                        className="stock-btn stock-btn-decrease" 
                        onClick={() => updateStock(item._id, Math.max(0, item.stock - 1))}
                        disabled={item.stock === 0}
                        aria-label="Giảm số lượng"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>
                      <span className="stock-value">{item.stock}</span>
                      <button 
                        className="stock-btn stock-btn-increase" 
                        onClick={() => updateStock(item._id, item.stock + 1)}
                        aria-label="Tăng số lượng"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className={`stock-badge ${item.stock === 0 ? 'out' : item.stock <= item.minStock ? 'low' : 'good'}`}>
                      {item.stock === 0 ? 'Hết hàng' : item.stock <= item.minStock ? 'Sắp hết' : 'Đủ hàng'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn edit" 
                        onClick={() => handleEdit(item)}
                        aria-label="Chỉnh sửa"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="action-btn delete" 
                        onClick={() => openDeleteModal(item._id)}
                        aria-label="Xóa"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-state">
                  <div className="empty-message">
                    <FaBoxOpen className="empty-icon" />
                    <p>Không tìm thấy nguyên liệu nào</p>
                    {(searchQuery || categoryFilter !== 'all' || stockFilter !== 'all') && (
                      <button 
                        className="clear-filters-btn"
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('all');
                          setStockFilter('all');
                        }}
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div 
          className="modal-overlay" 
          style={{ 
            position: 'absolute', 
            top: `${scrollPos}px`, 
            left: 0, 
            width: '100%', 
            height: '100vh', 
            alignItems: 'flex-start',
            paddingTop: '50px',
            backgroundColor: 'transparent', // Remove dark background
            backdropFilter: 'none', // Remove blur
            WebkitBackdropFilter: 'none',
            pointerEvents: 'none' // Allow clicking through the empty space
          }}
        >
          <div className="modal-content page-fade-in" style={{ pointerEvents: 'auto' }}>
            <div className="modal-header">
              <h3>{isEditing ? 'Cập nhật nguyên liệu' : 'Thêm nguyên liệu mới'}</h3>
              <button className="close-modal" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên nguyên liệu</label>
                <input type="text" name="name" value={currentItem.name} onChange={handleInputChange} required />
              </div>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Danh mục</label>
                  <select name="category" value={currentItem.category} onChange={handleInputChange}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Đơn vị tính</label>
                  <select name="unit" value={currentItem.unit} onChange={handleInputChange}>
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Số lượng tồn</label>
                  <input type="number" name="stock" value={currentItem.stock} onChange={handleInputChange} min="0" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Cảnh báo tối thiểu</label>
                  <input type="number" name="minStock" value={currentItem.minStock} onChange={handleInputChange} min="0" />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa nguyên liệu này không? Hành động này không thể hoàn tác."
      />
    </div>
  );
};

import PropTypes from 'prop-types';
Inventory.propTypes = {
  url: PropTypes.string.isRequired
};

export default Inventory;
