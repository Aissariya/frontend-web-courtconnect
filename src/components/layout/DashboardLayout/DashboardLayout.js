import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/dashboard/refund-request', label: 'Refund Request' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/dashboard/field-management', label: 'Field Management' },
    { path: '/dashboard/profile', label: 'Profile' }
  ];

  return (
    <div className="dashboard">
      <header>
        <nav>
          <div className="nav-container">
            <span className="logo">COURT CONNECT</span>
            <div className="menu-items">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`menu-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="right-section">
              <button className="icon-button">
                <Bell size={20} />
              </button>
              <div className="avatar"></div>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;