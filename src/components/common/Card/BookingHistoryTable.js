import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card/Card';
import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; // ปรับ path ตามความเหมาะสม
import './BookingHistoryTable.css';

const BookingHistoryTable = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [users, setUsers] = useState({});
  const [courts, setCourts] = useState({});
  const bookingsPerPage = 5;

  // ดึงข้อมูล Court
  const fetchCourts = async () => {
    try {
      const courtsRef = collection(db, "Court");
      const courtsSnapshot = await getDocs(courtsRef);
      
      const courtsData = {};
      courtsSnapshot.forEach(doc => {
        const data = doc.data();
        courtsData[data.court_id] = data;
      });
      
      setCourts(courtsData);
    } catch (err) {
      console.error("Error fetching courts:", err);
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
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // ดึงข้อมูลการจอง
  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      
      let bookingsQuery;
      const bookingsRef = collection(db, "Booking");
      
      if (page === 1 || !lastVisible) {
        // คิวรี่หน้าแรก
        bookingsQuery = query(
          bookingsRef,
          orderBy("start_time", "desc"), // เรียงตามเวลาเริ่มล่าสุด
          limit(bookingsPerPage)
        );
      } else {
        // คิวรี่สำหรับแบ่งหน้า
        bookingsQuery = query(
          bookingsRef,
          orderBy("start_time", "desc"),
          startAfter(lastVisible),
          limit(bookingsPerPage)
        );
      }

      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      // นับจำนวนทั้งหมดสำหรับแบ่งหน้า
      const countQuery = await getDocs(collection(db, "Booking"));
      const totalCount = countQuery.size;
      setTotalBookings(totalCount);
      setTotalPages(Math.ceil(totalCount / bookingsPerPage));
      
      // เก็บเอกสารสุดท้ายสำหรับการแบ่งหน้า
      const lastDoc = bookingsSnapshot.docs[bookingsSnapshot.docs.length - 1];
      setLastVisible(lastDoc);
      
      // แปลงข้อมูลจาก Firestore เป็นรูปแบบที่ต้องการ
      const bookingsData = bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          bookingId: data.booking_id || '',
          userId: data.user_id || '',
          courtId: data.court_id || '',
          startTime: data.start_time?.toDate ? data.start_time.toDate() : new Date(data.start_time),
          endTime: data.end_time?.toDate ? data.end_time.toDate() : new Date(data.end_time),
          status: data.status || 'Pending'
        };
      });
      
      setBookings(bookingsData);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("ไม่สามารถโหลดประวัติการจองได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // จัดการการเปลี่ยนหน้า
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchBookings(page);
  };

  // โหลดข้อมูลเมื่อคอมโพเนนต์ถูกโหลด
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchUsers(), fetchCourts()]);
      fetchBookings();
    };
    
    loadData();
  }, []);

  // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
  const formatDate = (date) => {
    try {
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
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
    
    // ถ้าเป็นภาษาอังกฤษ ให้แปลเป็นภาษาไทย
    switch (status.toLowerCase()) {
      case 'successful':
      case 'completed':
      case 'approved':
        return 'สำเร็จ';
      case 'cancelled':
      case 'rejected':
        return 'ยกเลิก';
      case 'pending':
      case 'waiting':
        return 'Pending';
      default:
        return status; // ถ้าเป็นภาษาไทยหรืออื่นๆ ให้ใช้ค่าเดิม
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