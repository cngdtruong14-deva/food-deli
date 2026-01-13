import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSpinner, FaExclamationTriangle, FaCheckCircle, FaRobot, FaSync, FaFileExport } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import PropTypes from 'prop-types';

const SmartRestock = ({ url }) => {
  const [forecastData, setForecastData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchForecast = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${url}/api/inventory/forecast`);
      if (response.data.success) {
        setForecastData(response.data.data || []);
        setMessage(response.data.message || '');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Không thể kết nối AI Service');
      setMessage('AI Service không khả dụng');
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return '#EF4444';
      case 'WARNING': return '#F59E0B';
      case 'SAFE': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'CRITICAL': return 'Cần nhập ngay';
      case 'WARNING': return 'Sắp hết';
      case 'SAFE': return 'Đủ hàng';
      default: return status;
    }
  };

  // Prepare chart data (top 5 risky items)
  const chartData = forecastData
    .filter(item => item.status !== 'SAFE')
    .slice(0, 5)
    .map(item => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      'Tồn kho': item.currentStock,
      'Cần dùng': item.predictedNeed,
      status: item.status
    }));

  // Mock Export Function
  const handleExport = () => {
    const headers = ["Nguyên liệu", "Đơn vị", "Tồn kho", "Dự báo cần", "Thiếu hụt", "Trạng thái"];
    const csvContent = [
      headers.join(","),
      ...forecastData.map(item => 
        `"${item.name}","${item.unit}",${item.currentStock},${item.predictedNeed},${item.deficit},"${getStatusLabel(item.status)}"`
      )
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `smart_restock_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Đã xuất phiếu nhập hàng');
  };

  return (
    <div className="smart-restock-container">
      {/* Header */}
      <div className="smart-restock-header">
        <div className="smart-restock-title">
          <FaRobot className="ai-icon" />
          <div>
            <h3>📊 Dự báo nhập hàng (AI)</h3>
            <p className="smart-restock-subtitle">{message || 'Phân tích dựa trên lịch sử bán hàng'}</p>
          </div>
        </div>
        <div className="smart-restock-actions">
          <button className="refresh-btn" onClick={fetchForecast} disabled={isLoading}>
            <FaSync className={isLoading ? 'spinning' : ''} /> Làm mới
          </button>
          {forecastData.length > 0 && (
            <button className="export-btn" onClick={handleExport}>
              <FaFileExport /> Xuất phiếu nhập
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <span>Đang phân tích dữ liệu...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && forecastData.length === 0 && (
        <div className="empty-state">
          <FaRobot style={{ fontSize: '48px', color: '#9CA3AF' }} />
          <p>{message || 'Chưa có dữ liệu dự báo'}</p>
        </div>
      )}

      {/* Chart Section */}
      {!isLoading && chartData.length > 0 && (
        <div className="chart-section">
          <h4>So sánh Tồn kho vs Nhu cầu (Top 5 cần nhập)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Tồn kho" fill="#60A5FA" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Cần dùng" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table Section */}
      {!isLoading && forecastData.length > 0 && (
        <div className="forecast-table-container">
          <table className="forecast-table">
            <thead>
              <tr>
                <th>Nguyên liệu</th>
                <th>Đơn vị</th>
                <th>Tồn kho</th>
                <th>Dự báo cần</th>
                <th>Thiếu hụt</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.map((item) => (
                <tr key={item._id} className={`status-row status-${item.status.toLowerCase()}`}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.unit}</td>
                  <td>{item.currentStock}</td>
                  <td>{item.predictedNeed}</td>
                  <td style={{ color: item.deficit > 0 ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>
                    {item.deficit > 0 ? `-${item.deficit}` : '0'}
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ 
                        background: getStatusColor(item.status) + '20', 
                        color: getStatusColor(item.status),
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {item.status === 'CRITICAL' && <FaExclamationTriangle />}
                      {item.status === 'SAFE' && <FaCheckCircle />}
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline Styles for this component */}
      <style>{`
        .smart-restock-container {
          padding: 20px;
          background: white;
          border-radius: 12px;
        }
        .smart-restock-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .smart-restock-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .smart-restock-title h3 {
          margin: 0;
          font-size: 20px;
        }
        .smart-restock-subtitle {
          margin: 4px 0 0;
          color: #6B7280;
          font-size: 13px;
        }
        .ai-icon {
          font-size: 32px;
          color: #8B5CF6;
        }
        .smart-restock-actions {
          display: flex;
          gap: 10px;
        }
        .refresh-btn, .export-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .refresh-btn {
          background: #E0E7FF;
          color: #4F46E5;
        }
        .refresh-btn:hover {
          background: #C7D2FE;
        }
        .export-btn {
          background: #10B981;
          color: white;
        }
        .export-btn:hover {
          background: #059669;
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .loading-container, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #6B7280;
          gap: 12px;
        }
        .loading-spinner {
          font-size: 32px;
          animation: spin 1s linear infinite;
          color: #4F46E5;
        }
        .chart-section {
          background: #F9FAFB;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .chart-section h4 {
          margin: 0 0 16px;
          font-size: 14px;
          color: #374151;
        }
        .forecast-table-container {
          overflow-x: auto;
        }
        .forecast-table {
          width: 100%;
          border-collapse: collapse;
        }
        .forecast-table th, .forecast-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #E5E7EB;
        }
        .forecast-table th {
          background: #F9FAFB;
          font-size: 12px;
          text-transform: uppercase;
          color: #6B7280;
          font-weight: 600;
        }
        .forecast-table tbody tr:hover {
          background: #F3F4F6;
        }
        .status-row.status-critical {
          background: #FEF2F2;
        }
        .status-row.status-warning {
          background: #FFFBEB;
        }
      `}</style>
    </div>
  );
};

SmartRestock.propTypes = {
  url: PropTypes.string.isRequired
};

export default SmartRestock;
