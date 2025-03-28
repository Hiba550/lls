import React from 'react';
import { NavLink } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-blue-600 text-white py-4 px-6 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold">Integrated Production & QA System</h1>
      </div>
      <nav className="flex space-x-4">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `px-3 py-2 rounded ${isActive ? 'bg-blue-700' : 'hover:bg-blue-500'}`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            `px-3 py-2 rounded ${isActive ? 'bg-blue-700' : 'hover:bg-blue-500'}`
          }
        >
          Inventory
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `px-3 py-2 rounded ${isActive ? 'bg-blue-700' : 'hover:bg-blue-500'}`
          }
        >
          Reports
        </NavLink>
        <NavLink
          to="/assembly"
          className={({ isActive }) =>
            `px-3 py-2 rounded ${isActive ? 'bg-blue-700' : 'hover:bg-blue-500'}`
          }
        >
          Assembly
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `px-3 py-2 rounded ${isActive ? 'bg-blue-700' : 'hover:bg-blue-500'}`
          }
        >
          Settings
        </NavLink>
      </nav>
    </header>
  );
};

export default Header;