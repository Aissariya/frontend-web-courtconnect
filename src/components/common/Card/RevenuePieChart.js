import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { db } from '../../../firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy 
} from 'firebase/firestore';
import "./RevenuePieChart.css";

const RevenuePieChart = ({
  filterPeriod = 'monthly',
  selectedMonth = new Date().getMonth(), 
  selectedYear = new Date().getFullYear(),
  selectedFields = [],
  selectedCourtTypes = [],
  chartType = "field",
}) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth();

  // สีสำหรับแสดงในแผนภูมิ
  const COLORS = [
    "#10B981", // Green
    "#FBBF24", // Yellow
    "#F87171", // Red
    "#60A5FA", // Blue
    "#A78BFA", // Purple
    "#34D399", // Teal
    "#FB923C", // Orange
  ];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchRevenueData = async (user) => {
    setLoading(true);
    try {
      if (!user) {
        setError('No user logged in');
        setLoading(false);
        return;
      }

      console.log('Revenue Pie Chart - Filter settings:', { 
        filterPeriod, 
        selectedMonth, 
        selectedYear, 
        selectedFields, 
        selectedCourtTypes,
        chartType
      });

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        setError('User not found');
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const userIdForQuery = userData.user_id;

      // ดึงข้อมูล Courts ทั้งหมดก่อนเพื่อใช้เป็นการเทียบ
      const courtsRef = collection(db, 'Court');
      const courtsSnapshot = await getDocs(courtsRef);
      
      // สร้าง Map ของข้อมูล Court
      const courtsMap = {};
      courtsSnapshot.forEach(doc => {
        const court = doc.data();
        courtsMap[court.court_id] = court;
      });
      
      console.log('Revenue Pie Chart - Fetched courts:', Object.keys(courtsMap).length);

      const bookingsRef = collection(db, 'Booking');
      const userBookingsQuery = query(
        bookingsRef,
        where('user_id', '==', userIdForQuery),
        orderBy('start_time', 'asc')
      );

      const bookingSnapshots = await getDocs(userBookingsQuery);
      console.log('Revenue Pie Chart - Found bookings:', bookingSnapshots.size);

      if (bookingSnapshots.empty) {
        console.log('Revenue Pie Chart - No bookings found');
        setChartData([]);
        setLoading(false);
        return;
      }

      // เก็บข้อมูลดิบทั้งหมดก่อน
      const rawBookings = [];

      for (const docSnapshot of bookingSnapshots.docs) {
        const booking = docSnapshot.data();
        const courtId = booking.court_id;
        const court = courtsMap[courtId];
        
        if (!court) {
          console.log('Revenue Pie Chart - Court not found for booking:', courtId);
          continue;
        }

        const startTime = new Date(booking.start_time.seconds * 1000);
        const endTime = new Date(booking.end_time.seconds * 1000);
        const durationInMinutes = (endTime - startTime) / (1000 * 60);
        
        if (!court.bookingslot || !court.priceslot) {
          console.log('Revenue Pie Chart - Invalid court data:', court);
          continue;
        }

        const slots = Math.ceil(durationInMinutes / court.bookingslot);
        const price = slots * court.priceslot;

        // เก็บข้อมูลทั้งหมดพร้อมกับข้อมูลเกี่ยวกับวันที่และ court
        rawBookings.push({
          startTime,
          price,
          field: court.field || 'Unknown',
          court_type: court.court_type || 'Unknown',
          month: startTime.getMonth(),
          year: startTime.getFullYear()
        });
      }

      console.log('Revenue Pie Chart - Raw bookings:', rawBookings.length);

      // ประมวลผลข้อมูลตามตัวกรองที่เลือก
      let filteredBookings = [];

      // กรองข้อมูลตาม filterPeriod
      if (filterPeriod === 'monthly') {
        // กรองเฉพาะเดือนและปีที่เลือก
        filteredBookings = rawBookings.filter(booking => 
          booking.year === selectedYear && booking.month === selectedMonth
        );
      } 
      else if (filterPeriod === 'yearly') {
        // กรองเฉพาะปีที่เลือก
        filteredBookings = rawBookings.filter(booking => 
          booking.year === selectedYear
        );
      }

      console.log('Revenue Pie Chart - After period filtering:', filteredBookings.length);

      // กรองตาม field และ court type ถ้ามีการเลือก
      const filteredByFieldAndType = filteredBookings.filter(booking => {
        const fieldMatch = selectedFields.length === 0 || selectedFields.includes(booking.field);
        const typeMatch = selectedCourtTypes.length === 0 || selectedCourtTypes.includes(booking.court_type);
        return fieldMatch && typeMatch;
      });

      console.log('Revenue Pie Chart - After field/type filtering:', filteredByFieldAndType.length);

      // ถ้าไม่มีข้อมูลหลังการกรอง ให้แสดงข้อมูลว่าง
      if (filteredByFieldAndType.length === 0) {
        console.log('Revenue Pie Chart - No data after filtering');
        setChartData([]);
        setLoading(false);
        return;
      }

      // จัดกลุ่มตาม chartType ไม่ว่า filterPeriod จะเป็นอะไร
      const processedData = {};
      
      filteredByFieldAndType.forEach(booking => {
        const categoryKey = booking[chartType];
        processedData[categoryKey] = (processedData[categoryKey] || 0) + booking.price;
      });

      // แปลงข้อมูลสำหรับ PieChart
      const formattedData = Object.entries(processedData)
        .map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.value - a.value);

      // คำนวณค่าร้อยละ
      const totalValue = formattedData.reduce((sum, item) => sum + item.value, 0);
      const percentageData = formattedData.map(item => ({
        ...item,
        percentage: parseFloat(((item.value / totalValue) * 100).toFixed(1))
      }));

      console.log('Revenue Pie Chart - Final data:', percentageData.length, 'entries');
      setChartData(percentageData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // รีเซ็ตข้อมูลและเรียกดึงข้อมูลใหม่เมื่อตัวกรองเปลี่ยน
  useEffect(() => {
    // รีเซ็ตข้อมูลเมื่อเปลี่ยนตัวกรอง
    setChartData([]);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchRevenueData(user);
      } else {
        setError('No user logged in');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [
    filterPeriod,
    selectedMonth, 
    selectedYear, 
    selectedFields, 
    selectedCourtTypes, 
    chartType
  ]);

  // ส่วนการแสดง Tooltip และ Legend
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-name">{data.name}</p>
          <p className="tooltip-value">
            {data.value.toLocaleString()} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = () => {
    return (
      <div className="legend-container">
        {chartData.map((entry, index) => (
          <div key={`legend-${index}`} className="legend-item">
            <div className="legend-label">
              <div
                className="legend-dot"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="legend-name">{entry.name}</span>
            </div>
            <span className="legend-value">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="percentage-label"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="revenue-pie-chart">
      <div className="pie-chart-container">
        {loading ? (
          <div className="chart-loading">Loading data...</div>
        ) : error ? (
          <div className="chart-error">{error}</div>
        ) : chartData.length === 0 ? (
          <div className="no-data-message">
            No Data
          </div>
        ) : (
          <>
            <div className="pie-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={90}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {renderLegend()}
          </>
        )}
      </div>
    </div>
  );
};

export default RevenuePieChart;