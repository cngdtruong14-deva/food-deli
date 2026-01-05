import React, { useEffect, useState } from "react";
import "./List.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const List = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [list, setList] = useState([]);

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list`);
    if (response.data.success) {
      setList(response.data.data);
    } else {
      toast.error("Lỗi tải danh sách");
    }
  };

  const removeFood = async (foodId) => {
    const response = await axios.post(
      `${url}/api/food/remove`,
      { id: foodId },
      { headers: { token } }
    );
    await fetchList();
    if (response.data.success) {
      toast.success("Đã xóa món ăn");
    } else {
      toast.error("Có lỗi xảy ra");
    }
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Vui lòng đăng nhập trước");
      navigate("/");
    }
    fetchList();
  }, []);

  return (
    <div className="list add flex-col">
      <p>Danh sách món ăn ({list.length} món)</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Hình ảnh</b>
          <b>Tên món</b>
          <b>Danh mục</b>
          <b>Giá</b>
          <b>Tồn kho</b>
          <b>Thao tác</b>
        </div>
        {list.map((item, index) => {
          return (
            <div key={index} className="list-table-format">
              <img src={`${url}/images/` + item.image} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>{item.price.toLocaleString('vi-VN')} đ</p>
              <p>{item.stock || 100}</p>
              <p onClick={() => removeFood(item._id)} className="cursor">
                Xóa
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default List;
