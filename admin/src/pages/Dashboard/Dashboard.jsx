import { useState, useEffect, useContext } from "react";
import "./Dashboard.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const Dashboard = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [stats, setStats] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBranches = async () => {
    const response = await axios.get(`${url}/api/branch/list`);
    if (response.data.success) {
      setBranches(response.data.data);
    }
  };

  const fetchDashboardData = async (branchId = "") => {
    setLoading(true);
    try {
      const queryParam = branchId ? `?branchId=${branchId}` : "";
      
      const [statsRes, dailyRes] = await Promise.all([
        axios.get(`${url}/api/analytics/dashboard${queryParam}`, {
          headers: { token },
        }),
        axios.get(`${url}/api/analytics/daily${queryParam}`, {
          headers: { token },
        }),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (dailyRes.data.success) {
        setDailySales(dailyRes.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching analytics");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
      return;
    }
    fetchBranches();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (token) {
      fetchDashboardData(selectedBranch);
    }
  }, [selectedBranch]);

  const avgOrderValue = stats?.totalOrders > 0 
    ? (stats.totalSales / stats.totalOrders).toFixed(0) 
    : 0;

  return (
    <div className="dashboard add">
      <div className="dashboard-header">
        <h2>📊 Thống Kê Tổng Quan</h2>
        {branches.length > 0 && (
          <div className="branch-filter">
            <label>Chi nhánh: </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">Đang tải dữ liệu...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="stat-cards">
            <div className="stat-card revenue">
              <div className="stat-icon-container">
                <div className="stat-icon">💰</div>
              </div>
              <div className="stat-info">
                <h3>{Number(stats?.totalSales || 0).toLocaleString('vi-VN')} đ</h3>
                <p>Tổng doanh thu</p>
              </div>
            </div>
            <div className="stat-card orders">
              <div className="stat-icon-container">
                <div className="stat-icon">📦</div>
              </div>
              <div className="stat-info">
                <h3>{stats?.totalOrders || 0}</h3>
                <p>Tổng đơn hàng</p>
              </div>
            </div>
            <div className="stat-card avg">
              <div className="stat-icon-container">
                <div className="stat-icon">📈</div>
              </div>
              <div className="stat-info">
                <h3>{Number(avgOrderValue).toLocaleString('vi-VN')} đ</h3>
                <p>Giá trị TB/Đơn</p>
              </div>
            </div>
            <div className="stat-card pending">
              <div className="stat-icon-container">
                <div className="stat-icon">⏳</div>
              </div>
              <div className="stat-info">
                <h3>{stats?.pendingOrders || 0}</h3>
                <p>Đơn chờ xử lý</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-row">
            {/* Daily Sales Chart */}
            <div className="chart-container">
              <h3>📅 Doanh Thu (7 Ngày Qua)</h3>
              {dailySales.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
                    <Bar dataKey="sales" fill="#ff6b35" name="Doanh thu" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">Chưa có dữ liệu</p>
              )}
            </div>

            {/* Orders by Type */}
            <div className="chart-container small">
              <h3>📋 Phân Loại Đơn</h3>
              {stats?.ordersByType?.length > 0 ? (
                <div className="type-breakdown">
                  {stats.ordersByType.map((item, idx) => (
                    <div key={idx} className="type-item">
                      <span className="type-label">
                        {item.type === "Dine-in" ? "🍽️" : item.type === "Delivery" ? "🚚" : "🛍️"} 
                        {item.type === "Dine-in" ? " Tại bàn" : " Giao hàng"}
                      </span>
                      <span className="type-count">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">Chưa có dữ liệu</p>
              )}
            </div>
          </div>

          {/* Top Selling Foods */}
          <div className="top-foods">
            <h3>🔥 Món Bán Chạy</h3>
            {stats?.topFoods?.length > 0 ? (
              <table className="top-foods-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tên Món</th>
                    <th>Đã Bán</th>
                    <th>Doanh Thu</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topFoods.map((food, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{food.name}</td>
                      <td>{food.quantity}</td>
                      <td>{Number(food.revenue).toLocaleString('vi-VN')} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">Chưa có dữ liệu</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
