import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card/Card';
import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
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
      
      console.log('All courts data:', courtsData);
      setCourts(courtsData);
      return courtsData; // ส่งค่ากลับเพื่อใช้ในฟังก์ชันอื่น
    } catch (err) {
      console.error("Error fetching courts:", err);
      return {};
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

  // ดึงข้อมูลการจอง
  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      console.log('BookingHistoryTable - Fetching bookings with filters:', {
        selectedMonth,
        selectedYear,
        selectedFields,
        selectedCourtTypes
      });
      
      // ดึงข้อมูล Court และ User ก่อน
      const courtsData = await fetchCourts();
      const usersData = await fetchUsers();
      
      console.log('Available fields from courts:', 
        [...new Set(Object.values(courtsData).map(court => court.field))]);
      console.log('Available court types from courts:', 
        [...new Set(Object.values(courtsData).map(court => court.court_type))]);

      let bookingsQuery;
      const bookingsRef = collection(db, "Booking");
      
      // ดึงข้อมูลทั้งหมดก่อน แล้วค่อยกรอง
      if (page === 1 || !lastVisible) {
        // คิวรี่หน้าแรก
        bookingsQuery = query(
          bookingsRef,
          orderBy("start_time", "desc"), // เรียงตามเวลาเริ่มล่าสุด
          limit(bookingsPerPage * 10) // ดึงมากกว่าปกติเพื่อรองรับการกรอง
        );
      } else {
        // คิวรี่สำหรับแบ่งหน้า
        bookingsQuery = query(
          bookingsRef,
          orderBy("start_time", "desc"),
          startAfter(lastVisible),
          limit(bookingsPerPage * 10) // ดึงมากกว่าปกติเพื่อรองรับการกรอง
        );
      }

      const bookingsSnapshot = await getDocs(bookingsQuery);
      console.log('Total bookings fetched:', bookingsSnapshot.size);
      
      // แสดงรายละเอียดข้อมูลการจองที่ดึงมา (เพื่อการตรวจสอบ)
      const rawBookingData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('First 3 raw bookings:', rawBookingData.slice(0, 3));
      
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
        
        return {
          id: doc.id,
          bookingId: data.booking_id || '',
          userId: data.user_id || '',
          courtId: data.court_id || '',
          startTime: startTime,
          endTime: data.end_time?.toDate ? data.end_time.toDate() : new Date(data.end_time),
          status: data.status || 'Pending',
          // เพิ่มข้อมูลสำหรับการกรอง
          month: startTime.getMonth(),
          year: startTime.getFullYear()
        };
      });
      
      console.log('Parsed bookings data before filtering:', bookingsData.length);
      
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
        const rejectedBookings = [];
        
        for (const booking of bookingsData) {
          const court = courtsData[booking.courtId];
          
          if (!court) {
            rejectedBookings.push({
              id: booking.id,
              courtId: booking.courtId,
              reason: 'Court not found'
            });
            continue;
          }
          
          const fieldMatch = selectedFields.length === 0 || selectedFields.includes(court.field);
          const typeMatch = selectedCourtTypes.length === 0 || selectedCourtTypes.includes(court.court_type);
          
          // แสดงข้อมูลเพื่อตรวจสอบ
          console.log(`Booking ${booking.id} - Court: ${court.field} / ${court.court_type} - FieldMatch: ${fieldMatch}, TypeMatch: ${typeMatch}`);
          
          if (fieldMatch && typeMatch) {
            filteredData.push(booking);
          } else {
            rejectedBookings.push({
              id: booking.id,
              courtId: booking.courtId,
              field: court.field,
              court_type: court.court_type,
              fieldMatch,
              typeMatch
            });
          }
        }
        
        console.log(`After filtering by fields/court types: ${filteredData.length} (removed ${beforeFilterCount - filteredData.length})`);
        console.log('Rejected bookings sample:', rejectedBookings.slice(0, 5));
        
        bookingsData = filteredData;
      }
      
      // จำกัดจำนวนเฉพาะที่จะแสดงในหน้านี้
      const paginatedBookings = bookingsData.slice((page - 1) * bookingsPerPage, page * bookingsPerPage);
      
      // นับจำนวนทั้งหมดสำหรับแบ่งหน้า
      setTotalBookings(bookingsData.length);
      setTotalPages(Math.ceil(bookingsData.length / bookingsPerPage));
      
      // เก็บข้อมูลการจองล่าสุดสำหรับการแบ่งหน้า
      const lastBooking = bookingsSnapshot.docs[bookingsSnapshot.docs.length - 1];
      setLastVisible(lastBooking);
      
      console.log('Final paginated bookings for display:', paginatedBookings.length);
      setBookings(paginatedBookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("ไม่สามารถโหลดประวัติการจองได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // จัดการการเปลี่ยนหน้า
  const handlePageChange = (page) => {
    console.log('Changing to page:', page);
    setCurrentPage(page);
    fetchBookings(page);
  };

  // โหลดข้อมูลเมื่อคอมโพเนนต์ถูกโหลดหรือฟิลเตอร์เปลี่ยน
  useEffect(() => {
    console.log('BookingHistoryTable - Effect triggered with filters:', {
      selectedMonth,
      selectedYear,
      selectedFields,
      selectedCourtTypes
    });
    
    const loadData = async () => {
      fetchBookings(1); // เริ่มที่หน้า 1 เมื่อฟิลเตอร์เปลี่ยน
      setCurrentPage(1); // รีเซ็ตหน้าปัจจุบัน
    };
    
    loadData();
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
    
    // ถ้าเป็นภาษาอังกฤษ ให้แปลเป็นภาษาไทย
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