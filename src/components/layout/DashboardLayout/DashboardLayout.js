import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
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
  const [userCourts, setUserCourts] = useState([]);
  const [courtsMap, setCourtsMap] = useState({});
  
  const [hasNewRequest, setHasNewRequest] = useState(false); // แสดงจุดแดง
  const [showNotification, setShowNotification] = useState(false); // popup แจ้งเตือน
  const [hasViewedRequests, setHasViewedRequests] = useState(false); // ตรวจสอบว่ากด View Requests แล้วหรือยัง
  const notificationRef = useRef(null);
  const auth = getAuth();

  // ดึงข้อมูลโปรไฟล์ผู้ใช้และสนามของผู้ใช้
  useEffect(() => {
    const fetchUserData = async (user) => {
      try {
        if (!user) {
          console.log('No user provided');
          return;
        }

        console.log('Fetching data for user:', user.uid);
        
        // ดึงข้อมูล user_id จาก Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          console.log('User document not found');
          return;
        }

        const userData = userDoc.data();
        
        // เปลี่ยนจาก profilePicture เป็น profileImage
        if (userData.profileImage) {
          setProfileImage(userData.profileImage);
        }
        
        const userIdForQuery = userData.user_id;
        console.log('Using user_id for query:', userIdForQuery);

        // ดึงข้อมูล Courts ทั้งหมดที่เป็นของ user นี้
        const courtsRef = collection(db, 'Court');
        const courtsQuery = query(courtsRef, where("user_id", "==", userIdForQuery));
        const courtsSnapshot = await getDocs(courtsQuery);
        
        // เก็บสนามที่เป็นของ user ปัจจุบัน
        const userCourtIds = [];
        const courtsMapData = {};
        
        courtsSnapshot.forEach(doc => {
          const court = doc.data();
          courtsMapData[court.court_id] = court;
          userCourtIds.push(court.court_id);
        });
        
        console.log('User owned courts:', userCourtIds.length, userCourtIds);
        setUserCourts(userCourtIds);
        setCourtsMap(courtsMapData);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user);
      } else {
        navigate('/login');
      }
    });
    
    return () => unsubscribe();
  }, [auth, navigate]);

  // ติดตามคำขอคืนเงินที่เกี่ยวข้องกับสนามของผู้ใช้
  useEffect(() => {
    if (userCourts.length === 0) return;
    
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
          
          // 1. เช็คข้อมูล Booking ที่มี booking_id ตรงกับที่อยู่ใน Refund
          const bookingQuery = query(collection(db, "Booking"), where("booking_id", "==", refundData.booking_id));
          const bookingSnapshot = await getDocs(bookingQuery);
          
          if (bookingSnapshot.empty) {
            console.log(`No matching booking found for booking_id: ${refundData.booking_id}`);
            return false;
          }
          
          const bookingData = bookingSnapshot.docs[0].data();
          
          // 2. เช็คว่า court_id ตรงกับสนามของผู้ใช้หรือไม่
          if (!bookingData.court_id) {
            console.log(`Booking doesn't have court_id: ${refundData.booking_id}`);
            return false;
          }
          
          if (!userCourts.includes(bookingData.court_id)) {
            console.log(`Court ID ${bookingData.court_id} is not owned by this user`);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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