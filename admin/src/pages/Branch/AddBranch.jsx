import React, { useState, useContext, useEffect } from "react";
import "./Branch.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const AddBranch = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [data, setData] = useState({
    name: "",
    address: "",
    phone: "",
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const response = await axios.post(`${url}/api/branch/add`, data, {
      headers: { token },
    });
    if (response.data.success) {
      toast.success(response.data.message);
      navigate("/branches");
    } else {
      toast.error(response.data.message);
    }
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
    }
  }, []);

  return (
    <div className="add">
      <form onSubmit={onSubmitHandler} className="flex-col">
        <h2>Add New Branch</h2>
        <div className="add-product-name flex-col">
          <p>Branch Name</p>
          <input
            onChange={onChangeHandler}
            value={data.name}
            type="text"
            name="name"
            placeholder="Enter branch name"
            required
          />
        </div>
        <div className="add-product-name flex-col">
          <p>Address</p>
          <input
            onChange={onChangeHandler}
            value={data.address}
            type="text"
            name="address"
            placeholder="Enter address"
            required
          />
        </div>
        <div className="add-product-name flex-col">
          <p>Phone</p>
          <input
            onChange={onChangeHandler}
            value={data.phone}
            type="text"
            name="phone"
            placeholder="Enter phone number"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="add-btn">
            Add Branch
          </button>
          <button type="button" className="cancel-btn" onClick={() => navigate("/branches")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBranch;
