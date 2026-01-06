import React, { useEffect, useState, useContext } from 'react';
import './Trash.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';

const Trash = ({ url }) => {
  const { token, admin } = useContext(StoreContext);
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, type: null, id: null });

  const fetchTrashList = async () => {
    const response = await axios.get(`${url}/api/food/trash`);
    if (response.data.success) {
      setList(response.data.data);
    } else {
      toast.error("Error fetching trash list");
    }
  };

  const handleRestore = async (id) => {
    const response = await axios.post(`${url}/api/food/restore`, { id }, { headers: { token } });
    if (response.data.success) {
      toast.success(response.data.message);
      fetchTrashList();
    } else {
      toast.error("Error restoring food");
    }
  };

  const handleForceDelete = async (id) => {
    const response = await axios.post(`${url}/api/food/force-delete`, { id }, { headers: { token } });
    if (response.data.success) {
      toast.success(response.data.message);
      fetchTrashList();
    } else {
      toast.error("Error deleting food");
    }
  };

  const confirmAction = () => {
    if (modal.type === 'restore') {
      handleRestore(modal.id);
    } else if (modal.type === 'delete') {
      handleForceDelete(modal.id);
    }
    closeModal();
  };

  const openRestoreModal = (id) => {
    setModal({
      isOpen: true,
      type: 'restore',
      id: id,
      title: "Khôi phục món ăn",
      message: "Bạn có chắc muốn khôi phục món ăn này không?"
    });
  };

  const openDeleteModal = (id) => {
    setModal({
      isOpen: true,
      type: 'delete',
      id: id,
      title: "Xóa vĩnh viễn",
      message: "Bạn có chắc chắn muốn xóa vĩnh viễn món ăn này không? Hành động này KHÔNG THỂ hoàn tác!"
    });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: null, id: null });
  };

  useEffect(() => {
    if (!admin && !token) {
        toast.error("Vui lòng đăng nhập");
        navigate("/");
    }
    fetchTrashList();
  }, []);

  return (
    <div className='list add flex-col'>
      <div className="list-header">
        <p>Thùng Rác (Món đã xóa)</p>
      </div>
      <div className="list-table">
        <div className="list-table-format trash-table-format title">
          <b>Ảnh</b>
          <b>Tên</b>
          <b>Danh mục</b>
          <b>Giá</b>
          <b>Tồn kho</b>
          <b>Hành động</b>
        </div>
        {list.map((item, index) => (
          <div key={index} className="list-table-format trash-table-format">
            <img src={`${url}/images/${item.image}`} alt="" className='trash-img' />
            <p>{item.name}</p>
            <p>{item.category}</p>
            <p>${item.price}</p>
            <p>{item.stock}</p>
            <div className="trash-actions">
              <p onClick={() => openRestoreModal(item._id)} className='restore-btn'>Khôi phục</p>
              <p onClick={() => openDeleteModal(item._id)} className='delete-forever-btn'>Xóa vĩnh viễn</p>
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 && <p className="empty-trash">Thùng rác trống</p>}

      <ConfirmModal 
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={confirmAction}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
};

export default Trash;
