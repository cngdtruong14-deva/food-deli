import { useContext, useEffect, useState } from "react";
import "./Reviews.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";

const Reviews = () => {
  const { url, branches } = useContext(StoreContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("all");

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/reviews/public/${selectedBranch}`);
      if (response.data.success) {
        setReviews(response.data.data);
      }
    } catch (error) {
      console.error("Fetch reviews error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [selectedBranch]);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={`star ${i < rating ? "filled" : ""}`}>★</span>
    ));
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="public-reviews">
      <div className="reviews-hero">
        <h1>Đánh giá từ khách hàng</h1>
        <p>Những trải nghiệm thực tế từ thực khách</p>
        
        {reviews.length > 0 && (
          <div className="rating-summary">
            <span className="big-rating">{avgRating}</span>
            <div className="rating-details">
              <div className="stars-row">{renderStars(Math.round(avgRating))}</div>
              <span>{reviews.length} đánh giá</span>
            </div>
          </div>
        )}
      </div>

      <div className="reviews-container">
        {/* Filter by Branch */}
        <div className="reviews-filter">
          <select 
            value={selectedBranch} 
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="all">Tất cả chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>{branch.name}</option>
            ))}
          </select>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="loading-state">Đang tải đánh giá...</div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">⭐</span>
            <h3>Chưa có đánh giá nào</h3>
            <p>Hãy là người đầu tiên đánh giá!</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="avatar">{review.reviewerName.charAt(0)}</div>
                    <div>
                      <span className="reviewer-name">{review.reviewerName}</span>
                      <span className="review-date">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                  <div className="review-rating">
                    {renderStars(review.rating)}
                  </div>
                </div>

                {review.comment && (
                  <p className="review-comment">{review.comment}</p>
                )}

                {/* Admin Reply */}
                {review.adminReply && (
                  <div className="admin-reply">
                    <div className="reply-header">
                      <span className="reply-badge">🏪 Phản hồi từ cửa hàng</span>
                      <span className="reply-date">{formatDate(review.adminReply.repliedAt)}</span>
                    </div>
                    <p className="reply-text">{review.adminReply.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
