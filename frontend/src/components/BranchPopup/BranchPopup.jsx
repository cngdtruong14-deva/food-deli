import React, { useContext } from 'react';
import './BranchPopup.css';
import { assets } from '../../assets/frontend_assets/assets';
import { StoreContext } from '../../context/StoreContext';

const BranchPopup = ({ branch, onClose }) => {
  const { url } = useContext(StoreContext);

  if (!branch) return null;

  return (
    <div className="branch-popup-overlay" onClick={onClose}>
      <div className="branch-popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="branch-popup-header">
            {/* Fallback to header_img if branch image is empty */}
           <img 
             src={branch.image ? `${url}/images/${branch.image}` : assets.header_img} 
             alt={branch.name} 
             className="branch-popup-image" 
           />
           <button className="branch-popup-close" onClick={onClose}>&times;</button>
        </div>
        <div className="branch-popup-content">
          <h2>{branch.name}</h2>
          
          <div className="branch-info-row">
            <span className="icon">📍</span>
            <p>{branch.address}</p>
          </div>
          
          <div className="branch-info-row">
             <span className="icon">📞</span>
             <p>{branch.phone || "Liên hệ hotline"}</p>
          </div>

          <div className="branch-info-grid">
               <div className="branch-info-item">
                   <span className="icon">🕒</span>
                   <span>{branch.openingHours || "08:00 - 23:00"}</span>
               </div>
               <div className="branch-info-item">
                   <span className="icon">👥</span>
                   <span>{branch.capacity || "300 người"}</span>
               </div>
               <div className="branch-info-item">
                   <span className="icon">🏢</span>
                   <span>{branch.floors || "2 Tầng"}</span>
               </div>
          </div>

          <div className="branch-popup-actions">
            <button onClick={onClose}>Đóng</button>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`} target="_blank" rel="noopener noreferrer" className="map-btn">
                Xem Bản Đồ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchPopup;
