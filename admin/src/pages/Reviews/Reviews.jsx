import { useEffect, useState } from "react";
import "./Reviews.css";
import axios from "axios";
import { toast } from "react-toastify";
import { Star, Eye, X, User, MapPin, ShoppingBag, Phone, Mail, MessageSquare } from "lucide-react";

const Reviews = ({ url }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${url}/api/reviews/admin/list`,
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        setReviews(response.data.data);
      } else {
        toast.error(response.data.message || "Không thể tải đánh giá");
      }
    } catch (error) {
      console.error("Fetch reviews error:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }

    setSubmittingReply(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${url}/api/reviews/admin/reply/${selectedReview._id}`,
        { replyText: replyText.trim() },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Phản hồi thành công!");
        // Update local state
        setReviews(prev => prev.map(r => 
          r._id === selectedReview._id 
            ? { ...r, adminReply: { text: replyText.trim(), repliedAt: new Date() } }
            : r
        ));
        setSelectedReview(prev => ({
          ...prev,
          adminReply: { text: replyText.trim(), repliedAt: new Date() }
        }));
        setReplyText("");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Reply error:", error);
      toast.error("Lỗi khi gửi phản hồi");
    } finally {
      setSubmittingReply(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={16} 
        className={i < rating ? "star-filled" : "star-empty"}
        fill={i < rating ? "#FBBF24" : "none"}
        stroke={i < rating ? "#FBBF24" : "#D1D5DB"}
      />
    ));
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="reviews-admin">
      <div className="reviews-header">
        <h2>Quản lý Đánh giá</h2>
        <p className="reviews-subtitle">
          {reviews.length} đánh giá từ khách hàng
        </p>
      </div>

      {loading ? (
        <div className="loading-state">Đang tải đánh giá...</div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">
          <Star size={48} stroke="#D1D5DB" />
          <h3>Chưa có đánh giá nào</h3>
          <p>Đánh giá từ khách hàng sẽ hiển thị ở đây</p>
        </div>
      ) : (
        <div className="reviews-table-wrapper">
          <table className="reviews-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Chi nhánh</th>
                <th>Khách hàng</th>
                <th>Đánh giá</th>
                <th>Nhận xét</th>
                <th>Phản hồi</th>
                <th>Truy vết</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id}>
                  <td className="date-cell">{formatDate(review.createdAt)}</td>
                  <td>{review.branchName}</td>
                  <td className="customer-cell">
                    <User size={14} />
                    {review.user?.name || "Ẩn danh"}
                  </td>
                  <td className="rating-cell">
                    <div className="stars-row">{renderStars(review.rating)}</div>
                  </td>
                  <td className="comment-cell">
                    {review.comment || <span className="no-comment">Không có</span>}
                  </td>
                  <td className="reply-status-cell">
                    {review.adminReply ? (
                      <span className="replied-badge">✓ Đã trả lời</span>
                    ) : (
                      <span className="pending-reply">Chưa trả lời</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="trace-btn"
                      onClick={() => {
                        setSelectedReview(review);
                        setReplyText("");
                      }}
                    >
                      <Eye size={16} />
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trace Context Modal */}
      {selectedReview && (
        <div className="trace-modal-overlay" onClick={() => setSelectedReview(null)}>
          <div className="trace-modal" onClick={(e) => e.stopPropagation()}>
            <button className="trace-modal-close" onClick={() => setSelectedReview(null)}>
              <X size={20} />
            </button>
            
            <div className="trace-modal-header">
              <h3>Chi tiết & Phản hồi</h3>
              <div className="trace-rating">
                {renderStars(selectedReview.rating)}
                <span className="rating-value">{selectedReview.rating}/5</span>
              </div>
            </div>

            <div className="trace-modal-body">
              {/* Customer Info Section */}
              <div className="trace-section">
                <h4><User size={16} /> Thông tin Khách hàng</h4>
                <div className="trace-info-grid">
                  <div className="trace-info-item">
                    <span className="label">Tên:</span>
                    <span className="value">{selectedReview.user?.name || "Ẩn danh"}</span>
                  </div>
                  <div className="trace-info-item">
                    <Phone size={14} />
                    <span className="label">SĐT:</span>
                    <span className="value">{selectedReview.user?.phone || "Không có"}</span>
                  </div>
                  <div className="trace-info-item">
                    <Mail size={14} />
                    <span className="label">Email:</span>
                    <span className="value">{selectedReview.user?.email || "Không có"}</span>
                  </div>
                </div>
              </div>

              {/* Order Context Section */}
              {selectedReview.orderContext && (
                <>
                  <div className="trace-section">
                    <h4><MapPin size={16} /> Vị trí Phục vụ</h4>
                    <div className="trace-location">
                      {selectedReview.orderContext.table ? (
                        <div className="table-badge">
                          🍽️ Bàn #{selectedReview.orderContext.table.number}
                          <span className="floor-info">
                            (Tầng {selectedReview.orderContext.table.floor || 1})
                          </span>
                        </div>
                      ) : (
                        <div className="delivery-badge">🚚 Giao hàng</div>
                      )}
                      <div className="branch-info">
                        Chi nhánh: {selectedReview.orderContext.branch?.name || selectedReview.branchName}
                      </div>
                    </div>
                  </div>

                  <div className="trace-section">
                    <h4><ShoppingBag size={16} /> Món đã đặt</h4>
                    <div className="order-items-list">
                      {selectedReview.orderContext.items.map((item, idx) => (
                        <div key={idx} className="order-item-row">
                          <span className="item-qty">x{item.quantity}</span>
                          <span className="item-name">{item.name}</span>
                          <span className="item-price">
                            {(item.price * item.quantity).toLocaleString()}đ
                          </span>
                        </div>
                      ))}
                      <div className="order-total">
                        <span>Tổng tiền:</span>
                        <span>{selectedReview.orderContext.amount?.toLocaleString()}đ</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Customer Comment */}
              {selectedReview.comment && (
                <div className="trace-section">
                  <h4>💬 Nhận xét của khách</h4>
                  <div className="full-comment">
                    &ldquo;{selectedReview.comment}&rdquo;
                  </div>
                </div>
              )}

              {/* Admin Reply Section */}
              <div className="trace-section reply-section">
                <h4><MessageSquare size={16} /> Phản hồi từ cửa hàng</h4>
                
                {selectedReview.adminReply ? (
                  <div className="existing-reply">
                    <p className="reply-text">{selectedReview.adminReply.text}</p>
                    <span className="reply-date">
                      Đã trả lời: {formatDate(selectedReview.adminReply.repliedAt)}
                    </span>
                  </div>
                ) : (
                  <div className="reply-form">
                    <textarea
                      placeholder="Nhập phản hồi cho khách hàng..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      maxLength={500}
                      rows={3}
                    />
                    <div className="reply-form-actions">
                      <span className="char-count">{replyText.length}/500</span>
                      <button 
                        className="reply-submit-btn"
                        onClick={handleReply}
                        disabled={submittingReply || !replyText.trim()}
                      >
                        {submittingReply ? "Đang gửi..." : "Gửi phản hồi"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;

