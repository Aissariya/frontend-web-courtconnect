import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout/DashboardLayout';
import PrivateRoute from './PrivateRoute';
import React from 'react';

// นำเข้าหน้า Auth
import Login from '../pages/auth/LoginPage';
import Register from '../pages/auth/RegisterPage';
import ForgotPassword from '../pages/auth/ForgotPasswordPage';

// นำเข้าหน้าหลังล็อกอิน
import Dashboard from '../pages/dashboard/DashboardPage';
import FieldManagement from '../pages/field/FieldManagementPage';
import Profile from '../pages/profile/ProfilePage';
import RefundRequest from '../pages/refund/RefundRequestPage';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect ไปหน้า login เมื่อเข้า path / */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* หน้าที่ไม่ต้องล็อกอิน */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
        </Route>

        {/* หน้าที่ต้องล็อกอิน - ใช้ PrivateRoute */}
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/field-management" element={<FieldManagement />} />
            <Route path="/dashboard/profile" element={<Profile />} />
            <Route path="/dashboard/refund-request" element={<RefundRequest />} />
          </Route>
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;