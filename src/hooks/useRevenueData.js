import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Custom hook สำหรับดึงข้อมูลรายได้และคำนวณ metrics อื่นๆ
 * @param {Object} user - ข้อมูลผู้ใช้จาก Firebase Auth
 * @param {number} selectedMonth - เดือนที่เลือก (0-11)
 * @param {number} selectedYear - ปีที่เลือก
 * @param {string} filterPeriod - ช่วงเวลาที่ต้องการ ('monthly' หรือ 'yearly')
 * @param {Array} selectedFields - สนามที่เลือกกรอง
 * @param {Array} selectedCourtTypes - ประเภทสนามที่เลือกกรอง
 */
const useRevenueData = (user, selectedMonth, selectedYear, filterPeriod = 'monthly', selectedFields = [], selectedCourtTypes = []) => {
  const [metrics, setMetrics] = useState([
    { title: 'Revenue', value: '฿0.00', change: 0 },
    { title: 'Total Bookings', value: '0', change: 0 },
    { title: 'Total Booking Hours', value: '0 hr.', change: 0 },
    { title: 'Total new customers', value: '0', change: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // สร้างฟังก์ชันสำหรับหาช่วงเวลาตาม filterPeriod
  const getDateRange = (month, year, period) => {
    let startDate, endDate;
    let prevStartDate, prevEndDate;

    switch (period) {
      case 'monthly':
        // สำหรับ monthly คือเทียบเดือนปัจจุบันกับเดือนก่อนหน้า
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
        
        // เดือนก่อนหน้า
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        prevStartDate = new Date(prevYear, prevMonth, 1);
        prevEndDate = new Date(prevYear, prevMonth + 1, 0);
        break;
        
      case 'yearly':
        // สำหรับ yearly คือเทียบปีปัจจุบันกับปีก่อนหน้า
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        
        // ปีก่อนหน้า
        prevStartDate = new Date(year - 1, 0, 1);
        prevEndDate = new Date(year - 1, 11, 31);
        break;
        
      default:
        // ค่าเริ่มต้นเป็นเดือนปัจจุบัน
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
        
        const defaultPrevMonth = month === 0 ? 11 : month - 1;
        const defaultPrevYear = month === 0 ? year - 1 : year;
        prevStartDate = new Date(defaultPrevYear, defaultPrevMonth, 1);
        prevEndDate = new Date(defaultPrevYear, defaultPrevMonth + 1, 0);
    }

    return {
      current: { start: startDate, end: endDate },
      previous: { start: prevStartDate, end: prevEndDate }
    };
  };

  // ฟังก์ชันสำหรับกรองข้อมูลตามช่วงเวลา
  const filterDataByPeriod = (bookings, period, selectedMonth, selectedYear) => {
    const dateRange = getDateRange(selectedMonth, selectedYear, period);
    
    // กรองข้อมูลปัจจุบัน
    const currentPeriodBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.start_time.seconds * 1000);
      return bookingDate >= dateRange.current.start && bookingDate <= dateRange.current.end;
    });
    
    // กรองข้อมูลช่วงก่อนหน้า
    const previousPeriodBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.start_time.seconds * 1000);
      return bookingDate >= dateRange.previous.start && bookingDate <= dateRange.previous.end;
    });
    
    return {
      current: currentPeriodBookings,
      previous: previousPeriodBookings
    };
  };

  useEffect(() => {
    const fetchRevenueData = async () => {
      setLoading(true);
      
      try {
        if (!user) {
          console.log('No user provided for revenue data');
          setError('No user logged in');
          setLoading(false);
          return;
        }

        console.log(`Fetching revenue data for user: ${user.uid}, period: ${filterPeriod}`);
        console.log('Selected fields:', selectedFields);
        console.log('Selected court types:', selectedCourtTypes);
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          console.log('User document not found');
          setError('User not found');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        const userIdForQuery = userData.user_id;
        console.log('Using user_id for query:', userIdForQuery);
        
        // 1. ดึงข้อมูล Court ทั้งหมด
        const courtsRef = collection(db, 'Court');
        const courtsSnapshot = await getDocs(courtsRef);
        
        // สร้าง Map ของข้อมูล Court โดยใช้ court_id เป็น key
        const courtsMap = {};
        
        // เก็บสนามที่เป็นของ user ปัจจุบัน
        const userCourtIds = [];
        
        courtsSnapshot.forEach(doc => {
          const court = doc.data();
          courtsMap[court.court_id] = court;
          
          // ถ้าเป็นสนามของ user ปัจจุบัน ให้เก็บ court_id ไว้
          if (court.user_id === userIdForQuery) {
            userCourtIds.push(court.court_id);
          }
        });
        
        console.log('Courts map created with', Object.keys(courtsMap).length, 'courts');
        console.log('User owns courts with IDs:', userCourtIds);
        
        if (userCourtIds.length === 0) {
          console.log('User does not own any courts');
          setMetrics(prevMetrics => [
            { ...prevMetrics[0], value: '฿0.00', change: 0 },
            ...prevMetrics.slice(1)
          ]);
          setLoading(false);
          return;
        }
        
        // 2. ดึงข้อมูลการจองทั้งหมด (ทุกช่วงเวลา) - เพิ่มเงื่อนไข status เป็น successful
        const bookingsRef = collection(db, 'Booking');
        const bookingsQuery = query(
          bookingsRef,
          where('status', '==', 'successful'), // เพิ่มเงื่อนไขกรองเฉพาะ status เป็น successful
          orderBy('start_time', 'asc')
        );
        
        const bookingSnapshots = await getDocs(bookingsQuery);
        console.log('Found bookings:', bookingSnapshots.size);
        
        if (bookingSnapshots.size === 0) {
          console.log('No bookings found');
          setMetrics(prevMetrics => [
            { ...prevMetrics[0], value: '฿0.00', change: 0 },
            ...prevMetrics.slice(1)
          ]);
          setLoading(false);
          return;
        }
        
        // 3. กรองข้อมูลการจองที่เป็นของสนามที่ user เป็นเจ้าของ
        const allBookings = [];
        
        // ใช้ Set เพื่อเก็บ user_id ทั้งหมดที่เคยมีการจองในทุกช่วงเวลา
        const allHistoricalUserIds = new Set();
        
        for (const docSnapshot of bookingSnapshots.docs) {
          const booking = docSnapshot.data();
          
          // ตรวจสอบว่า court_id ในการจองตรงกับสนามที่ user เป็นเจ้าของหรือไม่
          if (userCourtIds.includes(booking.court_id)) {
            const court = courtsMap[booking.court_id];
            
            // กรองตาม fields และ court types ที่เลือก (ถ้ามี)
            const fieldMatch = selectedFields.length === 0 || selectedFields.includes(court.field);
            const courtTypeMatch = selectedCourtTypes.length === 0 || selectedCourtTypes.includes(court.court_type);
            
            if (fieldMatch && courtTypeMatch) {
              allBookings.push(booking);
              
              // เก็บ user_id ทั้งหมดที่เคยมีการจองสนามนี้ไว้ในประวัติ
              if (booking.user_id) {
                allHistoricalUserIds.add(booking.user_id);
              }
            }
          }
        }
        
        console.log('After filtering, found', allBookings.length, 'bookings for user\'s courts');
        console.log('Total unique customers in history:', allHistoricalUserIds.size);
        
        // กรองข้อมูลตาม filterPeriod
        const filteredData = filterDataByPeriod(allBookings, filterPeriod, selectedMonth, selectedYear);
        
        console.log(`Current period bookings: ${filteredData.current.length}`);
        console.log(`Previous period bookings: ${filteredData.previous.length}`);
        
        // สำหรับคำนวณรายได้และข้อมูลอื่นๆ
        let currentRevenue = 0;
        let previousRevenue = 0;
        let currentBookingCount = filteredData.current.length;
        let previousBookingCount = filteredData.previous.length;
        let currentBookingHours = 0;
        let previousBookingHours = 0;
        
        // เก็บ user_id ที่มีการจองในช่วงปัจจุบัน
        let currentUsers = new Set();
        // เก็บ user_id ที่มีการจองในช่วงก่อนหน้า
        let previousUsers = new Set();
        // เก็บ user_id ที่มีการจองก่อนช่วงปัจจุบัน (ประวัติทั้งหมดก่อนช่วงปัจจุบัน)
        let historicalUsers = new Set();

        // ประมวลผลข้อมูลการจองปัจจุบัน
        for (const booking of filteredData.current) {
          // เก็บ user_id ที่พบในการจองปัจจุบัน
          if (booking.user_id) {
            currentUsers.add(booking.user_id);
          }

          try {
            // ดึงข้อมูล Court จาก courtsMap ที่เตรียมไว้แล้ว
            const courtData = courtsMap[booking.court_id];
            
            if (!courtData) {
              console.log('Court not found in map:', booking.court_id);
              continue;
            }
            
            // คำนวณระยะเวลาและราคา
            const startTime = new Date(booking.start_time.seconds * 1000).getTime();
            const endTime = new Date(booking.end_time.seconds * 1000).getTime();
            const durationInMinutes = (endTime - startTime) / (1000 * 60);
            const durationInHours = durationInMinutes / 60;
            
            currentBookingHours += durationInHours;
            
            if (!courtData.bookingslot || !courtData.priceslot) {
              console.error('Invalid court data:', courtData);
              continue;
            }

            const slots = Math.ceil(durationInMinutes / courtData.bookingslot);
            const price = slots * courtData.priceslot;
            currentRevenue += price;
          } catch (err) {
            console.error('Error processing current period booking:', err);
          }
        }

        // ประมวลผลข้อมูลการจองช่วงก่อนหน้า
        for (const booking of filteredData.previous) {
          // เก็บ user_id ที่พบในการจองช่วงก่อนหน้า
          if (booking.user_id) {
            previousUsers.add(booking.user_id);
          }

          try {
            // ดึงข้อมูล Court จาก courtsMap ที่เตรียมไว้แล้ว
            const courtData = courtsMap[booking.court_id];
            
            if (!courtData) {
              console.log('Court not found in map:', booking.court_id);
              continue;
            }
            
            // คำนวณระยะเวลาและราคา
            const startTime = new Date(booking.start_time.seconds * 1000).getTime();
            const endTime = new Date(booking.end_time.seconds * 1000).getTime();
            const durationInMinutes = (endTime - startTime) / (1000 * 60);
            const durationInHours = durationInMinutes / 60;
            
            previousBookingHours += durationInHours;
            
            if (!courtData.bookingslot || !courtData.priceslot) {
              console.error('Invalid court data:', courtData);
              continue;
            }

            const slots = Math.ceil(durationInMinutes / courtData.bookingslot);
            const price = slots * courtData.priceslot;
            previousRevenue += price;
          } catch (err) {
            console.error('Error processing previous period booking:', err);
          }
        }

        // เก็บข้อมูลผู้ใช้ในประวัติทั้งหมดที่เคยจองก่อนช่วงปัจจุบัน
        for (const booking of allBookings) {
          // ตรวจสอบว่าการจองนี้เกิดขึ้นก่อนช่วงเวลาปัจจุบันหรือไม่
          const bookingDate = new Date(booking.start_time.seconds * 1000);
          if (bookingDate < filteredData.current.start && booking.user_id) {
            historicalUsers.add(booking.user_id);
          }
        }

        // หาผู้ใช้ใหม่แบบเบ็ดเสร็จ (ไม่เคยมีการจองเลยตั้งแต่เริ่มระบบ)
        // คือผู้ใช้ที่อยู่ในช่วงปัจจุบันแต่ไม่เคยอยู่ในประวัติการจองก่อนหน้านี้
        const newUsersCount = Array.from(currentUsers).filter(
          userId => !historicalUsers.has(userId)
        ).length;

        console.log('Users in current period:', currentUsers.size);
        console.log('Users in previous period:', previousUsers.size);
        console.log('Historical users before current period:', historicalUsers.size);
        console.log('True new users (first time ever):', newUsersCount);

        // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
        const calculateChange = (current, previous) => {
          if (previous === 0) return 0;
          return Math.round(((current - previous) / previous) * 100);
        };

        const revenueChange = calculateChange(currentRevenue, previousRevenue);
        const bookingsChange = calculateChange(currentBookingCount, previousBookingCount);
        const hoursChange = calculateChange(currentBookingHours, previousBookingHours);
        
        // เปรียบเทียบจำนวนลูกค้าใหม่ในช่วงปัจจุบันกับช่วงก่อนหน้า
        // หาจำนวนลูกค้าใหม่ในช่วงก่อนหน้า (เพื่อคำนวณ % การเปลี่ยนแปลง)
        const previousNewUsersCount = Array.from(previousUsers).filter(
          userId => {
            // ลูกค้าคนนี้ไม่อยู่ในประวัติก่อนช่วงก่อนหน้า 
            // (ต้องตัดช่วงก่อนหน้าออกจาก historicalUsers ก่อน)
            const historicalBeforePrevious = new Set();
            for (const booking of allBookings) {
              const bookingDate = new Date(booking.start_time.seconds * 1000);
              if (bookingDate < filteredData.previous.start && booking.user_id) {
                historicalBeforePrevious.add(booking.user_id);
              }
            }
            return !historicalBeforePrevious.has(userId);
          }
        ).length;
        
        const newUsersChange = calculateChange(newUsersCount, previousNewUsersCount);
        
        console.log('New users in previous period:', previousNewUsersCount);
        console.log('New users change:', newUsersChange, '%');

        // อัพเดท metrics
        setMetrics([
          { 
            title: 'Revenue', 
            value: `฿${currentRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
            change: revenueChange 
          },
          { 
            title: 'Total Bookings', 
            value: currentBookingCount.toString(), 
            change: bookingsChange 
          },
          { 
            title: 'Total Booking Hours', 
            value: `${currentBookingHours.toFixed(1)} hr.`, 
            change: hoursChange 
          },
          { 
            title: 'Total new customers', 
            value: newUsersCount.toString(), 
            change: newUsersChange 
          },
        ]);

        console.log(`===== ${filterPeriod.toUpperCase()} METRICS =====`);
        console.log('Current Revenue:', currentRevenue);
        console.log('Previous Revenue:', previousRevenue);
        console.log('Revenue Change:', revenueChange, '%');
        console.log('Current Bookings:', currentBookingCount);
        console.log('Previous Bookings:', previousBookingCount);
        console.log('Bookings Change:', bookingsChange, '%');
        console.log('New Users Count (first time ever):', newUsersCount);
        console.log('Previous New Users Count:', previousNewUsersCount);
        console.log('New Users Change:', newUsersChange, '%');

      } catch (err) {
        console.error('Error in revenue data hook:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [user, selectedMonth, selectedYear, filterPeriod, selectedFields, selectedCourtTypes]);

  return { metrics, loading, error };
};

export default useRevenueData;