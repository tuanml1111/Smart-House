// frontend/src/components/common/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <nav className="nav">
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/devices" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="fas fa-plug"></i>
              <span>Devices</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/sensors" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="fas fa-thermometer-half"></i>
              <span>Sensors</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/alerts" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="fas fa-bell"></i>
              <span>Alerts</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/alert-config" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="fas fa-sliders-h"></i>
              <span>Alert Config</span>
            </NavLink>
          </li>
          {/* Thêm AI Prediction vào sidebar */}
          <li className="nav-item">
            <NavLink to="/ai-prediction" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="fas fa-brain"></i>
              <span>AI </span>
            </NavLink>
          </li>
          
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;