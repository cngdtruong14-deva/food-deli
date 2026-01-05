import React, { useState, useContext, useEffect } from "react";
import "./Table.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const AddTable = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState({
    branchId: "",
    tableNumber: "",
    capacity: 4,
  });

  const fetchBranches = async () => {
    const response = await axios.get(`${url}/api/branch/list`);
    if (response.data.success) {
      setBranches(response.data.data);
      if (response.data.data.length > 0) {
        setData((prev) => ({ ...prev, branchId: response.data.data[0]._id }));
      }
    }
  };

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const response = await axios.post(`${url}/api/table/add`, data, {
      headers: { token },
    });
    if (response.data.success) {
      toast.success(response.data.message);
      navigate("/tables");
    } else {
      toast.error(response.data.message);
    }
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
    }
    fetchBranches();
  }, []);

  return (
    <div className="add">
      <form onSubmit={onSubmitHandler} className="flex-col">
        <h2>Add New Table</h2>
        
        <div className="add-category flex-col">
          <p>Select Branch</p>
          <select
            name="branchId"
            required
            onChange={onChangeHandler}
            value={data.branchId}
          >
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="add-product-name flex-col">
          <p>Table Number</p>
          <input
            onChange={onChangeHandler}
            value={data.tableNumber}
            type="text"
            name="tableNumber"
            placeholder="e.g., T-01 or A1"
            required
          />
        </div>

        <div className="add-product-name flex-col">
          <p>Capacity</p>
          <input
            onChange={onChangeHandler}
            value={data.capacity}
            type="number"
            name="capacity"
            min="1"
            placeholder="4"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="add-btn">
            Add Table
          </button>
          <button type="button" className="cancel-btn" onClick={() => navigate("/tables")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTable;
