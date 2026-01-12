import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Analytics.css';
import { FaDollarSign, FaChartLine, FaPercent, FaShoppingCart, FaCalendarAlt, FaBuilding } from 'react-icons/fa';
import PropTypes from 'prop-types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';

const Analytics = ({ url }) => {
  // Data State
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [wasteData, setWasteData] = useState([]);
  const [branches, setBranches] = useState([]);
  
  // Filter State
  const [dateRange, setDateRange] = useState('month'); // today, week, month, custom
  const [branchId, setBranchId] = useState('null');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);

  // Chart Colors
  const PIE_COLORS = ['#3B82F6', '#EF4444', '#10B981']; // COGS, Waste, Profit

  // =========================================
  // DATE RANGE HELPERS
  // =========================================
  const getDateParams = () => {
    const now = new Date();
    let startDate, endDate;
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date().toISOString();
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        endDate = new Date().toISOString();
        break;
      case 'month':
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
        endDate = new Date().toISOString();
        break;
      case 'custom':
        startDate = customRange.start ? new Date(customRange.start).toISOString() : null;
        endDate = customRange.end ? new Date(customRange.end).toISOString() : null;
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
        endDate = new Date().toISOString();
    }
    
    return { startDate, endDate };
  };

  // =========================================
  // DATA FETCHING
  // =========================================
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const { startDate, endDate } = getDateParams();
      
      const params = new URLSearchParams({
        userId,
        startDate,
        endDate,
        branchId
      }).toString();
      
      const [statsRes, trendRes, topRes, wasteRes, branchRes] = await Promise.all([
        axios.get(`${url}/api/reports/stats?${params}`),
        axios.get(`${url}/api/reports/trend?${params}`),
        axios.get(`${url}/api/reports/top-sellers?${params}&limit=5`),
        axios.get(`${url}/api/reports/waste?${params}&limit=5`),
        axios.get(`${url}/api/branch/list?userId=${userId}`)
      ]);
      
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (trendRes.data.success) setTrendData(trendRes.data.data);
      if (topRes.data.success) setTopSellers(topRes.data.data);
      if (wasteRes.data.success) setWasteData(wasteRes.data.data);
      if (branchRes.data.success) setBranches(branchRes.data.data);
    } catch (error) {
      toast.error('Lỗi tải dữ liệu phân tích');
    } finally {
      setIsLoading(false);
    }
  }, [url, dateRange, branchId, customRange.start, customRange.end]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =========================================
  // FORMATTERS
  // =========================================
  const formatMoney = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
  };

  const formatFullMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  // =========================================
  // COMPUTED DATA
  // =========================================
  const pieData = stats ? [
    { name: 'Chi phí NVL', value: stats.cogs, color: PIE_COLORS[0] },
    { name: 'Hao hụt', value: stats.wasteCost, color: PIE_COLORS[1] },
    { name: 'Lợi nhuận', value: stats.grossProfit, color: PIE_COLORS[2] }
  ].filter(d => d.value > 0) : [];

  const foodCostStatus = stats?.foodCostPercent <= 35 ? 'good' : 'warning';

  // =========================================
  // RENDER
  // =========================================
  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1><FaChartLine /> Phân Tích Kinh Doanh</h1>
        <p>Theo dõi doanh thu, chi phí và lợi nhuận của nhà hàng</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <FaCalendarAlt />
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="today">Hôm nay</option>
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
            <option value="custom">Tùy chọn</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <div className="custom-range">
            <input 
              type="date" 
              value={customRange.start}
              onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
            />
            <span>đến</span>
            <input 
              type="date" 
              value={customRange.end}
              onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
            />
          </div>
        )}

        <div className="filter-group">
          <FaBuilding />
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="null">Tất cả chi nhánh</option>
            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-cards">
        <div className="kpi-card revenue">
          <div className="kpi-icon"><FaDollarSign /></div>
          <div className="kpi-content">
            <span className="kpi-label">Doanh Thu</span>
            <span className="kpi-value">{formatMoney(stats?.revenue)}</span>
            <span className="kpi-detail">{stats?.totalOrders || 0} đơn hàng</span>
          </div>
        </div>

        <div className="kpi-card profit">
          <div className="kpi-icon"><FaChartLine /></div>
          <div className="kpi-content">
            <span className="kpi-label">Lợi Nhuận Gộp</span>
            <span className="kpi-value">{formatMoney(stats?.grossProfit)}</span>
            <span className="kpi-detail">COGS: {formatMoney(stats?.cogs)}</span>
          </div>
        </div>

        <div className={`kpi-card food-cost ${foodCostStatus}`}>
          <div className="kpi-icon"><FaPercent /></div>
          <div className="kpi-content">
            <span className="kpi-label">Food Cost %</span>
            <span className="kpi-value">{stats?.foodCostPercent || 0}%</span>
            <span className="kpi-detail">Mục tiêu: &lt; 35%</span>
          </div>
        </div>

        <div className="kpi-card orders">
          <div className="kpi-icon"><FaShoppingCart /></div>
          <div className="kpi-content">
            <span className="kpi-label">TB/Đơn</span>
            <span className="kpi-value">{formatMoney(stats?.avgOrderValue)}</span>
            <span className="kpi-detail">Hao hụt: {formatMoney(stats?.wasteCost)}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Main Trend Chart */}
        <div className="chart-card main-chart">
          <h3>Xu Hướng Doanh Thu & Lợi Nhuận</h3>
          {isLoading ? (
            <div className="chart-loading">Đang tải...</div>
          ) : trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={formatMoney}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value) => formatFullMoney(value)}
                  labelFormatter={(label) => `Ngày: ${label}`}
                />
                <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#10B981" fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Pie Chart - Cost Breakdown */}
        <div className="chart-card pie-chart">
          <h3>Cơ Cấu Chi Phí</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatFullMoney(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Bar Chart - Top Sellers */}
        <div className="chart-card bar-chart">
          <h3>Top 5 Món Bán Chạy</h3>
          {topSellers.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topSellers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tickFormatter={formatMoney} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'revenue') return formatFullMoney(value);
                    return value;
                  }}
                  labelFormatter={(label) => label}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="custom-tooltip">
                          <p className="tooltip-title">{label}</p>
                          <p>Số lượng: <strong>{data.quantity}</strong></p>
                          <p>Doanh thu: <strong>{formatFullMoney(data.revenue)}</strong></p>
                          <p>Lợi nhuận: <strong>{formatFullMoney(data.profit)}</strong></p>
                          <p>Biên lợi nhuận: <strong>{data.marginPercent}%</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" name="Doanh thu" fill="#6366F1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Waste Analysis Table */}
        <div className="chart-card waste-card">
          <h3>Top 5 Nguyên Liệu Hao Hụt</h3>
          {wasteData.length > 0 ? (
            <table className="waste-table">
              <thead>
                <tr>
                  <th>Nguyên Liệu</th>
                  <th>Số Lượng</th>
                  <th>Chi Phí</th>
                </tr>
              </thead>
              <tbody>
                {wasteData.map((w, idx) => (
                  <tr key={idx}>
                    <td>{w.name}</td>
                    <td>{w.quantity} {w.unit}</td>
                    <td className="waste-cost">{formatFullMoney(w.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data">Chưa có dữ liệu hao hụt</div>
          )}
        </div>
      </div>
    </div>
  );
};

Analytics.propTypes = {
  url: PropTypes.string.isRequired
};

export default Analytics;
