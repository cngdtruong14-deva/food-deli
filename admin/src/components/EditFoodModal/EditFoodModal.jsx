import React, { useState, useEffect } from 'react';
import './EditFoodModal.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const EditFoodModal = ({ isOpen, onClose, item, url, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: 100
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                description: item.description || '',
                price: item.price || '',
                category: item.category || '',
                stock: item.stock || 100
            });
            // Set existing image as preview
            setPreview(`${url}/images/${item.image}`);
            setImage(null);
        }
    }, [item, url]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${url}/api/food/categories`);
                if (response.data.success) {
                    setCategories(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch categories");
            }
        };
        fetchCategories();
    }, [url]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            
            // Create FormData object for file upload
            const data = new FormData();
            data.append("id", item._id);
            data.append("name", formData.name);
            data.append("description", formData.description);
            data.append("price", Number(formData.price));
            data.append("category", formData.category);
            data.append("stock", Number(formData.stock));
            
            // Append file if selected
            if (image) {
                data.append("image", image);
            }

            const response = await axios.post(`${url}/api/food/update`, data, {
                headers: { 
                    token,
                    // Content-Type is auto-set by axios for FormData
                }
            });

            if (response.data.success) {
                toast.success('Cập nhật món ăn thành công');
                onUpdate();
                onClose();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Có lỗi xảy ra khi cập nhật');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="edit-modal-overlay" onClick={onClose}>
            <div className="edit-modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="edit-modal-title">Chỉnh sửa món ăn</h2>
                <form onSubmit={handleSubmit}>
                    {/* Image Preview Area */}
                    <div className="edit-image-section">
                        <label htmlFor="edit-image-upload" className="image-preview-label">
                            <img src={preview} alt="Preview" className="image-preview" />
                            <div className="image-overlay">
                                <span>Đổi ảnh</span>
                            </div>
                        </label>
                        <input 
                            type="file" 
                            id="edit-image-upload" 
                            hidden 
                            onChange={handleImageChange} 
                            accept="image/*"
                        />
                    </div>

                    <div className="edit-form-group">
                        <label>Tên món</label>
                        <input name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    
                    <div className="edit-form-group">
                        <label>Mô tả</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="3" required />
                    </div>
                    
                    <div className="edit-form-group" style={{display: 'flex', gap: '15px'}}>
                         <div style={{flex: 1}}>
                            <label>Giá (VNĐ)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} required />
                         </div>
                         <div style={{flex: 1}}>
                            <label>Tồn kho</label>
                            <input type="number" name="stock" value={formData.stock} onChange={handleChange} />
                         </div>
                    </div>

                    <div className="edit-form-group">
                        <label>Danh mục</label>
                        <select name="category" value={formData.category} onChange={handleChange} required>
                            <option value="" disabled>Chọn danh mục</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="edit-modal-actions">
                        <button type="button" className="edit-btn cancel" onClick={onClose}>Hủy</button>
                        <button type="submit" className="edit-btn save">Lưu thay đổi</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditFoodModal;
