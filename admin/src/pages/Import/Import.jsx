import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Import.css';
import { FaPlus, FaEdit, FaTruck, FaClipboardList, FaCheck, FaTimes, FaSearch, FaBoxOpen, FaSpinner } from 'react-icons/fa';
import PropTypes from 'prop-types';

const Import = ({ url }) => {
  // Tab State
  const [activeTab, setActiveTab] = useState('receipts'); // 'receipts' | 'suppliers' | 'create'
  
  // Data State
  const [suppliers, setSuppliers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [branches, setBranches] = useState([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Supplier Modal State
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '', contactPerson: '', phone: '', email: '', address: '', category: 'OTHER'
  });
  
  // Receipt Form State
  const [receiptForm, setReceiptForm] = useState({
    supplierId: '',
    branchId: 'null',
    notes: '',
    items: []
  });
  
  // New Item Row State
  const [newItem, setNewItem] = useState({ ingredientId: '', quantity: 0, pricePerUnit: 0 });

  const supplierCategories = [
    { value: 'MEAT', label: 'Thịt/Cá' },
    { value: 'VEG', label: 'Rau Củ' },
    { value: 'DRY', label: 'Khô/Đóng hộp' },
    { value: 'PACKAGING', label: 'Bao bì' },
    { value: 'OTHER', label: 'Khác' }
  ];

  // Helper: Get userId from localStorage or decode from JWT token
  const getUserId = () => {
    let userId = localStorage.getItem('userId');
    if (!userId || userId === 'null' || userId === 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.id;
        } catch (err) {
          console.error('Failed to decode token:', err);
        }
      }
    }
    return userId;
  };

  // =========================================
  // DATA FETCHING
  // =========================================
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = getUserId();
      const [suppRes, recRes, ingRes, branchRes] = await Promise.all([
        axios.get(`${url}/api/import/suppliers`),
        axios.get(`${url}/api/import/receipts?status=${statusFilter}`),
        axios.get(`${url}/api/ingredient/list?userId=${userId}`),
        axios.get(`${url}/api/branch/list?userId=${userId}`)
      ]);
      
      if (suppRes.data.success) setSuppliers(suppRes.data.data);
      if (recRes.data.success) setReceipts(recRes.data.data);
      if (ingRes.data.success) setIngredients(ingRes.data.data);
      if (branchRes.data.success) setBranches(branchRes.data.data);
    } catch (error) {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [url, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =========================================
  // SUPPLIER HANDLERS
  // =========================================
  const resetSupplierForm = () => {
    setSupplierForm({ name: '', contactPerson: '', phone: '', email: '', address: '', category: 'OTHER' });
    setEditingSupplier(null);
  };

  const openAddSupplier = () => {
    resetSupplierForm();
    setShowSupplierModal(true);
  };

  const openEditSupplier = (supplier) => {
    setSupplierForm(supplier);
    setEditingSupplier(supplier._id);
    setShowSupplierModal(true);
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = getUserId();
      const payload = { ...supplierForm, userId };
      
      let response;
      if (editingSupplier) {
        response = await axios.put(`${url}/api/import/suppliers/${editingSupplier}`, payload);
      } else {
        response = await axios.post(`${url}/api/import/suppliers`, payload);
      }
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowSupplierModal(false);
        fetchData();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Lỗi lưu NCC');
    }
  };

  // =========================================
  // RECEIPT HANDLERS
  // =========================================
  const resetReceiptForm = () => {
    setReceiptForm({ supplierId: '', branchId: 'null', notes: '', items: [] });
    setNewItem({ ingredientId: '', quantity: 0, pricePerUnit: 0 });
  };

  const openCreateReceipt = () => {
    resetReceiptForm();
    setActiveTab('create');
  };

  const addItemToReceipt = () => {
    if (!newItem.ingredientId || newItem.quantity <= 0 || newItem.pricePerUnit <= 0) {
      toast.warn('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    const ingredient = ingredients.find(i => i._id === newItem.ingredientId);
    setReceiptForm(prev => ({
      ...prev,
      items: [...prev.items, {
        ingredientId: newItem.ingredientId,
        ingredientName: ingredient?.name || 'N/A',
        unit: ingredient?.unit || 'kg',
        quantity: parseFloat(newItem.quantity),
        pricePerUnit: parseFloat(newItem.pricePerUnit),
        total: parseFloat(newItem.quantity) * parseFloat(newItem.pricePerUnit)
      }]
    }));
    setNewItem({ ingredientId: '', quantity: 0, pricePerUnit: 0 });
  };

  const removeItemFromReceipt = (index) => {
    setReceiptForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return receiptForm.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleReceiptSubmit = async (complete = false) => {
    if (!receiptForm.supplierId || receiptForm.items.length === 0) {
      toast.warn('Vui lòng chọn NCC và thêm ít nhất 1 nguyên liệu');
      return;
    }
    
    try {
      const userId = getUserId();
      
      // Create receipt (PENDING)
      const createRes = await axios.post(`${url}/api/import/receipts`, {
        ...receiptForm,
        userId
      });
      
      if (!createRes.data.success) {
        toast.error(createRes.data.message);
        return;
      }
      
      const receiptId = createRes.data.data._id;
      
      if (complete) {
        // Complete immediately
        const completeRes = await axios.post(`${url}/api/import/receipts/${receiptId}/complete`, { userId });
        if (completeRes.data.success) {
          toast.success(completeRes.data.message);
        } else {
          toast.error(completeRes.data.message);
        }
      } else {
        toast.success(createRes.data.message);
      }
      
      resetReceiptForm();
      setActiveTab('receipts');
      fetchData();
    } catch (error) {
      toast.error('Lỗi tạo phiếu nhập');
    }
  };

  const completeReceipt = async (id) => {
    try {
      const userId = getUserId();
      const response = await axios.post(`${url}/api/import/receipts/${id}/complete`, { userId });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchData();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Lỗi hoàn thành phiếu');
    }
  };

  const cancelReceipt = async (id) => {
    try {
      const userId = getUserId();
      const response = await axios.post(`${url}/api/import/receipts/${id}/cancel`, { 
        userId, 
        reason: 'Hủy bởi người dùng' 
      });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchData();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Lỗi hủy phiếu');
    }
  };

  // =========================================
  // FILTERING
  // =========================================
  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReceipts = receipts.filter(r => 
    r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // =========================================
  // HELPERS
  // =========================================
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': { label: 'Chờ duyệt', className: 'pending' },
      'COMPLETED': { label: 'Hoàn thành', className: 'completed' },
      'CANCELLED': { label: 'Đã hủy', className: 'cancelled' }
    };
    return badges[status] || { label: status, className: '' };
  };

  const getCategoryLabel = (cat) => {
    return supplierCategories.find(c => c.value === cat)?.label || cat;
  };

  // =========================================
  // RENDER
  // =========================================
  return (
    <div className="import-page">
      <div className="import-header">
        <h1><FaTruck /> Nhập Hàng</h1>
        <p>Quản lý nhà cung cấp và phiếu nhập kho</p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'receipts' ? 'active' : ''}`}
          onClick={() => setActiveTab('receipts')}
        >
          <FaClipboardList /> Phiếu Nhập Kho
        </button>
        <button 
          className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          <FaTruck /> Nhà Cung Cấp
        </button>
        <button 
          className={`tab-btn create ${activeTab === 'create' ? 'active' : ''}`}
          onClick={openCreateReceipt}
        >
          <FaPlus /> Tạo Phiếu Mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {activeTab === 'receipts' && (
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        )}

        {activeTab === 'suppliers' && (
          <button className="add-btn" onClick={openAddSupplier}>
            <FaPlus /> Thêm NCC
          </button>
        )}
      </div>

      {/* Content */}
      <div className="import-content">
        {isLoading && (
          <div className="loading-overlay">
            <FaSpinner className="loading-spinner" />
            <span>Đang tải...</span>
          </div>
        )}

        {/* Receipts Tab */}
        {activeTab === 'receipts' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Phiếu</th>
                <th>Nhà Cung Cấp</th>
                <th>Ngày Tạo</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map(r => (
                  <tr key={r._id}>
                    <td><strong>{r.code}</strong></td>
                    <td>{r.supplier?.name}</td>
                    <td>{formatDate(r.createdAt)}</td>
                    <td className="amount">{formatMoney(r.totalAmount)}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(r.status).className}`}>
                        {getStatusBadge(r.status).label}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {r.status === 'PENDING' && (
                          <>
                            <button className="action-btn complete" onClick={() => completeReceipt(r._id)} title="Hoàn thành">
                              <FaCheck />
                            </button>
                            <button className="action-btn cancel" onClick={() => cancelReceipt(r._id)} title="Hủy">
                              <FaTimes />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <FaBoxOpen className="empty-icon" />
                    <p>Chưa có phiếu nhập</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên NCC</th>
                <th>Danh Mục</th>
                <th>Liên Hệ</th>
                <th>SĐT</th>
                <th>Địa Chỉ</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map(s => (
                  <tr key={s._id}>
                    <td><strong>{s.name}</strong></td>
                    <td><span className={`category-tag ${s.category.toLowerCase()}`}>{getCategoryLabel(s.category)}</span></td>
                    <td>{s.contactPerson}</td>
                    <td>{s.phone}</td>
                    <td>{s.address}</td>
                    <td>
                      <button className="action-btn edit" onClick={() => openEditSupplier(s)}>
                        <FaEdit />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <FaBoxOpen className="empty-icon" />
                    <p>Chưa có nhà cung cấp</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Create Receipt Tab */}
        {activeTab === 'create' && (
          <div className="create-receipt-form">
            <h2>Tạo Phiếu Nhập Kho Mới</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nhà Cung Cấp *</label>
                <select 
                  value={receiptForm.supplierId}
                  onChange={(e) => setReceiptForm({...receiptForm, supplierId: e.target.value})}
                  required
                >
                  <option value="">-- Chọn NCC --</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Nhập Về Kho</label>
                <select 
                  value={receiptForm.branchId}
                  onChange={(e) => setReceiptForm({...receiptForm, branchId: e.target.value})}
                >
                  <option value="null">Kho Tổng (Central)</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Ghi chú</label>
              <textarea 
                value={receiptForm.notes}
                onChange={(e) => setReceiptForm({...receiptForm, notes: e.target.value})}
                rows={2}
                placeholder="Ghi chú (nếu có)"
              />
            </div>

            {/* Add Item Row */}
            <div className="add-item-row">
              <select 
                value={newItem.ingredientId}
                onChange={(e) => setNewItem({...newItem, ingredientId: e.target.value})}
              >
                <option value="">-- Chọn nguyên liệu --</option>
                {ingredients.map(i => <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>)}
              </select>
              <input 
                type="number" 
                placeholder="Số lượng"
                value={newItem.quantity || ''}
                onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                min="0.1"
                step="0.1"
              />
              <input 
                type="number" 
                placeholder="Đơn giá"
                value={newItem.pricePerUnit || ''}
                onChange={(e) => setNewItem({...newItem, pricePerUnit: e.target.value})}
                min="0"
              />
              <button type="button" className="add-item-btn" onClick={addItemToReceipt}>
                <FaPlus /> Thêm
              </button>
            </div>

            {/* Items Table */}
            {receiptForm.items.length > 0 && (
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Nguyên Liệu</th>
                    <th>ĐVT</th>
                    <th>SL</th>
                    <th>Đơn Giá</th>
                    <th>Thành Tiền</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {receiptForm.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.ingredientName}</td>
                      <td>{item.unit}</td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.pricePerUnit)}</td>
                      <td className="amount">{formatMoney(item.total)}</td>
                      <td>
                        <button className="remove-item-btn" onClick={() => removeItemFromReceipt(idx)}>
                          <FaTimes />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="4" style={{textAlign: 'right', fontWeight: 'bold'}}>TỔNG CỘNG:</td>
                    <td className="amount grand-total">{formatMoney(calculateTotal())}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Actions */}
            <div className="receipt-actions">
              <button type="button" className="btn-secondary" onClick={() => setActiveTab('receipts')}>
                Hủy
              </button>
              <button type="button" className="btn-draft" onClick={() => handleReceiptSubmit(false)}>
                Lưu Nháp
              </button>
              <button type="button" className="btn-primary" onClick={() => handleReceiptSubmit(true)}>
                <FaCheck /> Nhập Kho
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="modal-overlay" onClick={() => setShowSupplierModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSupplier ? 'Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp'}</h3>
              <button className="close-modal" onClick={() => setShowSupplierModal(false)}>×</button>
            </div>
            <form onSubmit={handleSupplierSubmit}>
              <div className="form-group">
                <label>Tên NCC *</label>
                <input 
                  type="text" 
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Người liên hệ</label>
                  <input 
                    type="text" 
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({...supplierForm, contactPerson: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input 
                    type="tel" 
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input 
                  type="text" 
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Danh mục</label>
                <select 
                  value={supplierForm.category}
                  onChange={(e) => setSupplierForm({...supplierForm, category: e.target.value})}
                >
                  {supplierCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowSupplierModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

Import.propTypes = {
  url: PropTypes.string.isRequired
};

export default Import;
