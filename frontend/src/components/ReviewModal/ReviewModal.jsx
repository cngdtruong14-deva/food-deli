import { useState } from "react";
import "./ReviewModal.css";
import axios from "axios";
import { toast } from "react-toastify";

const ReviewModal = ({ isOpen, onClose, orderId, url, token, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${url}/api/reviews/submit`,
        { orderId, rating, comment },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Cảm ơn bạn đã đánh giá! 🎉");
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(response.data.message || "Không thể gửi đánh giá");
      }
    } catch (error) {
      console.error("Review submit error:", error);
      toast.error("Lỗi kết nối, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= (hoverRating || rating) ? "filled" : ""}`}
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const getRatingText = () => {
    const texts = ["", "Rất tệ 😞", "Tệ 😕", "Bình thường 😐", "Tốt 😊", "Tuyệt vời 🤩"];
    return texts[hoverRating || rating] || "Chạm để đánh giá";
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <button className="review-modal-close" onClick={onClose}>×</button>
        
        <div className="review-modal-header">
          <h2>Đánh giá đơn hàng</h2>
          <p>Chia sẻ trải nghiệm của bạn với chúng tôi</p>
        </div>

        <div className="review-modal-body">
          <div className="star-rating-container">
            <div className="stars">{renderStars()}</div>
            <span className="rating-text">{getRatingText()}</span>
          </div>

          <div className="comment-container">
            <textarea
              placeholder="Nhập nhận xét của bạn (tùy chọn)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <span className="char-count">{comment.length}/500</span>
          </div>
        </div>

        <div className="review-modal-footer">
          <button 
            className="review-cancel-btn" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button 
            className="review-submit-btn" 
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
