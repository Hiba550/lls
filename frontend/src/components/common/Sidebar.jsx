import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-200 h-screen p-4">
      <nav>
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `block p-2 rounded ${isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-300'}`
              }
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `block p-2 rounded ${isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-300'}`
              }
            >
              Inventory
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `block p-2 rounded ${isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-300'}`
              }
            >
              Reports
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/assembly"
              className={({ isActive }) =>
                `block p-2 rounded ${isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-300'}`
              }
            >
              Assembly
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `block p-2 rounded ${isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-300'}`
              }
            >
              Settings
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;