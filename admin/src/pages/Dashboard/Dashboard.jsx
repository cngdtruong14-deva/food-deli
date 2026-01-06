import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';
import { 
  DollarSign, Users, AlertCircle, RefreshCw, 
  TrendingUp, Clock, Utensils
} from 'lucide-react';

const Dashboard = ({ url }) => {
  // State
  const [dashboardData, setDashboardData] = useState(null);
  const [liveData, setLiveData] = useState({ activeTables: 0, kitchenBacklog: 0 });
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(true);

  // Constants
  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981'];
  
  // Formatters
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // 1. Fetch Branches on Mount
  useEffect(() => {
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
  }, [url]);

  // 2. Fetch Dashboard Data
  const fetchDashboardData = async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/analytics/dashboard`, {
        params: { branchId: selectedBranch, userId: localStorage.getItem('userId') }, // Assuming userId stored
        headers: { token: localStorage.getItem('token') }
      });
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
        console.error("Dashboard error", error);
        // toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch Live Status (Polling)
  const fetchLiveStatus = async () => {
    if (!selectedBranch) return;
    try {
      const response = await axios.get(`${url}/api/analytics/live`, {
        params: { branchId: selectedBranch, userId: localStorage.getItem('userId') },
        headers: { token: localStorage.getItem('token') }
      });
      if (response.data.success) {
        setLiveData(response.data.data);
      }
    } catch (error) {
      console.error("Live status error", error);
    }
  };

  // Effects
  useEffect(() => {
    if (selectedBranch) {
      fetchDashboardData();
      fetchLiveStatus();
      
      const interval = setInterval(fetchLiveStatus, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [selectedBranch, url]);

  if (!dashboardData && loading) {
    return <div className="dashboard-container center">Loading Dashboard...</div>;
  }

  // Safe access to data
  const revenueData = dashboardData?.revenue || [];
  const topProducts = dashboardData?.topProducts || [];
  const peakHours = dashboardData?.peakHours || [];
  const lostSales = dashboardData?.lostSales || [];

  // Calculate Today's Revenue (Simple approximation from list or live)
  // For precise "Today", we might need a separate endpoint or filter the revenueData array
  const today = new Date().toISOString().split('T')[0];
  const todayRevenueObj = revenueData.find(d => d._id === today);
  const todayRevenue = todayRevenueObj ? todayRevenueObj.dailyRevenue : 0;

  return (
    <div className='dashboard-container page-fade-in'>
      
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Tổng Quan Kinh Doanh</h2>
          <p>Theo dõi hiệu suất nhà hàng theo thời gian thực</p>
        </div>
        <div className="dashboard-actions">
          <button className="refresh-btn" onClick={() => { fetchDashboardData(); fetchLiveStatus(); }}>
            <RefreshCw size={18} />
            <span>Làm mới</span>
          </button>
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
      </div>

      {/* SECTION A: LIVE STATUS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Doanh Thu Hôm Nay</h3>
            <div className="stat-value">{formatCurrency(todayRevenue)}</div>
          </div>
          <div className="stat-icon orange-bg">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Bàn Đang Hoạt Động</h3>
            <div className="stat-value">{liveData.activeTables}</div>
          </div>
          <div className="stat-icon blue-bg">
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Đơn Bếp Chờ Xử Lý</h3>
            <div className="stat-value">{liveData.kitchenBacklog}</div>
          </div>
          <div className="stat-icon red-bg">
            <Utensils size={24} />
          </div>
        </div>
      </div>

      {/* SECTION B: CHARTS */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Xu Hướng Doanh Thu (7 Ngày)</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="_id" tickFormatter={(str) => str.slice(5)} />
              <YAxis tickFormatter={(val) => `${val/1000}k`} />
              <Tooltip formatter={(val) => formatCurrency(val)} />
              <Area type="monotone" dataKey="dailyRevenue" stroke="#f97316" fill="#fff7ed" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cancellation Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Phân Tích Đơn Hủy</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
             {lostSales.length > 0 ? (
                <PieChart>
                  <Pie
                    data={lostSales}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {lostSales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `${val} đơn`} />
                  <Legend />
                </PieChart>
             ) : (
               <div className="flex-center h-full text-slate-400">Không có dữ liệu hủy đơn</div>
             )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION C: OPERATIONS */}
      <div className="operations-grid">
        {/* Peak Hours */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Giờ Cao Điểm</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peakHours}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} />
               <XAxis dataKey="_id.hour" label={{ value: 'Giờ', position: 'insideBottom', offset: -5 }} />
               <YAxis allowDecimals={false} />
               <Tooltip />
               <Bar dataKey="orderCount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top 5 Món Bán Chạy</h3>
          </div>
          <div className="table-container">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên Món</th>
                  <th style={{textAlign: 'right'}}>Số Lượng</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((item, index) => (
                  <tr key={index}>
                    <td><span className="rank-badge">{index + 1}</span></td>
                    <td>{item._id}</td>
                    <td style={{textAlign: 'right', fontWeight: 600}}>{item.totalQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
