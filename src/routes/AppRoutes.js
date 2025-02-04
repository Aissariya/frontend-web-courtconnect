import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import PrivateRoute from './PrivateRoute';

// นำเข้าหน้า Auth
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// นำเข้าหน้าหลังล็อกอิน
import Dashboard from '../pages/dashboard/Dashboard';
import FieldManagement from '../pages/field/FieldManagement';
import Profile from '../pages/dashboard/Profile';
import RefundRequest from '../pages/refund/RefundRequest';

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
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* หน้าที่ต้องล็อกอิน */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="field-management" element={<FieldManagement />} />
          <Route path="profile" element={<Profile />} />
          <Route path="refund-request" element={<RefundRequest />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;