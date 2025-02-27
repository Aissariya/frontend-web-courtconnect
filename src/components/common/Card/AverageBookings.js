import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent } from '../Card/Card';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import './AverageBookings.css';

const AverageBookingsChart = ({ 
  selectedMonth, 
  selectedYear, 
  selectedFields, 
  selectedCourtTypes,
  chartFilterPeriod = 'hourly', // รับค่า filter จาก Dashboard
  dashboardFilterPeriod = 'monthly' // รับค่า filter หลักของ dashboard
}) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // เพิ่ม console.log เพื่อตรวจสอบค่าที่ได้รับ
  console.log('AverageBookingsChart Props:', {
    selectedMonth,
    selectedYear,
    chartFilterPeriod,
    dashboardFilterPeriod
  });

  useEffect(() => {
    console.log('AverageBookingsChart useEffect triggered');
    fetchBookingData();
  }, [selectedMonth, selectedYear, selectedFields, selectedCourtTypes, chartFilterPeriod, dashboardFilterPeriod]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      console.log(`Starting fetchBookingData - Month: ${selectedMonth}, Year: ${selectedYear}`);
      
      // สร้าง query พื้นฐานไปยัง collection Booking (ตัวใหญ่)
      let bookingsRef = collection(db, 'Booking');
      let constraints = [];
      
      // ดึงข้อมูลการจอง
      const bookingSnapshot = await getDocs(bookingsRef);
      console.log("จำนวน document ที่ดึงได้:", bookingSnapshot.size);
      
      const bookings = [];
      
      bookingSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("ข้อมูล Booking ID:", doc.id, data);
        
        // แปลง Firestore timestamp หรือ string เป็น Date object
        let startTimeDate;
        
        if (data.start_time?.toDate) {
          // กรณีเป็น Firestore timestamp
          startTimeDate = data.start_time.toDate();
        } else if (typeof data.start_time === 'string') {
          // กรณีเป็น string
          startTimeDate = new Date(data.start_time);
        } else {
          // กรณีอื่นๆ
          startTimeDate = new Date(data.start_time);
        }
        
        console.log("แปลงเป็นวันที่:", startTimeDate, "เวลา:", startTimeDate.getHours() + ":" + startTimeDate.getMinutes());
        
        bookings.push({
          id: doc.id,
          ...data,
          // เก็บ Date object
          startTimeDate: startTimeDate,
          // เพิ่ม field ที่จำเป็นสำหรับการวิเคราะห์ข้อมูล
          hour: startTimeDate.getHours(),
          day: startTimeDate.getDay(), // 0 = วันอาทิตย์, 1 = วันจันทร์, ...
          date: startTimeDate.getDate(), // วันที่ 1-31
          month: startTimeDate.getMonth(), // 0-11
          year: startTimeDate.getFullYear()
        });
      });
      
      // กรองข้อมูลตามเดือนและปีที่เลือกหลังจากดึงข้อมูลมาแล้ว
      let filteredBookings = [...bookings];
      
      if (dashboardFilterPeriod === 'monthly') {
        // กรองตามเดือนและปีที่เลือก
        console.log(`กรองตามเดือน: ${selectedMonth}, ปี: ${selectedYear}`);
        
        filteredBookings = bookings.filter(booking => {
          return booking.month === selectedMonth && booking.year === selectedYear;
        });
      } else if (dashboardFilterPeriod === 'yearly') {
        // กรองตามปีที่เลือก
        console.log(`กรองตามปี: ${selectedYear}`);
        
        filteredBookings = bookings.filter(booking => {
          return booking.year === selectedYear;
        });
      }
      
      // กรองตาม fields (court_id)
      if (selectedFields && selectedFields.length > 0) {
        console.log("กรองตาม court_id:", selectedFields);
        
        filteredBookings = filteredBookings.filter(booking => 
          selectedFields.includes(booking.court_id)
        );
      }
      
      // กรองตาม court types (ถ้ามี)
      if (selectedCourtTypes && selectedCourtTypes.length > 0) {
        console.log("กรองตาม court_type:", selectedCourtTypes);
        
        filteredBookings = filteredBookings.filter(booking => 
          selectedCourtTypes.includes(booking.court_type)
        );
      }
      
      console.log("หลังจากกรองทั้งหมด เหลือข้อมูล:", filteredBookings.length);
      
      // สร้างข้อมูลสำหรับแสดงกราฟตาม filter ที่เลือก
      let groupedData = [];
      
      switch (chartFilterPeriod) {
        case 'hourly':
          // จัดกลุ่มตามชั่วโมง
          groupedData = groupBookingsByHour(filteredBookings);
          break;
        case 'daily':
          // จัดกลุ่มตามวัน (จันทร์-อาทิตย์)
          groupedData = groupBookingsByDay(filteredBookings);
          break;
        case 'monthly':
          // จัดกลุ่มตามวันที่ในเดือน (1-31)
          groupedData = groupBookingsByDate(filteredBookings);
          break;
        case 'yearly':
          // จัดกลุ่มตามเดือนในปี (มกราคม-ธันวาคม)
          groupedData = groupBookingsByMonth(filteredBookings);
          break;
        default:
          groupedData = groupBookingsByHour(filteredBookings);
      }
      
      setChartData(groupedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching booking data:', error);
      setError(error.message);
      setLoading(false);
    }
  };
  
  // ฟังก์ชันสำหรับจัดกลุ่มข้อมูลตามชั่วโมง
  const groupBookingsByHour = (bookings) => {
    console.log("จำนวนการจองทั้งหมด:", bookings.length);
    
    // สร้าง array เพื่อเก็บจำนวนการจองแยกตามชั่วโมง (ใช้ array แทน object)
    const hourlyData = [];
    
    // กำหนดชั่วโมงที่ต้องการแสดง (ตั้งแต่ 8:00 - 22:00) ทุกๆ ชั่วโมง
    for (let hour = 8; hour <= 22; hour++) {
      hourlyData.push({
        time: `${hour}:00`,
        bookings: 0
      });
    }
    
    // นับจำนวนการจองในแต่ละชั่วโมง
    bookings.forEach(booking => {
      const hour = booking.hour;
      console.log("พบการจองเวลา:", hour, "น.");
      
      if (hour >= 8 && hour <= 22) {
        const index = hour - 8; // คำนวณ index ใน array (8:00 = index 0, 9:00 = index 1, ...)
        hourlyData[index].bookings += 1;
      }
    });
    
    console.log("ข้อมูลที่จะแสดงในกราฟ (ชั่วโมง):", hourlyData);
    
    // ไม่ต้องแปลงเป็น array เพราะเป็น array อยู่แล้ว
    return hourlyData;
  };
  
  // ฟังก์ชันสำหรับจัดกลุ่มข้อมูลตามวันในสัปดาห์
  const groupBookingsByDay = (bookings) => {
    // สร้าง array สำหรับเก็บข้อมูลการจองแยกตามวัน
    const daysOfWeek = [
      { day: 'Sunday', bookings: 0 },
      { day: 'Monday', bookings: 0 },
      { day: 'Tuesday', bookings: 0 },
      { day: 'Wednesday', bookings: 0 },
      { day: 'Thursday', bookings: 0 },
      { day: 'Friday', bookings: 0 },
      { day: 'Saturday', bookings: 0 }
    ];
    
    // นับจำนวนการจองในแต่ละวัน
    bookings.forEach(booking => {
      const dayIndex = booking.day;
      daysOfWeek[dayIndex].bookings += 1;
    });
    
    return daysOfWeek;
  };
  
  // ฟังก์ชันสำหรับจัดกลุ่มข้อมูลตามวันที่ในเดือน
  const groupBookingsByDate = (bookings) => {
    // สร้าง array เพื่อเก็บจำนวนการจองแยกตามวันที่
    const dateData = [];
    
    // หาจำนวนวันในเดือนที่เลือก
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    // กำหนดวันที่ที่ต้องการแสดง (1-31)
    for (let date = 1; date <= daysInMonth; date++) {
      dateData.push({
        date: `${date}`,
        bookings: 0
      });
    }
    
    // นับจำนวนการจองในแต่ละวันที่
    bookings.forEach(booking => {
      const date = booking.date;
      if (date >= 1 && date <= daysInMonth) {
        dateData[date - 1].bookings += 1;
      }
    });
    
    return dateData;
  };
  
  // ฟังก์ชันสำหรับจัดกลุ่มข้อมูลตามเดือนในปี
  const groupBookingsByMonth = (bookings) => {
    // สร้าง array สำหรับเก็บข้อมูลการจองแยกตามเดือน
    const monthsOfYear = [
      { month: 'Jan', bookings: 0 },
      { month: 'Feb', bookings: 0 },
      { month: 'Mar', bookings: 0 },
      { month: 'Apr', bookings: 0 },
      { month: 'May', bookings: 0 },
      { month: 'Jun', bookings: 0 },
      { month: 'Jul', bookings: 0 },
      { month: 'Aug', bookings: 0 },
      { month: 'Sep', bookings: 0 },
      { month: 'Oct', bookings: 0 },
      { month: 'Nov', bookings: 0 },
      { month: 'Dec', bookings: 0 }
    ];
    
    // นับจำนวนการจองในแต่ละเดือน
    bookings.forEach(booking => {
      const monthIndex = booking.month;
      monthsOfYear[monthIndex].bookings += 1;
    });
    
    return monthsOfYear;
  };
  
  // กำหนด xAxis dataKey ตาม filter ที่เลือก
  const getXAxisDataKey = () => {
    switch (chartFilterPeriod) {
      case 'hourly': return 'time';
      case 'daily': return 'day';
      case 'monthly': return 'date';
      case 'yearly': return 'month';
      default: return 'time';
    }
  };
  
  // กำหนด tooltip ตาม filter ที่เลือก
  const renderCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      let displayLabel = label;
      
      if (chartFilterPeriod === 'monthly') {
        displayLabel = `Day ${label}`;
      }
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{displayLabel}</p>
          <p className="tooltip-value">
            {payload[0].value} Bookings
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="average-bookings-card">
      <CardContent className="chart-content">
        {loading ? (
          <div className="loading-indicator">Loading...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : chartData.length === 0 ? (
          <div className="no-data-message">ไม่พบข้อมูลการจองในช่วงเวลาที่เลือก</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              className="bookings-chart"
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                className="chart-grid"
              />
              <XAxis 
                dataKey={getXAxisDataKey()} 
                tickLine={false}
                axisLine={false}
                className="x-axis"
                interval={0} // แสดงทุกค่าใน X-Axis โดยไม่มีการข้าม
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                className="y-axis"
              />
              <Tooltip content={renderCustomTooltip} />
              <Bar 
                dataKey="bookings" 
                fill="#8884d8" 
                className="booking-bars"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default AverageBookingsChart;