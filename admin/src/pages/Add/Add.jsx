import { useState, useContext, useEffect } from "react";
import "./Add.css";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Add = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [image, setImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: 100,
  });

  const fetchCategories = async () => {
    const response = await axios.get(`${url}/api/food/categories`);
    if (response.data.success) {
      setCategories(response.data.data);
      if (response.data.data.length > 0) {
        setData((prev) => ({ ...prev, category: response.data.data[0]._id }));
      }
    }
  };

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", Number(data.price));
    formData.append("categoryId", data.category);
    formData.append("stock", Number(data.stock));
    formData.append("image", image);

    const response = await axios.post(`${url}/api/food/add`, formData, {
      headers: { token },
    });
    if (response.data.success) {
      setData({
        name: "",
        description: "",
        price: "",
        category: categories.length > 0 ? categories[0]._id : "",
        stock: 100,
      });
      setImage(false);
      toast.success(response.data.message);
    } else {
      toast.error(response.data.message);
    }
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Vui lòng đăng nhập");
      navigate("/");
    }
    fetchCategories();
  }, []);

  return (
    <div className="add">
      <form onSubmit={onSubmitHandler} className="flex-col">
        <div className="add-img-upload flex-col">
          <p>Tải ảnh món ăn</p>
          <label htmlFor="image">
            <img
              src={image ? URL.createObjectURL(image) : assets.upload_area}
              alt=""
            />
          </label>
          <input
            onChange={(e) => setImage(e.target.files[0])}
            type="file"
            id="image"
            hidden
            required
          />
        </div>
        <div className="add-product-name flex-col">
          <p>Tên món ăn</p>
          <input
            onChange={onChangeHandler}
            value={data.name}
            type="text"
            name="name"
            placeholder="Nhập tên món"
            required
          />
        </div>
        <div className="add-product-description flex-col">
          <p>Mô tả món ăn</p>
          <textarea
            onChange={onChangeHandler}
            value={data.description}
            name="description"
            rows="6"
            placeholder="Nhập mô tả món ăn"
            required
          ></textarea>
        </div>
        <div className="add-category-price">
          <div className="add-category flex-col">
            <p>Danh mục</p>
            <select
              name="category"
              required
              onChange={onChangeHandler}
              value={data.category}
            >
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="add-price flex-col">
            <p>Giá</p>
            <input
              onChange={onChangeHandler}
              value={data.price}
              type="Number"
              name="price"
              placeholder="Ví dụ: 50000"
              required
            />
          </div>
          <div className="add-price flex-col">
            <p>Tồn kho</p>
            <input
              onChange={onChangeHandler}
              value={data.stock}
              type="Number"
              name="stock"
              placeholder="100"
              min="0"
            />
          </div>
        </div>
        <button type="submit" className="add-btn">
          THÊM MÓN
        </button>
      </form>
    </div>
  );
};

export default Add;
