import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import Swal from 'sweetalert2';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [profileImage, setProfileImage] = useState(null);
  
  const [hasNewRequest, setHasNewRequest] = useState(false); // แสดงจุดแดง
  const [showNotification, setShowNotification] = useState(false); // popup แจ้งเตือน
  const [hasViewedRequests, setHasViewedRequests] = useState(false); // ตรวจสอบว่ากด View Requests แล้วหรือยัง
  const notificationRef = useRef(null);

  // ดึงข้อมูลโปรไฟล์ผู้ใช้
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // เปลี่ยนจาก profilePicture เป็น profileImage
            if (userData.profileImage) {
              setProfileImage(userData.profileImage);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Refund"), (snapshot) => {
      const pendingRequests = snapshot.docs.filter(doc => doc.data().status === "Need Action");

      if (pendingRequests.length > 0) {
        setHasNewRequest(true);
        setShowNotification(true);
        setHasViewedRequests(false);

        const hidePopupTimer = setTimeout(() => {
          setShowNotification(false);
        }, 120000);

        return () => clearTimeout(hidePopupTimer);
      } else {
        setHasNewRequest(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleViewRequests = () => {
    setHasNewRequest(false);
    setShowNotification(false);
    setHasViewedRequests(true);
    navigate('/dashboard/refund-request?status=Need Action');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleNotificationPopup = () => {
    if (hasNewRequest && !hasViewedRequests) {
      setShowNotification(!showNotification);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotification(false);
      }
    };

    if (showNotification) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotification]);

  const handleLogout = async () => {
    try {
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
        Swal.fire({
          title: 'Logging out...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        const auth = getAuth();
        await signOut(auth);

        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('sessionTimestamp');
        sessionStorage.removeItem('sessionActive');

        Swal.fire({
          icon: 'success',
          title: 'Logged Out Successfully',
          text: 'You have been logged out.',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/login');
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
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
              <Link to="/dashboard/refund-request" className={`menu-link ${location.pathname === '/dashboard/refund-request' ? 'active' : ''}`}>
                Refund Request
              </Link>
              <Link to="/dashboard" className={`menu-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link to="/dashboard/field-management" className={`menu-link ${location.pathname === '/dashboard/field-management' ? 'active' : ''}`}>
                Field Management
              </Link>
              <Link to="/dashboard/profile" className={`menu-link ${location.pathname === '/dashboard/profile' ? 'active' : ''}`}>
                Profile
              </Link>
            </div>
            <div className="right-section">
              {/* ปุ่ม Bell */}
              <div className="notification-container" ref={notificationRef}>
                <button className="icon-button" onClick={toggleNotificationPopup}>
                  <Bell size={20} />
                  {hasNewRequest && <span className="notification-badge"></span>}
                </button>

                {/* Popup แจ้งเตือน */}
                {showNotification && (
                  <div className="notification-popup show">
                    <p>A refund request is pending your approval.<br />Please review and take action.</p>
                    <button className="view-request-button" onClick={handleViewRequests}>
                      View Requests
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar และ Dropdown Menu */}
              <div className="avatar-container" ref={dropdownRef}>
                <div 
                  className="avatar" 
                  onClick={toggleDropdown}
                  style={profileImage ? {
                    backgroundImage: `url(${profileImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {}}
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