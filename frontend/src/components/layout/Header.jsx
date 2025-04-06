import React from 'react';
import { handleLogout } from '../../api/userApi';

function Header() {
  return (
    <header className="app-header">
      <div className="logo">
        <img src="/logo.png" alt="Logo" />
        <span>LLS Production System</span>
      </div>
      
      <nav className="main-nav">
        {/* Your existing navigation links */}
      </nav>
      
      <div className="user-menu">
        {/* User avatar and dropdown */}
        <div className="user-dropdown">
          <button className="dropdown-toggle">
            <img src="/avatar.png" alt="User Avatar" className="user-avatar" />
            <span className="username">Admin User</span>
          </button>
          <div className="dropdown-menu">
            <a href="/profile">My Profile</a>
            <a href="/preferences">Preferences</a>
            <div className="divider"></div>
            <button 
              className="logout-btn" 
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;