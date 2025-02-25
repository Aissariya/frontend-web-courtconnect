import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Swal from 'sweetalert2';

const PrivateRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    // First check localStorage for quicker response
    const localAuthStatus = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!localAuthStatus) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    // Then verify with Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is authenticated
        setIsAuthenticated(true);
      } else {
        // User is not authenticated
        setIsAuthenticated(false);
        // Remove from localStorage since Firebase says not authenticated
        localStorage.removeItem('isLoggedIn');
        
        // Optional: Show notification that session expired
        Swal.fire({
          icon: 'info',
          title: 'Session Expired',
          text: 'Please login again to continue',
          confirmButtonColor: '#3085d6',
        });
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [auth]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Checking authentication...
        </div>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render child components if authenticated
  return <Outlet />;
};

export default PrivateRoute;