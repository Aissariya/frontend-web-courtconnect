import { Navigate } from 'react-router-dom';
import React from 'react';

const PrivateRoute = ({ children }) => {
  // const isAuthenticated = localStorage.getItem('token');
  const isAuthenticated = true;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;