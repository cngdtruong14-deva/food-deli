import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { StoreContext } from '../../context/StoreContext';
import './ReviewSection.css';
import { assets } from '../../assets/frontend_assets/assets'; // Assuming icons/assets are here or use raw SVG
// Since we don't have antd or react-icons guaranteed, we'll try to use what's available or SVGs.
// Checking previous files, 'assets' object has ratings.
// But for dynamic stars, SVGs are better.

const StarIcon = ({ filled, half }) => (
    <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill={filled ? "#fadb14" : "#e5e7eb"} 
        stroke={filled ? "#fadb14" : "#e5e7eb"}
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginRight: '2px' }}
    >
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
);

const ReviewSection = ({ foodId }) => {
    const { url } = useContext(StoreContext);
    const [stats, setStats] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchReviews = async (pageNum, isLoadMore = false) => {
        try {
            if (!isLoadMore) setLoading(true);
            else setLoadingMore(true);

            const response = await axios.get(`${url}/api/review/product/${foodId}?page=${pageNum}&limit=5`);
            if (response.data.success) {
                setStats(response.data.stats);
                setTotalPages(response.data.pagination.pages);
                
                if (isLoadMore) {
                    setReviews(prev => [...prev, ...response.data.reviews]);
                } else {
                    setReviews(response.data.reviews);
                }
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (foodId) {
            setPage(1);
            fetchReviews(1);
        }
    }, [foodId]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchReviews(nextPage, true);
    };

    const renderStars = (rating) => {
        return (
            <div className="review-stars-display">
                {[1, 2, 3, 4, 5].map(star => (
                    <StarIcon key={star} filled={star <= Math.round(rating)} />
                ))}
            </div>
        );
    };

    if (loading && page === 1) {
        return (
             <div className="review-section-container">
                 <div className="review-skeleton-header"></div>
                 <div className="review-skeleton-list"></div>
             </div>
        );
    }

    if (!stats || stats.totalReviews === 0) {
        return (
            <div className="review-section-container empty-state">
                <h3>Chưa có đánh giá nào</h3>
                <p>Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận!</p>
            </div>
        );
    }

    return (
        <div className="review-section-container">
            <h3 className="review-section-title">Đánh giá & Nhận xét</h3>
            
            {/* Dashboard / Stats */}
            <div className="review-dashboard">
                <div className="review-overview">
                    <div className="review-score">{stats.averageRating}</div>
                    <div className="review-score-stars">
                        {renderStars(stats.averageRating)}
                    </div>
                    <p className="review-count">Dựa trên {stats.totalReviews} đánh giá</p>
                </div>
                
                <div className="review-histogram">
                    {[5, 4, 3, 2, 1].map(star => (
                         <div key={star} className="histogram-row">
                             <div className="star-label">{star} ⭐</div>
                             <div className="progress-bar-container">
                                 <div 
                                    className="progress-bar-fill" 
                                    style={{ 
                                        width: `${(stats.distribution[star] / stats.totalReviews) * 100}%` 
                                    }}
                                 ></div>
                             </div>
                             <div className="star-count">{stats.distribution[star]}</div>
                         </div>
                    ))}
                </div>
            </div>

            {/* Review List */}
            <div className="review-list">
                {reviews.map(review => (
                    <div key={review._id} className="review-item">
                        <div className="review-item-header">
                            <div className="reviewer-avatar">
                                {review.reviewerName.charAt(0)}
                            </div>
                            <div className="reviewer-info">
                                <span className="reviewer-name">{review.reviewerName}</span>
                                <div className="reviewer-meta">
                                    {renderStars(review.rating)}
                                    <span className="review-date">
                                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="review-content">
                            {review.comment && <p>{review.comment}</p>}
                        </div>

                        {/* Images */}
                        {review.images && review.images.length > 0 && (
                            <div className="review-images">
                                {review.images.map((img, idx) => (
                                    <img key={idx} src={`${url}/images/${img}`} alt="review-img" />
                                ))}
                            </div>
                        )}

                        {/* Admin Reply */}
                        {review.adminReply && (
                            <div className="admin-reply-box">
                                <strong>Phản hồi từ Admin:</strong>
                                <p>{review.adminReply.text}</p>
                            </div>
                        )}
                        <hr className="review-divider"/>
                    </div>
                ))}
            </div>

            {/* Load More */}
            {page < totalPages && (
                <div className="review-load-more">
                    <button 
                        onClick={handleLoadMore} 
                        disabled={loadingMore}
                        className="load-more-btn"
                    >
                        {loadingMore ? 'Đang tải...' : 'Xem thêm đánh giá'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReviewSection;
