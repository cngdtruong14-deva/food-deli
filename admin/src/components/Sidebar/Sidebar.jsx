import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <div className="sidebar-options">
        <NavLink to='dashboard' className="sidebar-option">
          <img src={assets.order_icon} alt="" />
          <p>Tổng quan</p>
        </NavLink>
        <hr className="sidebar-divider" />
        <NavLink to='add' className="sidebar-option">
          <img src={assets.add_icon} alt="" />
          <p>Thêm món</p>
        </NavLink>
        <NavLink to='list' className="sidebar-option">
          <img src={assets.order_icon} alt="" />
          <p>Danh sách món</p>
        </NavLink>
        <NavLink to='orders' className="sidebar-option">
          <img src={assets.order_icon} alt="" />
          <p>Đơn hàng</p>
        </NavLink>
        <hr className="sidebar-divider" />
        <NavLink to='branches' className="sidebar-option">
          <img src={assets.order_icon} alt="" />
          <p>Chi nhánh</p>
        </NavLink>
        <NavLink to='tables' className="sidebar-option">
          <img src={assets.order_icon} alt="" />
          <p>Bàn ăn</p>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar
