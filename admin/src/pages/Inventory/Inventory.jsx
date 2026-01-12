import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Inventory.css';
import { FaPlus, FaTrash, FaEdit, FaExclamationTriangle, FaBoxOpen, FaSearch, FaChartLine, FaMoneyBillWave, FaWarehouse, FaTruck, FaSort, FaSortUp, FaSortDown, FaSpinner, FaFileExport, FaChevronLeft, FaChevronRight, FaHistory, FaClipboardCheck, FaTimesCircle } from 'react-icons/fa';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import PropTypes from 'prop-types';

const Inventory = ({ url }) => {
  const [ingredients, setIngredients] = useState([]);
  const [foods, setFoods] = useState([]);
  const [branches, setBranches] = useState([]);
  const [activeTab, setActiveTab] = useState('warehouse'); // 'warehouse' | 'profit'
  const [currentBranchId, setCurrentBranchId] = useState('null'); // 'null' = Central Warehouse
  
  // User Role State
  const [userRole, setUserRole] = useState('admin');
  // eslint-disable-next-line no-unused-vars
  const [_userBranchId, setUserBranchId] = useState(null);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Auto Refresh State
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Warehouse State
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
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

  const [transferData, setTransferData] = useState({
      ingredientId: '',
      toBranch: '',
      quantity: 0
  });

  // Advanced Inventory Operations State
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [wasteData, setWasteData] = useState({ stockId: '', ingredientId: '', ingredientName: '', quantity: 0, reason: 'Hư hỏng' });
  const [isAuditMode, setIsAuditMode] = useState(false);
  const [auditChanges, setAuditChanges] = useState({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const wasteReasons = ['Hư hỏng', 'Hết hạn', 'Rơi vỡ', 'Khác'];



  const categories = ["Thịt", "Hải Sản", "Rau Củ", "Gia Vị", "Đồ Khô", "Đồ Uống", "Thực Phẩm Mát", "Khác"];
  const units = ["kg", "g", "lít", "ml", "bó", "quả", "lon", "chai", "gói", "con", "hộp"];

  // Fetch User Profile to determine Scope
  useEffect(() => {
      const fetchProfile = async () => {
          try {
              // Assuming token is in localStorage and axios interceptor handles it, or we decode JWT.
              // For this legacy codebase, we might need a profile endpoint or check localStorage directly if stored on login.
              // Let's assume we call a profile endpoint usually.
              // If not available, we'll try to get from localStorage 'role' and 'branchId' if saved there.
              const token = localStorage.getItem('token');
               if (token) {
                   // Mocking the check or calling profile endpoint if exists. 
                   // Let's assume we have stored it for now or fetch it.
                   // TODO: Connect to real profile endpoint in future refactor
                   // For now, let's look for stored User Info
                   const storedRole = localStorage.getItem('role') || 'admin'; // fallback admin for dev
                   const storedBranch = localStorage.getItem('branchId'); 
                   
                   setUserRole(storedRole);
                   setUserBranchId(storedBranch);

                   if (storedRole === 'manager' && storedBranch) {
                       setCurrentBranchId(storedBranch);
                   }
               }
          } catch (e) {
              console.log("Error fetching profile context");
          }
      };
      fetchProfile();
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem('userId'); 

      const [ingRes, foodRes, branchRes] = await Promise.all([
        axios.get(`${url}/api/ingredient/list?branchId=${currentBranchId}&userId=${userId}`),
        axios.get(`${url}/api/food/list`),
        axios.get(`${url}/api/branch/list?userId=${userId}`)
      ]);

      if (ingRes.data.success) {
        setIngredients(ingRes.data.data);
      } else {
        toast.error(ingRes.data.message || 'Failed to load ingredients');
      }
      if (foodRes.data.success) {
        setFoods(foodRes.data.data);
      }
      if (branchRes.data.success) {
        setBranches(branchRes.data.data);
      }
    } catch (error) {
      toast.error("Error fetching data");
    } finally {
      setIsLoading(false);
    }
  }, [url, currentBranchId]);

  // Auto Refresh Logic
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchData();
      }, 10000); // Refresh every 10 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- KPI Calculations ---
  const totalInventoryValue = useMemo(() => {
    return ingredients.reduce((sum, item) => sum + (item.stock * (item.costPrice || 0)), 0);
  }, [ingredients]);

  const lowStockCount = ingredients.filter(i => i.stock <= i.minStock && i.stock > 0).length;
  const outOfStockCount = ingredients.filter(i => i.stock === 0).length;

  const profitStats = useMemo(() => {
    if (foods.length === 0) return { avgMargin: 0, topItem: null };
    
    let totalMargin = 0;
    let validCount = 0;

    foods.forEach(food => {
      if (food.price > 0) {
        const cost = food.costPrice || 0;
        const profit = food.price - cost;
        const margin = (profit / food.price) * 100;
        
        if (cost > 0) {
            totalMargin += margin;
            validCount++;
        }
      }
    });

    return {
      avgMargin: validCount > 0 ? (totalMargin / validCount) : 0
    };
  }, [foods]);

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem({ ...currentItem, [name]: value });
  };

  const handleTransferChange = (e) => {
    const { name, value } = e.target;
    setTransferData({ ...transferData, [name]: value });
  }

  const handleSubmit = async (e, keepOpen = false) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      // Payload preparation
      const payload = {
          ...currentItem,
          userId,
          branchId: currentBranchId === 'null' ? null : currentBranchId
      };

      let response;
      if (isEditing) {
        response = await axios.post(`${url}/api/ingredient/update`, { ...payload, id: currentItem._id });
      } else {
        response = await axios.post(`${url}/api/ingredient/add`, payload);
      }

      if (response.data.success) {
        toast.success(isEditing ? "Updated successfully" : "Added successfully");
        fetchData();
        
        if (keepOpen) {
            // Partial reset for convenience (keep category/unit)
            setCurrentItem(prev => ({
                ...prev,
                name: '',
                stock: 0,
                costPrice: 0
            }));
            setIsEditing(false); // Switch to "Add" mode if we were editing
        } else {
            setShowModal(false);
            resetForm();
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error saving ingredient");
    }
  };

  const handleTransferSubmit = async (e) => {
      e.preventDefault();
      try {
          const userId = localStorage.getItem('userId');
          const response = await axios.post(`${url}/api/ingredient/transfer`, {
              ...transferData,
              fromBranch: currentBranchId, // Transfer from current view context (usually Central)
              userId: userId
          });
          
          if (response.data.success) {
              toast.success("Transfer Successful");
              setShowTransferModal(false);
              fetchData();
          } else {
              toast.error(response.data.message);
          }
      } catch (error) {
           toast.error("Transfer Failed");
      }
  }

  const handleDelete = async (id) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.post(`${url}/api/ingredient/remove`, { id, userId });
      if (response.data.success) {
        toast.success("Removed successfully");
        fetchData();
      } else {
        toast.error("Error removing ingredient");
      }
    } catch (error) {
      toast.error("Error removing ingredient");
    }
  };

  const updateStock = async (id, newStock) => {
    if (newStock < 0) return;
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.post(`${url}/api/ingredient/update`, { id, stock: newStock, branchId: currentBranchId, userId });
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

  const handleEdit = (item) => {
    setCurrentItem(item);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleAddNew = () => {
    resetForm();
    setShowModal(true);
  };
  
  const handleOpenTransfer = () => {
      setTransferData({ ingredientId: '', toBranch: '', quantity: 0 });
      setShowTransferModal(true);
  }

  // =========================================
  // ADVANCED INVENTORY OPERATIONS HANDLERS
  // =========================================

  // Open Waste Modal for a specific item
  const openWasteModal = (item) => {
    setWasteData({
      stockId: item.stockId || item._id,
      ingredientId: item._id,
      ingredientName: item.name,
      quantity: 0,
      reason: 'Hư hỏng'
    });
    setShowWasteModal(true);
  };

  // Submit Waste Report
  const handleWasteSubmit = async (e) => {
    e.preventDefault();
    if (wasteData.quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.post(`${url}/api/ingredient/waste`, {
        ...wasteData,
        branchId: currentBranchId,
        userId
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setShowWasteModal(false);
        fetchData();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Lỗi báo hủy');
    }
  };

  // Toggle Audit Mode
  const toggleAuditMode = () => {
    if (isAuditMode) {
      // Exiting audit mode - clear changes
      setAuditChanges({});
    }
    setIsAuditMode(!isAuditMode);
  };

  // Update audit change for an item
  const handleAuditChange = (stockId, actualQty) => {
    setAuditChanges(prev => ({
      ...prev,
      [stockId]: actualQty
    }));
  };

  // Submit Audit
  const handleAuditSubmit = async () => {
    const audits = Object.entries(auditChanges)
      .filter(([_stockId, qty]) => qty !== undefined && qty !== '')
      .map(([stockId, actualQuantity]) => ({
        stockId,
        actualQuantity: parseFloat(actualQuantity)
      }));

    if (audits.length === 0) {
      toast.warn('Không có thay đổi để lưu');
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.post(`${url}/api/ingredient/audit`, {
        audits,
        branchId: currentBranchId,
        userId
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setAuditChanges({});
        setIsAuditMode(false);
        fetchData();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Lỗi kiểm kê');
    }
  };

  // Fetch Stock History for an item
  const fetchStockHistory = async (item) => {
    setSelectedIngredient(item);
    try {
      const response = await axios.get(`${url}/api/ingredient/history/${item.stockId || 'undefined'}`, {
        params: { ingredientId: item._id, branchId: currentBranchId }
      });
      if (response.data.success) {
        setHistoryData(response.data.data);
        setShowHistoryModal(true);
      } else {
        toast.error('Không thể tải lịch sử');
      }
    } catch (error) {
      toast.error('Lỗi tải lịch sử');
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type) => {
    const labels = {
      'IMPORT': 'Nhập kho',
      'SALE': 'Bán hàng',
      'TRANSFER_IN': 'Chuyển vào',
      'TRANSFER_OUT': 'Chuyển ra',
      'WASTE': 'Báo hủy',
      'AUDIT_ADJUSTMENT': 'Kiểm kê'
    };
    return labels[type] || type;
  };

  // --- Filtering & Sorting ---
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="sort-icon" />;
    return sortConfig.direction === 'asc' ? <FaSortUp className="sort-icon active" /> : <FaSortDown className="sort-icon active" />;
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

    // Apply Sorting
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [ingredients, searchQuery, categoryFilter, stockFilter, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredIngredients.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredIngredients.slice(start, start + itemsPerPage);
  }, [currentPage, filteredIngredients]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, stockFilter]);

  // Export to CSV
  const handleExport = () => {
    const headers = ["Tên Nguyên Liệu", "Danh Mục", "Đơn Vị", "Giá Vốn", "Tồn Kho", "Mức Cảnh Báo", "Trạng Thái"];
    const csvContent = [
        headers.join(","),
        ...filteredIngredients.map(item => {
            const status = item.stock === 0 ? "Hết hàng" : item.stock <= item.minStock ? "Sắp hết" : "Đủ hàng";
            return `"${item.name}","${item.category}","${item.unit}",${item.costPrice},${item.stock},${item.minStock},"${status}"`;
        })
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFoods = useMemo(() => {
      if (!searchQuery) return foods;
      return foods.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [foods, searchQuery]);

  // Currency Formatter
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <div className="inventory-header-content">
          <h2>Quản Lý Tồn Kho & Lợi Nhuận</h2>
          <p className="inventory-subtitle">
               {currentBranchId === 'null' ? 'Phạm vi: Kho Tổng (Central)' : `Phạm vi: ${branches.find(b => b._id === currentBranchId)?.name || 'Chi Nhánh'}`}
          </p>
        </div>
        <div style={{display:'flex', gap:'10px'}}>
             {activeTab === 'warehouse' && (
              <>
                 {/* Only Admin sees Transfer and Branch Selector (implied by rendering condition) */}
                 {userRole === 'admin' && currentBranchId === 'null' && (
                    <button className="btn-add-inventory" onClick={handleOpenTransfer} style={{background: '#7c3aed'}}>
                        <FaTruck /> Chuyển Kho
                    </button>
                 )}
                 {/* Add New - Only for Admin */}
                 {userRole === 'admin' && (
                     <button className="btn-add-inventory" onClick={handleAddNew}>
                        <FaPlus /> Thêm Nguyên Liệu
                     </button>
                 )}
              </>
            )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="inventory-stats">
        <div className="stat-card stat-value">
          <div className="stat-icon-container stat-icon-value">
             <FaMoneyBillWave />
          </div>
          <div className="stat-info">
            <div className="stat-label">Tổng Giá Trị Tồn Kho</div>
            <div className="stat-value">{formatMoney(totalInventoryValue)}</div>
          </div>
        </div>

        <div className={`stat-card stat-warning ${lowStockCount > 0 ? 'warning-active' : ''}`}>
          <div className="stat-icon-container stat-icon-warning">
            <FaExclamationTriangle />
          </div>
          <div className="stat-info">
            <div className="stat-label">Cảnh Báo Hết Hàng</div>
            <div className="stat-value">{lowStockCount + outOfStockCount} <span style={{fontSize: '14px', fontWeight: 'normal'}}>món</span></div>
          </div>
        </div>

        <div className="stat-card stat-total">
           <div className="stat-icon-container stat-icon-total">
             <FaChartLine />
           </div>
           <div className="stat-info">
             <div className="stat-label">Lợi Nhuận TB</div>
             <div className="stat-value">{profitStats.avgMargin.toFixed(1)}%</div>
           </div>
        </div>
        
        <div className="stat-card stat-total">
           <div className="stat-icon-container stat-icon-total" style={{ background: '#ede9fe', color: '#7c3aed' }}>
             <FaWarehouse />
           </div>
           <div className="stat-info">
             <div className="stat-label">Kho hàng</div>
             <div className="stat-value">{ingredients.length} <span style={{fontSize: '14px', fontWeight: 'normal'}}>loại</span></div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'warehouse' ? 'active' : ''}`}
            onClick={() => setActiveTab('warehouse')}
          >
            Kho Nguyên Liệu
          </button>
          <button 
            className={`tab-btn ${activeTab === 'profit' ? 'active' : ''}`}
            onClick={() => setActiveTab('profit')}
          >
            Phân Tích Lợi Nhuận
          </button>
      </div>

      {/* Filter Bar */}
      <div className="inventory-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={activeTab === 'warehouse' ? "Tìm nguyên liệu..." : "Tìm món ăn..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        {activeTab === 'warehouse' && (
          <>
            {/* Warehouse Selector - Hide for Managers */}
            {userRole === 'admin' && (
                <div className="filter-group">
                <label>Xem Kho:</label>
                <select
                    value={currentBranchId}
                    onChange={(e) => setCurrentBranchId(e.target.value)}
                    className="filter-select"
                    style={{minWidth: '200px', fontWeight: 'bold', borderColor: '#2563EB'}}
                >
                    <option value="null">Kho Tổng (Central)</option>
                    {branches.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                </select>
                </div>
            )}
            
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
            <div className="filter-group" style={{display:'flex', alignItems:'center'}}>
              <label style={{marginRight:'8px', cursor:'pointer'}}>
                <input 
                    type="checkbox" 
                    checked={autoRefresh} 
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    style={{marginRight:'5px'}} 
                />
                Tự động làm mới
              </label>
            </div>

            <button className="export-btn" onClick={handleExport} title="Xuất Excel">
                <FaFileExport /> Xuất Excel
            </button>

            <button 
                className={`audit-mode-btn ${isAuditMode ? 'active' : ''}`} 
                onClick={toggleAuditMode}
                title="Kiểm kê"
            >
                <FaClipboardCheck /> {isAuditMode ? 'Thoát Kiểm Kê' : 'Kiểm Kê'}
            </button>

            {isAuditMode && Object.keys(auditChanges).length > 0 && (
                <button className="audit-submit-btn" onClick={handleAuditSubmit}>
                    Lưu Kiểm Kê ({Object.keys(auditChanges).length})
                </button>
            )}
          </>
        )}
      </div>

      {/* Content Area */}
      <div className="inventory-table-container">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <FaSpinner className="loading-spinner" />
            <span>Đang tải dữ liệu...</span>
          </div>
        )}
        
        {activeTab === 'warehouse' ? (
          <>
          <table className="inventory-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable-header">
                  Tên Nguyên Liệu {getSortIcon('name')}
                </th>
                <th onClick={() => handleSort('category')} className="sortable-header">
                  Danh Mục {getSortIcon('category')}
                </th>
                <th onClick={() => handleSort('costPrice')} className="sortable-header">
                  Đơn Vị - Giá Vốn {getSortIcon('costPrice')}
                </th>
                <th onClick={() => handleSort('stock')} className="sortable-header">
                  Tồn Kho ({currentBranchId === 'null' ? 'Central' : 'Branch'}) {getSortIcon('stock')}
                </th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item._id} className="inventory-row">
                    <td>
                      <strong className="ingredient-name">{item.name}</strong>
                    </td>
                    <td><span className="category-tag" data-category={item.category}>{item.category}</span></td>
                    <td>
                        <div style={{display:'flex', flexDirection:'column'}}>
                            <span style={{fontWeight:'bold'}}>{item.unit}</span>
                            <span style={{fontSize:'12px', color:'#666'}}>{item.costPrice ? formatMoney(item.costPrice) : '0 ₫'}</span>
                        </div>
                    </td>
                    <td style={{ minWidth: '200px' }}>
                      <div className="stock-progress-wrapper">
                         {/* Quick Adjust Buttons */}
                         <button 
                          className="stock-btn" 
                          onClick={() => updateStock(item._id, Math.max(0, item.stock - 1))}
                          style={{width:'24px', height:'24px', padding:0}}
                          disabled={item.stock === 0}
                        >-</button>
                        
                        <div className="stock-progress-container">
                            <div 
                                className="stock-progress-bar" 
                                style={{
                                    width: `${Math.min((item.stock / 100) * 100, 100)}%`,
                                    backgroundColor: item.stock === 0 ? '#EF4444' : item.stock <= item.minStock ? '#F59E0B' : '#10B981'
                                }}
                            />
                        </div>
                        <span className="stock-text">{item.stock}</span>

                        <button 
                          className="stock-btn" 
                          onClick={() => updateStock(item._id, item.stock + 1)}
                          style={{width:'24px', height:'24px', padding:0}}
                        >+</button>

                        {/* Audit Mode Input */}
                        {isAuditMode && (
                          <div style={{marginLeft:'8px', display:'flex', alignItems:'center'}}>
                            <input 
                              type="number"
                              className="audit-input"
                              placeholder={item.stock}
                              value={auditChanges[item.stockId || item._id] ?? ''}
                              onChange={(e) => handleAuditChange(item.stockId || item._id, e.target.value)}
                            />
                            {auditChanges[item.stockId || item._id] !== undefined && auditChanges[item.stockId || item._id] !== '' && (
                              <span className={`audit-diff ${parseFloat(auditChanges[item.stockId || item._id]) - item.stock >= 0 ? 'positive' : 'negative'}`}>
                                {parseFloat(auditChanges[item.stockId || item._id]) - item.stock >= 0 ? '+' : ''}
                                {(parseFloat(auditChanges[item.stockId || item._id]) - item.stock).toFixed(1)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`stock-badge ${item.stock === 0 ? 'out' : item.stock <= item.minStock ? 'low' : 'good'}`}>
                        {item.stock === 0 ? 'Hết' : item.stock <= item.minStock ? 'Thấp' : 'Tốt'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" onClick={() => handleEdit(item)} title="Sửa"><FaEdit /></button>
                        <button className="action-btn waste" onClick={() => openWasteModal(item)} title="Báo hủy"><FaTimesCircle /></button>
                        <button className="action-btn history" onClick={() => fetchStockHistory(item)} title="Lịch sử"><FaHistory /></button>
                         {/* Only allow delete if ADMIN managing Central */}
                        {userRole === 'admin' && currentBranchId === 'null' && (
                             <button className="action-btn delete" onClick={() => setDeleteModal({ isOpen: true, id: item._id })} title="Xóa"><FaTrash /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="empty-state"><div className="empty-message"><FaBoxOpen className="empty-icon"/><p>Không tìm thấy dữ liệu</p></div></td></tr>
              )}
            </tbody>
          </table>
      
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
                <button 
                    className="pagination-btn" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                >
                    <FaChevronLeft />
                </button>
                <span className="pagination-info">
                    Trang {currentPage} / {totalPages}
                </span>
                <button 
                    className="pagination-btn" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                >
                    <FaChevronRight />
                </button>
            </div>
          )}
          </>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th style={{textAlign:'center'}}>Hình Ảnh</th>
                <th>Tên Món Ăn</th>
                <th>Giá Bán</th>
                <th>Giá Vốn (Cost)</th>
                <th>Lợi Nhuận</th>
                <th>Biên Lợi Nhuận (%)</th>
              </tr>
            </thead>
            <tbody>
              {filteredFoods.length > 0 ? (
                filteredFoods.map((food) => {
                   const cost = food.costPrice || 0;
                   const profit = food.price - cost;
                   const margin = food.price > 0 ? (profit / food.price) * 100 : 0;
                   let marginClass = "margin-medium";
                   if (margin > 60) marginClass = "margin-high";
                   if (margin < 35) marginClass = "margin-low";

                   return (
                    <tr key={food._id} className="inventory-row">
                        <td className="product-image-cell">
                             <img src={`${url}/images/${food.image}`} alt={food.name} className="product-image" onError={(e) => e.target.src = 'https://placehold.co/50x50?text=No+Img'} />
                        </td>
                        <td>
                            <div style={{fontWeight:'bold'}}>{food.name}</div>
                            <div style={{fontSize:'12px', color:'#666'}}>{food.category}</div>
                        </td>
                        <td style={{ fontWeight:'600', color:'#2563EB' }}>{formatMoney(food.price)}</td>
                        <td style={{ fontWeight:'600', color:'#DC2626' }}>{formatMoney(cost)}</td>
                        <td style={{ fontWeight:'bold', color: profit > 0 ? '#059669' : '#DC2626' }}>{formatMoney(profit)}</td>
                        <td>
                            <span className={`margin-badge ${marginClass}`}>
                                {margin.toFixed(1)}%
                            </span>
                        </td>
                    </tr>
                   );
                })
              ) : (
                <tr><td colSpan="6" className="empty-state"><div className="empty-message"><FaBoxOpen className="empty-icon"/><p>Không dữ liệu món ăn</p></div></td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Modal - Add/Edit Ingredient */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Cập Nhật Nguyên Liệu' : 'Thêm Nguyên Liệu Mới'}</h3>
              <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
            </div>
            
  const navigate = useNavigate();

  // ... (inside the modal)

            {!isEditing && (
                <div className="info-box" style={{marginBottom: '15px', background: '#e0f2fe', padding: '10px', borderRadius: '4px', fontSize: '13px', color: '#0369a1'}}>
                    <p>💡 <strong>Gợi ý:</strong> Chức năng này dùng để định nghĩa nguyên liệu mới.</p>
                    <p>Để nhập số lượng lớn từ nhà cung cấp (có phiếu), vui lòng dùng mục <strong style={{cursor:'pointer', textDecoration:'underline'}} onClick={() => navigate('/import')}>Nhập Hàng</strong>.</p>
                </div>
            )}

            <form onSubmit={(e) => handleSubmit(e, false)}>
              <div className="form-group">
                <label>Tên Nguyên Liệu</label>
                <input 
                  type="text" 
                  name="name" 
                  value={currentItem.name} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Danh Mục</label>
                  <select name="category" value={currentItem.category} onChange={handleInputChange}>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Đơn Vị Tính</label>
                  <select name="unit" value={currentItem.unit} onChange={handleInputChange}>
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{isEditing ? 'Tồn Kho Hiện Tại' : 'Tồn Đầu Kỳ'}</label>
                  <input 
                    type="number" 
                    name="stock" 
                    value={currentItem.stock} 
                    onChange={handleInputChange} 
                    min="0"
                    disabled={isEditing} // Prevent direct editing of stock here if desired, or keep enabled for quick fix
                  />
                  {isEditing && <small style={{color:'gray'}}>Dùng chức năng Kiểm Kê hoặc Nhập Hàng để thay đổi chính xác.</small>}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Mức Cảnh báo</label>
                  <input type="number" name="minStock" value={currentItem.minStock} onChange={handleInputChange} min="0" />
                </div>
              </div>
              
              <div className="form-group">
                  <label>Giá Vốn (VNĐ / Đơn vị) - Master Data</label>
                  <input 
                    type="number" name="costPrice" value={currentItem.costPrice} onChange={handleInputChange} min="0" 
                    disabled={userRole !== 'admin'} 
                  />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                {!isEditing && (
                    <button type="button" className="btn-secondary" style={{borderColor: '#10B981', color: '#10B981'}} onClick={(e) => handleSubmit(e, true)}>
                        Lưu & Thêm tiếp
                    </button>
                )}
                <button type="submit" className="btn-primary" onClick={(e) => handleSubmit(e, false)}>Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL (Admin Only) */}
      {showTransferModal && (
        <div className="modal-overlay">
          <div className="modal-content page-fade-in">
            <div className="modal-header">
              <h3><FaTruck style={{marginRight: '10px'}}/> Chuyển Kho Thội Bộ</h3>
              <button className="close-modal" onClick={() => setShowTransferModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleTransferSubmit}>
               <div className="form-group">
                 <label>Chọn Nguyên Liệu</label>
                 <select name="ingredientId" value={transferData.ingredientId} onChange={handleTransferChange} required>
                    <option value="">-- Chọn nguyên liệu --</option>
                    {ingredients.map(ing => (
                        <option key={ing._id} value={ing._id}>{ing.name} (Tồn: {ing.stock} {ing.unit})</option>
                    ))}
                 </select>
               </div>
               
               <div className="form-group">
                 <label>Từ Kho</label>
                 <input type="text" value={currentBranchId === 'null' ? "Kho Tổng (Central)" : branches.find(b => b._id === currentBranchId)?.name} disabled />
               </div>

               <div className="form-group">
                 <label>Đến Chi Nhánh</label>
                 <select name="toBranch" value={transferData.toBranch} onChange={handleTransferChange} required>
                    <option value="">-- Chọn chi nhánh nhận --</option>
                    {branches.filter(b => b._id !== currentBranchId).map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                 </select>
               </div>

               <div className="form-group">
                  <label>Số Lượng Chuyển</label>
                  <input type="number" name="quantity" value={transferData.quantity} onChange={handleTransferChange} min="1" required />
               </div>

               <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowTransferModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Xác Nhận Chuyển</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waste Modal */}
      {showWasteModal && (
        <div className="modal-overlay" onClick={() => setShowWasteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaTimesCircle style={{color:'#EF4444'}}/> Báo Hủy/Hỏng</h3>
              <button className="close-modal" onClick={() => setShowWasteModal(false)}>×</button>
            </div>
            <form onSubmit={handleWasteSubmit}>
              <div className="form-group">
                <label>Nguyên liệu</label>
                <input type="text" value={wasteData.ingredientName} disabled />
              </div>
              <div className="form-group">
                <label>Số lượng hủy</label>
                <input 
                    type="number" 
                    value={wasteData.quantity} 
                    onChange={e => setWasteData({...wasteData, quantity: parseFloat(e.target.value) || 0})} 
                    min="0.1" 
                    step="0.1"
                    required 
                />
              </div>
              <div className="form-group">
                <label>Lý do</label>
                <select 
                    value={wasteData.reason} 
                    onChange={e => setWasteData({...wasteData, reason: e.target.value})}
                >
                    {wasteReasons.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowWasteModal(false)}>Hủy</button>
                <button type="submit" className="btn-danger">Xác Nhận Báo Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaHistory style={{color:'#6366F1'}}/> Lịch Sử: {selectedIngredient?.name}</h3>
              <button className="close-modal" onClick={() => setShowHistoryModal(false)}>×</button>
            </div>
            <div className="history-table-container">
              {historyData.length > 0 ? (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Loại</th>
                      <th>Thay đổi</th>
                      <th>Còn lại</th>
                      <th>Người thực hiện</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map(h => (
                      <tr key={h._id}>
                        <td>{formatDate(h.date)}</td>
                        <td><span className={`transaction-type ${h.type.toLowerCase()}`}>{getTransactionTypeLabel(h.type)}</span></td>
                        <td className={h.quantity >= 0 ? 'positive' : 'negative'}>
                          {h.quantity >= 0 ? '+' : ''}{h.quantity}
                        </td>
                        <td>{h.newQty}</td>
                        <td>{h.performedBy}</td>
                        <td>{h.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-message"><FaBoxOpen className="empty-icon"/><p>Chưa có lịch sử</p></div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowHistoryModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={() => {
            if (deleteModal.id) handleDelete(deleteModal.id);
            setDeleteModal({ isOpen: false, id: null });
        }}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa nguyên liệu này không?"
      />
    </div>
  );
};

Inventory.propTypes = {
  url: PropTypes.string.isRequired
};

export default Inventory;
