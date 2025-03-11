import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import Swal from 'sweetalert2';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [profileImage, setProfileImage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userCourts, setUserCourts] = useState([]);
  
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
            setCurrentUser(userData);
            
            // เปลี่ยนจาก profilePicture เป็น profileImage
            if (userData.profileImage) {
              setProfileImage(userData.profileImage);
            }
            
            // ดึงข้อมูลสนามที่เป็นของผู้ใช้นี้
            await fetchUserCourts(userData.user_id);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    
    const fetchUserCourts = async (userId) => {
      try {
        // สมมติว่ามีฟิลด์ owner_id ใน collection Court ที่ระบุเจ้าของสนาม
        const courtsQuery = query(collection(db, "Court"), where("user_id", "==", userId));
        const courtsSnapshot = await getDocs(courtsQuery);
        
        const courts = courtsSnapshot.docs.map(doc => doc.data().court_id);
        console.log("User courts:", courts);
        setUserCourts(courts);
      } catch (error) {
        console.error("Error fetching user courts:", error);
      }
    };
    
    fetchUserProfile();
  }, []);

  // ติดตามคำขอคืนเงินที่เกี่ยวข้องกับสนามของผู้ใช้
  useEffect(() => {
    console.log("Setting up refund notification listener");
    
    const unsubscribe = onSnapshot(collection(db, "Refund"), async (snapshot) => {
      try {
        // กรองเฉพาะเอกสารที่มีสถานะ "Need Action"
        const needActionDocs = snapshot.docs.filter(doc => doc.data().status === "Need Action");
        
        if (needActionDocs.length === 0) {
          setHasNewRequest(false);
          return;
        }
        
        // ตรวจสอบคำขอคืนเงินแต่ละรายการ
        const relevantRequests = await Promise.all(needActionDocs.map(async (refundDoc) => {
          const refundData = refundDoc.data();
          
          // 1. เช็คข้อมูล Booking ที่ตรงกัน
          const bookingQuery = query(collection(db, "Booking"), where("booking_id", "==", refundData.booking_id));
          const bookingSnapshot = await getDocs(bookingQuery);
          
          if (bookingSnapshot.empty) {
            console.log(`No matching booking found for booking_id: ${refundData.booking_id}`);
            return false;
          }
          
          const bookingData = bookingSnapshot.docs[0].data();
          
          // 2. เช็คว่า court_id ตรงกับสนามของผู้ใช้หรือไม่
          if (!bookingData.court_id || !userCourts.includes(bookingData.court_id)) {
            console.log(`Court (${bookingData.court_id}) is not owned by the user or not found`);
            return false;
          }
          
          // ผ่านทุกเงื่อนไข - คำขอคืนเงินนี้เกี่ยวข้องกับสนามของผู้ใช้
          return true;
        }));
        
        // มีอย่างน้อยหนึ่งคำขอที่เกี่ยวข้องกับสนามของผู้ใช้
        const hasRelevantRequest = relevantRequests.some(result => result === true);
        
        if (hasRelevantRequest) {
          console.log("Found relevant refund requests for user's courts");
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
      } catch (error) {
        console.error("Error checking refund requests:", error);
      }
    }, (error) => {
      console.error("Error in Refund listener:", error);
    });
    
    return () => {
      console.log("Cleaning up notification listener");
      unsubscribe();
    };
  }, [userCourts]); // เฉพาะเมื่อ userCourts เปลี่ยนแปลง

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