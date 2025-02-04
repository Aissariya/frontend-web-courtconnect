import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-10">
        <nav className="px-6 border-b border-gray-100">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-12">
              <span className="font-bold text-lg">COURT CONNECT</span>
              <div className="flex items-center space-x-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-full text-sm ${
                      isActive(item.path)
                        ? 'bg-[#DDFBE0] text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">
                <Bell size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-6">
        {/* Date Filter Row */}
        <div className="mb-6 flex items-center space-x-4">
          <span className="text-sm text-gray-500">December 2024</span>
          <select className="text-sm border border-gray-200 rounded-md px-2 py-1">
            <option>Monthly</option>
          </select>
          <button className="text-sm border border-gray-200 rounded-md px-3 py-1">
            Filter
          </button>
        </div>

        {/* Page Content */}
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;