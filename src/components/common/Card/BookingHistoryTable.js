import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card/Card';
import { collection, getDocs, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../../firebaseConfig'; // ปรับ path ตามความเหมาะสม
import './BookingHistoryTable.css';

const BookingHistoryTable = ({ 
  selectedMonth,
  selectedYear,
  selectedFields = [],
  selectedCourtTypes = []
}) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [users, setUsers] = useState({});
  const [courts, setCourts] = useState({});
  const [allFilteredBookings, setAllFilteredBookings] = useState([]); // เก็บข้อมูลที่กรองทั้งหมด
  const [userCourtIds, setUserCourtIds] = useState([]); // เก็บ court_id ที่ user เป็นเจ้าของ
  const bookingsPerPage = 10;
  const auth = getAuth();

  // ดึงข้อมูล Court
  const fetchCourts = async (userId = null) => {
    try {
      const courtsRef = collection(db, "Court");
      const courtsSnapshot = await getDocs(courtsRef);
      
      const courtsData = {};
      const userCourts = []; // เก็บ court_id ที่ user เป็นเจ้าของ
      
      courtsSnapshot.forEach(doc => {
        const data = doc.data();
        courtsData[data.court_id] = data;
        
        // ถ้ามี userId และ court นี้เป็นของ user นั้น ให้เก็บไว้
        if (userId && data.user_id === userId) {
          userCourts.push(data.court_id);
        }
      });
      
      console.log('All courts data:', courtsData);
      setCourts(courtsData);
      
      if (userId) {
        setUserCourtIds(userCourts);
        console.log('User owns courts with IDs:', userCourts);
      }
      
      return { courtsData, userCourts }; // ส่งค่ากลับเพื่อใช้ในฟังก์ชันอื่น
    } catch (err) {
      console.error("Error fetching courts:", err);
      return { courtsData: {}, userCourts: [] };
    }
  };

  // ดึงข้อมูลผู้ใช้
  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      
      const usersData = {};
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.user_id) {
          usersData[data.user_id] = data;
        }
      });
      
      setUsers(usersData);
      return usersData;
    } catch (err) {
      console.error("Error fetching users:", err);
      return {};
    }
  };

  // ดึงข้อมูลการจองและประมวลผลการกรอง
  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('BookingHistoryTable - Fetching bookings with filters:', {
        selectedMonth,
        selectedYear,
        selectedFields,
        selectedCourtTypes
      });
      
      // ตรวจสอบผู้ใช้ปัจจุบัน
      const user = auth.currentUser;
      if (!user) {
        console.log('No user logged in for booking history');
        setError('You need to login to view booking history');
        setLoading(false);
        return;
      }
      
      // ดึงข้อมูล user_id จาก Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log('User document not found for booking history');
        setError('User profile not found');
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      const userIdForQuery = userData.user_id;
      console.log('Using user_id for booking history query:', userIdForQuery);
      
      // ดึงข้อมูล Court, User และกำหนดสนามที่ user เป็นเจ้าของ
      const { courtsData, userCourts } = await fetchCourts(userIdForQuery);
      const usersData = await fetchUsers();
      
      if (userCourts.length === 0) {
        console.log('User does not own any courts');
        setAllFilteredBookings([]);
        setTotalBookings(0);
        setTotalPages(0);
        setBookings([]);
        setLoading(false);
        return;
      }
      
      console.log('Available fields from courts:', 
        [...new Set(Object.values(courtsData).map(court => court.field))]);
      console.log('Available court types from courts:', 
        [...new Set(Object.values(courtsData).map(court => court.court_type))]);

      // ดึงข้อมูลทั้งหมดครั้งเดียว
      const bookingsRef = collection(db, "Booking");
      
      // สร้างคิวรี่พื้นฐาน
      let bookingsQuery = query(
        bookingsRef,
        orderBy("start_time", "desc") // เรียงตามเวลาเริ่มล่าสุด
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      console.log('Total bookings fetched:', bookingsSnapshot.size);
      
      // แปลงข้อมูลจาก Firestore เป็นรูปแบบที่ต้องการ
      let bookingsData = bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // ตรวจสอบรูปแบบข้อมูล start_time
        let startTime;
        if (data.start_time?.toDate) {
          startTime = data.start_time.toDate();
        } else if (typeof data.start_time === 'object' && data.start_time?.seconds) {
          startTime = new Date(data.start_time.seconds * 1000);
        } else {
          startTime = new Date(data.start_time);
        }
        
        // ตรวจสอบรูปแบบข้อมูล end_time
        let endTime;
        if (data.end_time?.toDate) {
          endTime = data.end_time.toDate();
        } else if (typeof data.end_time === 'object' && data.end_time?.seconds) {
          endTime = new Date(data.end_time.seconds * 1000);
        } else {
          endTime = new Date(data.end_time);
        }
        
        return {
          id: doc.id,
          bookingId: data.booking_id || '',
          userId: data.user_id || '',
          courtId: data.court_id || '',
          startTime: startTime,
          endTime: endTime,
          status: data.status || 'Pending',
          // เพิ่มข้อมูลสำหรับการกรอง
          month: startTime.getMonth(),
          year: startTime.getFullYear()
        };
      });
      
      console.log('Parsed bookings data before filtering:', bookingsData.length);
      
      // กรองเฉพาะการจองที่เป็นของสนามที่ user เป็นเจ้าของ
      const beforeOwnerFilterCount = bookingsData.length;
      bookingsData = bookingsData.filter(booking => userCourts.includes(booking.courtId));
      console.log(`After filtering by owned courts: ${bookingsData.length} (removed ${beforeOwnerFilterCount - bookingsData.length})`);
      
      // กรองตามเดือนและปีที่เลือก (ถ้ามี)
      if (selectedMonth !== undefined && selectedYear !== undefined) {
        const beforeCount = bookingsData.length;
        bookingsData = bookingsData.filter(booking => 
          booking.month === selectedMonth && booking.year === selectedYear
        );
        console.log(`After filtering by month/year: ${bookingsData.length} (removed ${beforeCount - bookingsData.length})`);
      }
      
      // กรองตาม field และ court type
      if (selectedFields.length > 0 || selectedCourtTypes.length > 0) {
        console.log('Filtering by fields:', selectedFields);
        console.log('Filtering by court types:', selectedCourtTypes);
        
        const beforeFilterCount = bookingsData.length;
        const filteredData = [];
        
        for (const booking of bookingsData) {
          const court = courtsData[booking.courtId];
          
          if (!court) {
            console.log(`Court not found for booking: ${booking.id}, courtId: ${booking.courtId}`);
            continue;
          }
          
          const fieldMatch = selectedFields.length === 0 || selectedFields.includes(court.field);
          const typeMatch = selectedCourtTypes.length === 0 || selectedCourtTypes.includes(court.court_type);
          
          if (fieldMatch && typeMatch) {
            filteredData.push(booking);
          }
        }
        
        console.log(`After filtering by fields/court types: ${filteredData.length} (removed ${beforeFilterCount - filteredData.length})`);
        bookingsData = filteredData;
      }
      
      // เก็บข้อมูลที่กรองแล้วทั้งหมด
      setAllFilteredBookings(bookingsData);
      
      // ตั้งค่าจำนวนทั้งหมดและจำนวนหน้า
      setTotalBookings(bookingsData.length);
      setTotalPages(Math.ceil(bookingsData.length / bookingsPerPage));
      
      // ประมวลผลข้อมูลสำหรับหน้าปัจจุบัน
      updateCurrentPageData(bookingsData, 1);
      
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("ไม่สามารถโหลดประวัติการจองได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // อัปเดตข้อมูลสำหรับหน้าปัจจุบัน
  const updateCurrentPageData = (allData, page) => {
    const startIndex = (page - 1) * bookingsPerPage;
    const endIndex = startIndex + bookingsPerPage;
    const paginatedData = allData.slice(startIndex, endIndex);
    
    console.log(`Showing items ${startIndex+1} to ${Math.min(endIndex, allData.length)} of ${allData.length}`);
    setBookings(paginatedData);
    setCurrentPage(page);
  };

  // จัดการการเปลี่ยนหน้า
  const handlePageChange = (page) => {
    console.log('Changing to page:', page);
    // ใช้ข้อมูลที่กรองไว้แล้วสำหรับแบ่งหน้า
    updateCurrentPageData(allFilteredBookings, page);
  };

  // โหลดข้อมูลเมื่อคอมโพเนนต์ถูกโหลดหรือฟิลเตอร์เปลี่ยน
  useEffect(() => {
    console.log('BookingHistoryTable - Effect triggered with filters:', {
      selectedMonth,
      selectedYear,
      selectedFields,
      selectedCourtTypes
    });
    
    // ตรวจสอบการล็อกอินและดึงข้อมูล
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchBookings();
      } else {
        setError('You need to login to view booking history');
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [selectedMonth, selectedYear, selectedFields, selectedCourtTypes]);

  // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
  const formatDate = (date) => {
    try {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e, date);
      return '';
    }
  };

  // แปลงเวลาให้อ่านง่าย
  const formatTime = (startTime, endTime) => {
    try {
      const startFormatted = startTime.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const endFormatted = endTime.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `${startFormatted} - ${endFormatted}`;
    } catch (e) {
      console.error('Error formatting time:', e, startTime, endTime);
      return '';
    }
  };

  // ดึงชื่อผู้ใช้จาก user_id
  const getUserName = (userId) => {
    if (users[userId]) {
      const user = users[userId];
      return `${user.name || ''} ${user.surname || ''}`.trim();
    }
    return userId || 'ไม่ระบุชื่อ';
  };

  // ดึงข้อมูลสนามจาก court_id
  const getCourtInfo = (courtId) => {
    if (courts[courtId]) {
      return {
        name: courts[courtId].field || courtId,
        type: courts[courtId].court_type || ''
      };
    }
    return { name: courtId || 'ไม่ระบุสนาม', type: '' };
  };

  // กำหนด class สำหรับสถานะการจอง
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'สำเร็จ':
      case 'เสร็จสิ้น':
      case 'อนุมัติ':
      case 'successful':
      case 'completed':
      case 'approved':
        return 'status-successful';
      case 'ยกเลิก':
      case 'ปฏิเสธ':
      case 'cancelled':
      case 'rejected':
        return 'status-cancelled';
      case 'Pending':
      case 'รออนุมัติ':
      case 'pending':
      case 'waiting':
      default:
        return 'status-pending';
    }
  };

  // แปลงสถานะเป็นภาษาไทย (ถ้าจำเป็น)
  const translateStatus = (status) => {
    if (!status) return 'Pending';
    
    switch (status.toLowerCase()) {
      case 'successful':
      case 'completed':
      case 'approved':
        return 'successful';
      case 'cancelled':
      case 'rejected':
        return 'cancelled';
      case 'pending':
      case 'waiting':
        return 'Pending';
      default:
        return status;
    }
  };

  // สร้างปุ่มแบ่งหน้า
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);
    
    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button 
          key={i} 
          className={`pagination-button ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    
    return buttons;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="loading-indicator">Loading...</div>}
        
        {error && <div className="error-message">{error}</div>}
        
        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Field</th>
                    <th>Court Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length > 0 ? (
                    bookings.map((booking) => {
                      const courtInfo = getCourtInfo(booking.courtId);
                      return (
                        <tr key={booking.id}>
                          <td>{getUserName(booking.userId)}</td>
                          <td>{formatDate(booking.startTime)}</td>
                          <td>{formatTime(booking.startTime, booking.endTime)}</td>
                          <td>{courtInfo.name || booking.courtId}</td>
                          <td>{courtInfo.type || '-'}</td>
                          <td>
                            <span className={`status-badge ${getStatusClass(booking.status)}`}>
                              {translateStatus(booking.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-bookings">
                        No booking history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="pagination">
              <div className="pagination-info">
                Showing {bookings.length} from {totalBookings} data
              </div>
              <div className="pagination-buttons">
                {currentPage > 1 && (
                  <button 
                    className="pagination-button" 
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    ←
                  </button>
                )}
                
                {renderPaginationButtons()}
                
                {currentPage < totalPages && (
                  <button 
                    className="pagination-button" 
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    →
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingHistoryTable;