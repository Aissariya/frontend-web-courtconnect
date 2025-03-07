import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import './DashboardLayout.css';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [profilePicture, setProfilePicture] = useState(null);
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/dashboard/refund-request', label: 'Refund Request' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/dashboard/field-management', label: 'Field Management' },
    { path: '/dashboard/profile', label: 'Profile' }
  ];

  // Fetch user profile picture
  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const auth = getAuth();
        const db = getFirestore();
        
        // Ensure user is authenticated
        const currentUser = auth.currentUser;
        if (!currentUser) {
          return;
        }

        // Get user document from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.profilePicture) {
            setProfilePicture(userData.profilePicture);
          }
        }
      } catch (err) {
        console.error('Error fetching profile picture:', err);
      }
    };

    fetchProfilePicture();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = async () => {
    try {
      // Show confirmation dialog
      const result = await Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to log out?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Logging out...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Get Firebase auth instance
        const auth = getAuth();
        
        // Sign out from Firebase
        await signOut(auth);
        
        // Clear localStorage data
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('sessionTimestamp');
        sessionStorage.removeItem('sessionActive');
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Logged Out Successfully',
          text: 'You have been logged out.',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          // Navigate to login page
          navigate('/login');
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      
      // Show error message
      Swal.fire({
        icon: 'error',
        title: 'Logout Failed',
        text: 'An error occurred while logging out. Please try again.',
        confirmButtonColor: '#3085d6'
      });
    }
  };

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
              <div className="avatar-container" ref={dropdownRef}>
                <div 
                  className={`avatar ${profilePicture ? 'avatar-with-image' : ''}`}
                  onClick={toggleDropdown}
                  style={profilePicture ? { backgroundImage: `url(${profilePicture})` } : {}}
                ></div>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <button className="logout-button" onClick={handleLogout}>
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
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