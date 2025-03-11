import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "../Card/Card";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from "../../../firebaseConfig";
import "./AverageBookings.css";

const AverageBookingsChart = ({
  selectedMonth,
  selectedYear,
  selectedFields,
  selectedCourtTypes,
  chartFilterPeriod = "hourly", // รับค่า filter จาก Dashboard
  dashboardFilterPeriod = "monthly", // รับค่า filter หลักของ dashboard
}) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth();

  // เพิ่ม console.log เพื่อตรวจสอบค่าที่ได้รับ
  console.log("AverageBookingsChart Props:", {
    selectedMonth,
    selectedYear,
    chartFilterPeriod,
    dashboardFilterPeriod,
  });

  useEffect(() => {
    console.log("AverageBookingsChart useEffect triggered");
    
    // ตรวจสอบการล็อกอินและดึงข้อมูล
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchBookingData(user);
      } else {
        setError('You need to login to view booking data');
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [
    selectedMonth,
    selectedYear,
    selectedFields,
    selectedCourtTypes,
    chartFilterPeriod,
    dashboardFilterPeriod,
  ]);

  const fetchBookingData = async (user) => {
    try {
      setLoading(true);
      console.log(
        `Starting fetchBookingData - Month: ${selectedMonth}, Year: ${selectedYear}`
      );
      
      if (!user) {
        console.log('No user logged in for booking data');
        setError('You need to login to view booking data');
        setLoading(false);
        return;
      }
      
      // ดึงข้อมูล user_id จาก Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log('User document not found for booking data');
        setError('User profile not found');
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      const userIdForQuery = userData.user_id;
      
      // 1. ดึงข้อมูล Courts ทั้งหมดก่อนเพื่อหาสนามที่ user เป็นเจ้าของ
      const courtsRef = collection(db, "Court");
      const courtsSnapshot = await getDocs(courtsRef);
      
      // สร้าง Map ของข้อมูล Court และเก็บ court_id ที่ user เป็นเจ้าของ
      const courtsMap = {};
      const userCourtIds = [];
      
      courtsSnapshot.forEach((doc) => {
        const court = doc.data();
        courtsMap[court.court_id] = court;
        
        // ถ้าเป็นสนามของ user ปัจจุบัน ให้เก็บ court_id ไว้
        if (court.user_id === userIdForQuery) {
          userCourtIds.push(court.court_id);
        }
      });
      
      console.log('User owned courts:', userCourtIds);
      
      if (userCourtIds.length === 0) {
        console.log('User does not own any courts');
        setChartData([]);
        setLoading(false);
        return;
      }

      // 2. ดึงข้อมูลการจองทั้งหมด
      const bookingsRef = collection(db, "Booking");
      const bookingSnapshot = await getDocs(bookingsRef);
      console.log("จำนวน document ที่ดึงได้:", bookingSnapshot.size);

      const bookings = [];

      bookingSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("ข้อมูล Booking ID:", doc.id, data);
        
        // ข้ามการจองที่ไม่ได้เป็นของสนามที่ user เป็นเจ้าของ
        if (!userCourtIds.includes(data.court_id)) {
          return;
        }

        // แปลง Firestore timestamp หรือ string เป็น Date object
        let startTimeDate;

        if (data.start_time?.toDate) {
          // กรณีเป็น Firestore timestamp
          startTimeDate = data.start_time.toDate();
        } else if (typeof data.start_time === "string") {
          // กรณีเป็น string
          startTimeDate = new Date(data.start_time);
        } else if (data.start_time?.seconds) {
          // กรณีเป็น Firestore timestamp แบบ object
          startTimeDate = new Date(data.start_time.seconds * 1000);
        } else {
          // กรณีอื่นๆ
          startTimeDate = new Date(data.start_time);
        }

        console.log(
          "แปลงเป็นวันที่:",
          startTimeDate,
          "เวลา:",
          startTimeDate.getHours() + ":" + startTimeDate.getMinutes()
        );

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
          year: startTimeDate.getFullYear(),
        });
      });
      
      console.log("จำนวนการจองของสนามที่เป็นเจ้าของ:", bookings.length);

      // กรองข้อมูลตามเดือนและปีที่เลือกหลังจากดึงข้อมูลมาแล้ว
      let filteredBookings = [...bookings];

      if (dashboardFilterPeriod === "monthly") {
        // กรองตามเดือนและปีที่เลือก
        console.log(`กรองตามเดือน: ${selectedMonth}, ปี: ${selectedYear}`);

        filteredBookings = bookings.filter((booking) => {
          return (
            booking.month === selectedMonth && booking.year === selectedYear
          );
        });
      } else if (dashboardFilterPeriod === "yearly") {
        // กรองตามปีที่เลือก
        console.log(`กรองตามปี: ${selectedYear}`);

        filteredBookings = bookings.filter((booking) => {
          return booking.year === selectedYear;
        });
      }
      
      console.log("หลังจากกรองตามเดือน/ปี เหลือข้อมูล:", filteredBookings.length);

      // กรองตาม fields และ court types 
      if (
        (selectedFields && selectedFields.length > 0) ||
        (selectedCourtTypes && selectedCourtTypes.length > 0)
      ) {
        console.log("กรองตาม fields:", selectedFields);
        console.log("กรองตาม court types:", selectedCourtTypes);

        filteredBookings = filteredBookings.filter((booking) => {
          const court = courtsMap[booking.court_id];
          if (!court) return false;

          const fieldMatch =
            selectedFields.length === 0 || selectedFields.includes(court.field);
          const courtTypeMatch =
            selectedCourtTypes.length === 0 ||
            selectedCourtTypes.includes(court.court_type);

          return fieldMatch && courtTypeMatch;
        });
      }

      console.log("หลังจากกรองทั้งหมด เหลือข้อมูล:", filteredBookings.length);

      // สร้างข้อมูลสำหรับแสดงกราฟตาม filter ที่เลือก
      let groupedData = [];

      switch (chartFilterPeriod) {
        case "hourly":
          // จัดกลุ่มตามชั่วโมง
          groupedData = groupBookingsByHour(filteredBookings);
          break;
        case "daily":
          // จัดกลุ่มตามวัน (จันทร์-อาทิตย์)
          groupedData = groupBookingsByDay(filteredBookings);
          break;
        case "monthly":
          // จัดกลุ่มตามวันที่ในเดือน (1-31)
          groupedData = groupBookingsByDate(filteredBookings);
          break;
        case "yearly":
          // จัดกลุ่มตามเดือนในปี (มกราคม-ธันวาคม)
          groupedData = groupBookingsByMonth(filteredBookings);
          break;
        default:
          groupedData = groupBookingsByHour(filteredBookings);
      }

      setChartData(groupedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching booking data:", error);
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
        bookings: 0,
      });
    }

    // นับจำนวนการจองในแต่ละชั่วโมง
    bookings.forEach((booking) => {
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
      { day: "Sunday", bookings: 0 },
      { day: "Monday", bookings: 0 },
      { day: "Tuesday", bookings: 0 },
      { day: "Wednesday", bookings: 0 },
      { day: "Thursday", bookings: 0 },
      { day: "Friday", bookings: 0 },
      { day: "Saturday", bookings: 0 },
    ];

    // นับจำนวนการจองในแต่ละวัน
    bookings.forEach((booking) => {
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
        bookings: 0,
      });
    }

    // นับจำนวนการจองในแต่ละวันที่
    bookings.forEach((booking) => {
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
      { month: "Jan", bookings: 0 },
      { month: "Feb", bookings: 0 },
      { month: "Mar", bookings: 0 },
      { month: "Apr", bookings: 0 },
      { month: "May", bookings: 0 },
      { month: "Jun", bookings: 0 },
      { month: "Jul", bookings: 0 },
      { month: "Aug", bookings: 0 },
      { month: "Sep", bookings: 0 },
      { month: "Oct", bookings: 0 },
      { month: "Nov", bookings: 0 },
      { month: "Dec", bookings: 0 },
    ];

    // นับจำนวนการจองในแต่ละเดือน
    bookings.forEach((booking) => {
      const monthIndex = booking.month;
      monthsOfYear[monthIndex].bookings += 1;
    });

    return monthsOfYear;
  };

  // กำหนด xAxis dataKey ตาม filter ที่เลือก
  const getXAxisDataKey = () => {
    switch (chartFilterPeriod) {
      case "hourly":
        return "time";
      case "daily":
        return "day";
      case "monthly":
        return "date";
      case "yearly":
        return "month";
      default:
        return "time";
    }
  };

  // กำหนด tooltip ตาม filter ที่เลือก
  const renderCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      let displayLabel = label;

      if (chartFilterPeriod === "monthly") {
        displayLabel = `Day ${label}`;
      }

      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{displayLabel}</p>
          <p className="tooltip-value">{payload[0].value} Bookings</p>
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
          <div className="no-data-message">
            ไม่พบข้อมูลการจองในช่วงเวลาที่เลือก
          </div>
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
              <YAxis tickLine={false} axisLine={false} className="y-axis" />
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