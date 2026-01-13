import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './Dashboard.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';
import { 
  DollarSign, Users, RefreshCw, 
  TrendingUp, Clock, Utensils, MapPin, Activity, Loader2, LogIn
} from 'lucide-react';

const Dashboard = ({ url }) => {
  // State
  const [dashboardData, setDashboardData] = useState(null);
  const [liveData, setLiveData] = useState({ activeTables: 0, kitchenBacklog: 0 });
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check if user is logged in
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  // Constants - Modern color palette
  const COLORS = ['#FF6B00', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
  const CHART_COLORS = {
    primary: '#FF6B00',
    secondary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
  };
  
  // Formatters
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatCompactNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  // 1. Fetch Branches on Mount
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const fetchBranches = async () => {
      try {
        const response = await axios.get(`${url}/api/branch/list`);
        if (response.data.success) {
          setBranches(response.data.data);
          // Auto-select first branch if available
          if (response.data.data.length > 0) {
            setSelectedBranch(response.data.data[0]._id);
          }
        }
      } catch (error) {
        console.error("Error fetching branches", error);
      }
    };
    fetchBranches();
  }, [url, isLoggedIn]);

  // 2. Fetch Dashboard Data
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (!selectedBranch || !isLoggedIn) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await axios.get(`${url}/api/analytics/dashboard`, {
        params: { branchId: selectedBranch },
        headers: { token: localStorage.getItem('token') }
      });
      if (response.data.success) {
        setDashboardData(response.data.data);
        if (isRefresh) {
          toast.success('Dữ liệu đã được cập nhật');
        }
      }
    } catch (error) {
        console.error("Dashboard error", error);
        toast.error("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBranch, url, isLoggedIn]);

  // 3. Fetch Live Status (Polling)
  const fetchLiveStatus = useCallback(async () => {
    if (!selectedBranch || !isLoggedIn) return;
    try {
      const response = await axios.get(`${url}/api/analytics/live`, {
        params: { branchId: selectedBranch },
        headers: { token: localStorage.getItem('token') }
      });
      if (response.data.success) {
        setLiveData(response.data.data);
      }
    } catch (error) {
      console.error("Live status error", error);
    }
  }, [selectedBranch, url, isLoggedIn]);

  // Effects
  useEffect(() => {
    if (selectedBranch && isLoggedIn) {
      fetchDashboardData();
      fetchLiveStatus();
      
      const interval = setInterval(fetchLiveStatus, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [selectedBranch, isLoggedIn, fetchDashboardData, fetchLiveStatus]);

  const handleRefresh = () => {
    fetchDashboardData(true);
    fetchLiveStatus();
  };

  // Not logged in state
  if (!isLoggedIn) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <LogIn className="loading-spinner" size={48} style={{ animation: 'none', color: '#FF6B00' }} />
          <h2 style={{ marginTop: '16px', color: '#1F2937' }}>Yêu cầu đăng nhập</h2>
          <p style={{ color: '#6B7280', marginTop: '8px' }}>Vui lòng đăng nhập tài khoản Admin để xem Dashboard</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!dashboardData && loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <Loader2 className="loading-spinner" size={48} />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Safe access to data
  const revenueData = dashboardData?.revenue || [];
  const topProducts = dashboardData?.topProducts || [];
  const peakHours = dashboardData?.peakHours || [];
  
  // Process lostSales to handle missing reasons
  const rawLostSales = dashboardData?.lostSales || [];
  const lostSales = rawLostSales.map(item => ({
    ...item,
    _id: item._id || 'Khác' // Fallback for missing cancellation reason
  }));

  // Calculate Today's Revenue (Simple approximation from list or live)
  // For precise "Today", we might need a separate endpoint or filter the revenueData array
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const todayRevenueObj = revenueData.find(d => d._id === today);
  const todayRevenue = todayRevenueObj ? todayRevenueObj.dailyRevenue : 0;

  return (
    <div className='dashboard-container page-fade-in'>
      
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1 className="dashboard-title-main">Tổng Quan Kinh Doanh</h1>
          <p className="dashboard-title-subtitle">
            <Activity size={16} className="inline-icon" />
            Theo dõi hiệu suất nhà hàng theo thời gian thực
          </p>
        </div>
        <div className="dashboard-actions">
          <div className="branch-select-wrapper">
            <MapPin size={18} className="select-icon" />
            <select 
              className="branch-select"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
          <button 
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`} 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
            <span>{refreshing ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* SECTION A: LIVE STATUS CARDS */}
      <div className="stats-grid">
        <div className="stat-card stat-card-revenue">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Doanh Thu Hôm Nay</p>
              <div className="stat-value-wrapper">
                <div className="stat-value">{formatCurrency(todayRevenue)}</div>
                <div className="stat-trend">
                  <TrendingUp size={14} />
                  <span>Hôm nay</span>
                </div>
              </div>
            </div>
            <div className="stat-icon-wrapper stat-icon-revenue">
              <DollarSign size={28} />
            </div>
          </div>
          <div className="stat-card-glow"></div>
        </div>

        <div className="stat-card stat-card-tables">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Bàn Đang Hoạt Động</p>
              <div className="stat-value-wrapper">
                <div className="stat-value">{liveData.activeTables}</div>
                <div className="stat-trend">
                  <Activity size={14} />
                  <span>Trực tiếp</span>
                </div>
              </div>
            </div>
            <div className="stat-icon-wrapper stat-icon-tables">
              <Users size={28} />
            </div>
          </div>
          <div className="stat-card-glow"></div>
        </div>

        <div className="stat-card stat-card-kitchen">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Đơn Bếp Chờ Xử Lý</p>
              <div className="stat-value-wrapper">
                <div className="stat-value">{liveData.kitchenBacklog}</div>
                <div className="stat-trend">
                  <Clock size={14} />
                  <span>Đang chờ</span>
                </div>
              </div>
            </div>
            <div className="stat-icon-wrapper stat-icon-kitchen">
              <Utensils size={28} />
            </div>
          </div>
          <div className="stat-card-glow"></div>
        </div>
      </div>

      {/* SECTION B: CHARTS */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card chart-card-large">
          <div className="chart-header">
            <div className="chart-header-content">
              <h3 className="chart-title">Xu Hướng Doanh Thu</h3>
              <p className="chart-subtitle">7 ngày gần nhất</p>
            </div>
            <div className="chart-header-badge">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="chart-body">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="_id" 
                    tickFormatter={(str) => str.slice(5)} 
                    stroke="#6B7280"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={(val) => formatCompactNumber(val)} 
                    stroke="#6B7280"
                    fontSize={12}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="dailyRevenue" 
                    stroke={CHART_COLORS.primary} 
                    fill="url(#revenueGradient)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <p>Chưa có dữ liệu doanh thu</p>
              </div>
            )}
          </div>
        </div>

        {/* Cancellation Chart */}
        <div className="chart-card chart-card-medium">
          <div className="chart-header">
            <div className="chart-header-content">
              <h3 className="chart-title">Phân Tích Đơn Hủy</h3>
              <p className="chart-subtitle">Theo lý do</p>
            </div>
          </div>
          <div className="chart-body">
            {lostSales.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={lostSales}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="_id"
                  >
                    {lostSales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => `${val} đơn`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <p>Không có dữ liệu hủy đơn</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION C: OPERATIONS */}
      <div className="operations-grid">
        {/* Peak Hours */}
        <div className="chart-card chart-card-medium">
          <div className="chart-header">
            <div className="chart-header-content">
              <h3 className="chart-title">Giờ Cao Điểm</h3>
              <p className="chart-subtitle">Số đơn theo giờ</p>
            </div>
            <div className="chart-header-badge">
              <Clock size={16} />
            </div>
          </div>
          <div className="chart-body">
            {peakHours.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHours} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="_id.hour" 
                    label={{ value: 'Giờ', position: 'insideBottom', offset: -5 }}
                    stroke="#6B7280"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false}
                    stroke="#6B7280"
                    fontSize={12}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="orderCount" 
                    fill={CHART_COLORS.secondary} 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <p>Chưa có dữ liệu giờ cao điểm</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="chart-card chart-card-medium">
          <div className="chart-header">
            <div className="chart-header-content">
              <h3 className="chart-title">Top 5 Món Bán Chạy</h3>
              <p className="chart-subtitle">Sản phẩm phổ biến nhất</p>
            </div>
            <div className="chart-header-badge">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="table-container">
            {topProducts.length > 0 ? (
              <table className="top-products-table">
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>Tên Món</th>
                    <th className="text-right">Số Lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((item, index) => (
                    <tr key={index} className="table-row">
                      <td>
                        <span className={`rank-badge rank-badge-${index + 1}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="product-name">{item._id}</td>
                      <td className="text-right product-quantity">{item.totalQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="chart-empty">
                <p>Chưa có dữ liệu món bán chạy</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

Dashboard.propTypes = {
  url: PropTypes.string.isRequired,
};

export default Dashboard;
