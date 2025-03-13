import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../../../firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import './RevenueChart.css';

const RevenueChart = ({ 
  filterPeriod = 'daily', 
  selectedMonth = new Date().getMonth(), 
  selectedYear = new Date().getFullYear(),
  previousMonth,
  previousYear,
  selectedFields = [],
  selectedCourtTypes = []
}) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth();

  const fetchRevenueData = async (user) => {
    setLoading(true);
    try {
      if (!user) {
        console.log('No user provided');
        setError('No user logged in');
        setLoading(false);
        return;
      }

      console.log('Fetching data for user:', user.uid);
      console.log('Filter settings:', { 
        filterPeriod, 
        selectedMonth, 
        selectedYear, 
        selectedFields, 
        selectedCourtTypes 
      });
      
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

      // 1. ดึงข้อมูล Courts ทั้งหมดก่อนเพื่อใช้กรอง
      const courtsRef = collection(db, 'Court');
      const courtsSnapshot = await getDocs(courtsRef);
      
      // สร้าง Map ของข้อมูล Court
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
      
      console.log('Fetched courts:', Object.keys(courtsMap).length);
      console.log('User owned courts:', userCourtIds.length, userCourtIds);
      
      if (userCourtIds.length === 0) {
        console.log('User does not own any courts');
        setData([]);
        setFilteredData([]);
        setLoading(false);
        return;
      }

      // 2. ดึงข้อมูลการจองทั้งหมด - เพิ่มเงื่อนไข status เป็น successful
      const bookingsRef = collection(db, 'Booking');
      const bookingsQuery = query(
        bookingsRef,
        where('status', '==', 'successful'), // เพิ่มเงื่อนไขกรองเฉพาะ status เป็น successful
        orderBy('start_time', 'asc')
      );

      const bookingSnapshots = await getDocs(bookingsQuery);
      console.log('Found all bookings:', bookingSnapshots.size);

      if (bookingSnapshots.size === 0) {
        console.log('No bookings found');
        setData([]);
        setFilteredData([]);
        setLoading(false);
        return;
      }

      // 3. กรองข้อมูลการจองที่เป็นของสนามที่ user เป็นเจ้าของ และตรงตามเงื่อนไขอื่นๆ
      const filteredBookings = [];
      
      for (const docSnapshot of bookingSnapshots.docs) {
        const booking = docSnapshot.data();
        const courtId = booking.court_id;
        
        // ตรวจสอบว่าเป็นการจองของสนามที่ user เป็นเจ้าของหรือไม่
        if (!userCourtIds.includes(courtId)) {
          continue;
        }
        
        const court = courtsMap[courtId];
        
        // ถ้าไม่พบข้อมูล court หรือไม่ตรงกับเงื่อนไขกรอง ให้ข้าม
        if (!court) {
          console.log('Court not found for booking:', courtId);
          continue;
        }
        
        // กรองตาม field และ court type
        const fieldMatch = selectedFields.length === 0 || selectedFields.includes(court.field);
        const courtTypeMatch = selectedCourtTypes.length === 0 || selectedCourtTypes.includes(court.court_type);
        
        if (fieldMatch && courtTypeMatch) {
          filteredBookings.push(booking);
        }
      }
      
      console.log('Bookings after filtering by owner and fields/court types:', filteredBookings.length);
      
      // ถ้าไม่มีข้อมูลหลังการกรอง ให้แสดงข้อมูลว่าง
      if (filteredBookings.length === 0) {
        console.log('No bookings after filtering');
        setData([]);
        setFilteredData([]);
        setLoading(false);
        return;
      }

      const revenueByDate = new Map();

      for (const booking of filteredBookings) {
        const startTimestamp = booking.start_time;
        const date = new Date(startTimestamp.seconds * 1000);

        if (isNaN(date.getTime())) {
          console.error('Invalid date from timestamp:', startTimestamp);
          continue;
        }

        try {
          const courtData = courtsMap[booking.court_id];
          if (!courtData) {
            console.log('Court not found in map:', booking.court_id);
            continue;
          }

          const startTime = new Date(booking.start_time.seconds * 1000).getTime();
          const endTime = new Date(booking.end_time.seconds * 1000).getTime();
          const durationInMinutes = (endTime - startTime) / (1000 * 60);
          
          if (!courtData.bookingslot || !courtData.priceslot) {
            console.error('Invalid court data:', courtData);
            continue;
          }

          const slots = Math.ceil(durationInMinutes / courtData.bookingslot);
          const price = slots * courtData.priceslot;

          const dateKey = date.toISOString().split('T')[0];
          const currentRevenue = (revenueByDate.get(dateKey) || 0) + price;
          revenueByDate.set(dateKey, currentRevenue);
        } catch (err) {
          console.error('Error processing court data:', err);
        }
      }

      const rawData = Array.from(revenueByDate.entries())
        .map(([dateKey, current]) => ({
          fullDate: dateKey,
          date: dateKey,
          current
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log('Final raw data:', rawData.length, 'date entries');
      setData(rawData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const filterData = (rawData, period) => {
    // ใช้ค่าเดือนและปีที่เลือกแทนการใช้เดือนปัจจุบัน
    let filteredData = [];

    // ถ้าไม่ได้รับค่า previousMonth/previousYear ให้คำนวณจาก selectedMonth/selectedYear
    const prevMonth = previousMonth !== undefined ? previousMonth : (selectedMonth === 0 ? 11 : selectedMonth - 1);
    const prevYear = previousYear !== undefined ? previousYear : (selectedMonth === 0 ? selectedYear - 1 : selectedYear);

    console.log(`Filtering data by period: ${period}`, {
      selectedMonth,
      selectedYear,
      prevMonth,
      prevYear
    });

    switch (period) {
      case 'daily': {
        // Create daily totals for selected month
        const selectedMonthData = rawData.filter(item => {
          const date = new Date(item.fullDate);
          return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
        }).reduce((acc, item) => {
          const date = new Date(item.fullDate);
          const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
          acc[day] = (acc[day] || 0) + item.current;
          return acc;
        }, {});

        // Create daily totals for previous month
        const previousMonthData = rawData.filter(item => {
          const date = new Date(item.fullDate);
          return date.getFullYear() === prevYear && date.getMonth() === prevMonth;
        }).reduce((acc, item) => {
          const date = new Date(item.fullDate);
          const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
          acc[day] = (acc[day] || 0) + item.current;
          return acc;
        }, {});

        const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        filteredData = orderedDays.map(day => ({
          date: day,
          current: selectedMonthData[day] || 0,
          previous: previousMonthData[day] || 0
        }));
        break;
      }

      case 'monthly': {
        // Get days in both months
        const daysInSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const daysInPreviousMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
        const maxDays = Math.min(daysInSelectedMonth, daysInPreviousMonth);

        // Create daily totals for selected month
        const selectedMonthData = rawData.filter(item => {
          const date = new Date(item.fullDate);
          return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
        }).reduce((acc, item) => {
          const date = new Date(item.fullDate);
          const day = date.getDate();
          acc[day] = (acc[day] || 0) + item.current;
          return acc;
        }, {});

        // Create daily totals for previous month
        const previousMonthData = rawData.filter(item => {
          const date = new Date(item.fullDate);
          return date.getFullYear() === prevYear && date.getMonth() === prevMonth;
        }).reduce((acc, item) => {
          const date = new Date(item.fullDate);
          const day = date.getDate();
          acc[day] = (acc[day] || 0) + item.current;
          return acc;
        }, {});

        // Create array of days
        filteredData = Array.from({ length: maxDays }, (_, i) => {
          const day = i + 1;
          return {
            date: String(day),
            current: selectedMonthData[day] || 0,
            previous: previousMonthData[day] || 0
          };
        });
        break;
      }

      case 'yearly': {
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Create monthly totals for selected year
        const selectedYearData = rawData.filter(item => {
          const date = new Date(item.fullDate);
          return date.getFullYear() === selectedYear;
        }).reduce((acc, item) => {
          const date = new Date(item.fullDate);
          const month = monthNames[date.getMonth()];
          acc[month] = (acc[month] || 0) + item.current;
          return acc;
        }, {});

        // Create monthly totals for previous year
        const previousYearData = rawData.filter(item => {
          const date = new Date(item.fullDate);
          return date.getFullYear() === selectedYear - 1; // ปีก่อนหน้าคือปีที่เลือกลบ 1
        }).reduce((acc, item) => {
          const date = new Date(item.fullDate);
          const month = monthNames[date.getMonth()];
          acc[month] = (acc[month] || 0) + item.current;
          return acc;
        }, {});

        // Create final data array
        filteredData = monthNames.map(month => ({
          date: month,
          current: selectedYearData[month] || 0,
          previous: previousYearData[month] || 0
        }));
        break;
      }

      default:
        break;
    }

    console.log('Filtered data for chart:', filteredData.length, 'entries');
    return filteredData;
  };

  // รีเซ็ตข้อมูลและเรียกดึงข้อมูลใหม่เมื่อตัวกรองเปลี่ยน
  useEffect(() => {
    // รีเซ็ตข้อมูลเมื่อเปลี่ยนตัวกรอง
    setData([]);
    setFilteredData([]);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchRevenueData(user);
      } else {
        setError('No user logged in');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, selectedFields, selectedCourtTypes, selectedMonth, selectedYear]); // เพิ่ม dependencies ทั้งหมด

  // อัพเดท filteredData เมื่อ data หรือ filterPeriod เปลี่ยน
  useEffect(() => {
    if (data.length > 0) {
      const filtered = filterData(data, filterPeriod);
      setFilteredData(filtered);
    } else {
      setFilteredData([]);
    }
  }, [data, filterPeriod, selectedMonth, selectedYear, previousMonth, previousYear]);

  // ตรวจสอบว่ามีข้อมูลเพื่อแสดงหรือไม่
  const hasData = filteredData.length > 0 && !filteredData.every(item => item.current === 0 && item.previous === 0);

  if (loading) {
    return <div className="chart-card"><div className="chart-content">Loading...</div></div>;
  }

  if (error) {
    return <div className="chart-card"><div className="chart-content">Error: {error}</div></div>;
  }

  if (!hasData) {
    return <div className="chart-card"><div className="chart-content">No Data Available</div></div>;
  }

  return (
    <div className="chart-card">
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={filteredData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: filterPeriod === 'monthly' ? 90 : 40
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={filterPeriod === 'yearly' ? -45 : 0}
              textAnchor={filterPeriod === 'yearly' ? 'end' : 'middle'}
              height={filterPeriod === 'yearly' ? 60 : 30}
              fontSize={12}
              dy={filterPeriod === 'yearly' ? 20 : 10}
              tick={{ 
                fontSize: 12,
                width: filterPeriod === 'yearly' ? 100 : 'auto',
                marginRight: filterPeriod === 'yearly' ? 20 : 0
              }}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `฿${value.toLocaleString()}`}
              fontSize={12}
              dx={-10}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="custom-tooltip bg-white p-3 shadow-lg rounded-lg border">
                      <p className="font-semibold mb-2">{label}</p>
                      <p className="text-emerald-600">
                        Current: ฿{payload[0].value.toLocaleString()}
                      </p>
                      <p className="text-slate-500">
                        Previous: ฿{payload[1].value.toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              name="Current"
              type="monotone"
              dataKey="current"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              name="Previous"
              type="monotone"
              dataKey="previous"
              stroke="#94A3B8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;