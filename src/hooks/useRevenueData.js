import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Custom hook สำหรับดึงข้อมูลรายได้และคำนวณ metrics อื่นๆ
 * @param {Object} user - ข้อมูลผู้ใช้จาก Firebase Auth
 * @param {number} selectedMonth - เดือนที่เลือก (0-11)
 * @param {number} selectedYear - ปีที่เลือก
 * @param {string} filterPeriod - ช่วงเวลาที่ต้องการ ('monthly' หรือ 'yearly')
 */
const useRevenueData = (user, selectedMonth, selectedYear, filterPeriod = 'monthly') => {
  const [metrics, setMetrics] = useState([
    { title: 'Revenue', value: '฿0.00', change: 0 },
    { title: 'Total Bookings', value: '0', change: 0 },
    { title: 'Total Booking Hours', value: '0 hr.', change: 0 },
    { title: 'Total new customers', value: '0', change: 0 }, // เปลี่ยนกลับเป็น Total new customers
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

        const bookingsRef = collection(db, 'Booking');
        const userBookingsQuery = query(
          bookingsRef,
          where('user_id', '==', userIdForQuery),
          orderBy('start_time', 'asc')
        );

        const bookingSnapshots = await getDocs(userBookingsQuery);
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

        // รวบรวมการจองทั้งหมด
        const allBookings = [];
        for (const docSnapshot of bookingSnapshots.docs) {
          const booking = docSnapshot.data();
          allBookings.push(booking);
        }

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
        
        // เก็บ user_id ที่พบในแต่ละช่วงเวลา
        let currentUsers = new Set();
        let previousUsers = new Set();

        // ประมวลผลข้อมูลการจองปัจจุบัน
        for (const booking of filteredData.current) {
          // เก็บ user_id ที่พบในการจองปัจจุบัน
          if (booking.user_id) {
            currentUsers.add(booking.user_id);
          }

          try {
            // คำนวณรายได้และเวลา
            const courtsRef = collection(db, 'Court');
            const courtQuery = query(courtsRef, where('court_id', '==', booking.court_id));
            const courtSnapshot = await getDocs(courtQuery);
            
            if (courtSnapshot.empty) {
              console.log('Court not found:', booking.court_id);
              continue;
            }
            
            const courtData = courtSnapshot.docs[0].data();
            
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
            // คำนวณรายได้และเวลา
            const courtsRef = collection(db, 'Court');
            const courtQuery = query(courtsRef, where('court_id', '==', booking.court_id));
            const courtSnapshot = await getDocs(courtQuery);
            
            if (courtSnapshot.empty) {
              console.log('Court not found:', booking.court_id);
              continue;
            }
            
            const courtData = courtSnapshot.docs[0].data();
            
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

        // หาผู้ใช้ใหม่ (มีใน currentUsers แต่ไม่มีใน previousUsers)
        const newUsersCount = Array.from(currentUsers).filter(
          userId => !Array.from(previousUsers).includes(userId)
        ).length;

        // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
        const calculateChange = (current, previous) => {
          if (previous === 0) return 0;
          return Math.round(((current - previous) / previous) * 100);
        };

        const revenueChange = calculateChange(currentRevenue, previousRevenue);
        const bookingsChange = calculateChange(currentBookingCount, previousBookingCount);
        const hoursChange = calculateChange(currentBookingHours, previousBookingHours);
        const newUsersChange = calculateChange(newUsersCount, previousUsers.size);

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
        console.log('New Users Count:', newUsersCount);
        console.log('Previous Period Users:', previousUsers.size);
        console.log('New Users Change:', newUsersChange, '%');

      } catch (err) {
        console.error('Error in revenue data hook:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [user, selectedMonth, selectedYear, filterPeriod]);

  return { metrics, loading, error };
};

export default useRevenueData;