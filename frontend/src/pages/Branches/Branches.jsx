import React, { useContext, useState } from 'react';
import './Branches.css';
import { StoreContext } from '../../context/StoreContext';
import BranchPopup from '../../components/BranchPopup/BranchPopup';
import { assets } from '../../assets/frontend_assets/assets';

const Branches = () => {
    const { branches, url } = useContext(StoreContext);
    const [selectedBranch, setSelectedBranch] = useState(null);

    return (
        <div className='branches-page' id='branches'>
            <div className="branches-header">
                <h2>Hệ Thống Chi Nhánh</h2>
                <p>Khám phá không gian ẩm thực đẳng cấp tại các cơ sở của Freedom</p>
            </div>
            
            <div className="branches-list">
                {branches.map((branch, index) => (
                    <div key={index} className="branch-card" onClick={() => setSelectedBranch(branch)}>
                        <div className="branch-img-container">
                            <img 
                                src={branch.image ? `${url}/images/${branch.image}` : assets.header_img} 
                                alt={branch.name} 
                            />
                        </div>
                        <div className="branch-info">
                            <h3>{branch.name}</h3>
                            <p className="branch-address">📍 {branch.address}</p>
                            <p className="branch-phone">📞 {branch.phone}</p>
                            <div className="branch-meta">
                                <span>🕒 {branch.openingHours}</span>
                                <span>🏢 {branch.floors}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <BranchPopup branch={selectedBranch} onClose={() => setSelectedBranch(null)} />
        </div>
    );
}

export default Branches;
