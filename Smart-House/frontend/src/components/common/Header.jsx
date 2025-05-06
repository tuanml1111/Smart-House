import React from 'react';

const Header = ({ onLogout }) => {
  return (
    <header className="header">
      <div className="logo">
        <h1>YoloHome</h1>
      </div>
      <div className="header-actions">
        <div className="user-info">
          <span className="user-name">Admin</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;