import React, { useState, useEffect } from 'react';
import './Dashboard.css';

// Custom hooks
import useAuth from '../../hooks/useAuth';
import useRevenueData from '../../hooks/useRevenueData';

// Utils
import { getPreviousMonth } from '../../utils/dateUtils';

// Components
import DateFilterBar from '../../components/dashboard/DateFilterBar';
import FilterButton from './FilterButton';
import MetricsGrid from '../../components/dashboard/MetricsGrid';
import RevenueChart from '../../components/common/Card/RevenueChart';
import RevenuePieChart from '../../components/common/Card/RevenuePieChart';
import AverageBookingsChart from '../../components/common/Card/AverageBookings';
import BookingHistoryTable from '../../components/common/Card/BookingHistoryTable';

const DashboardPage = () => {
  // State สำหรับ filter หลักของหน้า dashboard (ใช้กับ metrics)
  // เริ่มต้นด้วย monthly ตามที่ต้องการ
  const [dashboardFilterPeriod, setDashboardFilterPeriod] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // เพิ่ม state สำหรับการกรอง field และ court_type
  const [selectedFields, setSelectedFields] = useState([]);
  const [selectedCourtTypes, setSelectedCourtTypes] = useState([]);
  
  // State สำหรับ RevenueChart filter แยกต่างหาก
  const [revenueChartFilterPeriod, setRevenueChartFilterPeriod] = useState('daily');
  const [pieChartType, setPieChartType] = useState('field');
  
  // เพิ่ม state สำหรับ AverageBookingsChart filter แยกต่างหาก
  const [bookingsChartFilterPeriod, setBookingsChartFilterPeriod] = useState('hourly');
  
  // เพิ่ม state สำหรับบังคับ AverageBookingsChart ให้ refresh
  const [bookingsChartKey, setBookingsChartKey] = useState(0);
  
  // ใช้ custom hooks
  const { user } = useAuth();
  const { metrics, loading, error } = useRevenueData(user, selectedMonth, selectedYear, dashboardFilterPeriod);

  // ใช้ useEffect เพื่อให้ filter หลักมีผลต่อ Revenue Overview filter
  useEffect(() => {
    // อัพเดท Revenue chart filter ตาม dashboard filter
    setRevenueChartFilterPeriod(dashboardFilterPeriod);
  }, [dashboardFilterPeriod]);
  
  // เพิ่ม useEffect เพื่อให้เมื่อเดือนหรือปีเปลี่ยน ให้บังคับ refresh AverageBookingsChart
  useEffect(() => {
    // เพิ่ม key เพื่อบังคับ component ให้ render ใหม่
    setBookingsChartKey(prevKey => prevKey + 1);
  }, [selectedMonth, selectedYear, dashboardFilterPeriod]);

  // Handlers สำหรับ filter หลักของหน้า dashboard
  const handleMonthChange = (month) => {
    setSelectedMonth(month);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  const handleDashboardFilterChange = (period) => {
    setDashboardFilterPeriod(period);
  };
  
  // Handler สำหรับ RevenueChart filter
  const handleRevenueChartFilterChange = (event) => {
    setRevenueChartFilterPeriod(event.target.value.toLowerCase());
  };
  
  // Handler สำหรับ AverageBookingsChart filter
  const handleBookingsChartFilterChange = (event) => {
    setBookingsChartFilterPeriod(event.target.value.toLowerCase());
    // บังคับ refresh เมื่อเปลี่ยน filter
    setBookingsChartKey(prevKey => prevKey + 1);
  };
  
  // Handler สำหรับรับค่า filters จาก FilterButton
  const handleApplyFilters = (fields, courtTypes) => {
    setSelectedFields(fields);
    setSelectedCourtTypes(courtTypes);
    // บังคับ refresh เมื่อเปลี่ยน filters
    setBookingsChartKey(prevKey => prevKey + 1);
  };

  // คำนวณเดือนก่อนหน้า
  const previousMonth = getPreviousMonth(selectedMonth, selectedYear);

  console.log('Dashboard Rendering - Selected Month:', selectedMonth, 'Selected Year:', selectedYear);
  console.log('Bookings Chart Key:', bookingsChartKey);

  return (
    <div className="dashboard-container">
      {/* Filter Bar หลักของหน้า dashboard */}
      <div className="filter-bar">
        <DateFilterBar 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          filterPeriod={dashboardFilterPeriod}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
          onFilterChange={handleDashboardFilterChange}
        />
        <FilterButton onApplyFilters={handleApplyFilters} />
      </div>

      {/* Metrics Grid - ใช้ dashboard filter */}
      <MetricsGrid metrics={metrics} loading={loading} />

      {/* Charts Section */}
      <div className="charts-section">
        {/* Left Column - Revenue Overview and Average Bookings */}
        <div className="left-charts">
          <div className="chart-card revenue-overview">
            <div className="chart-header">
              <h2 className="chart-title">Revenue Overview</h2>
              {/* Select สำหรับ RevenueChart filter แยกต่างหาก */}
              <select 
                className="chart-select"
                value={revenueChartFilterPeriod}
                onChange={handleRevenueChartFilterChange}
              >
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="chart-container">
              {/* ส่ง revenueChartFilterPeriod ไปให้ RevenueChart */}
              <RevenueChart 
                filterPeriod={revenueChartFilterPeriod} 
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                previousMonth={previousMonth.month}
                previousYear={previousMonth.year}
                selectedFields={selectedFields}
                selectedCourtTypes={selectedCourtTypes}
              />
            </div>
          </div>

          <div className="chart-card average-bookings">
            <div className="chart-header">
              <h2 className="chart-title">Average Bookings</h2>
              {/* แก้ไข Select สำหรับ AverageBookingsChart ให้มีตัวเลือกครบ */}
              <select 
                className="chart-select"
                value={bookingsChartFilterPeriod}
                onChange={handleBookingsChartFilterChange}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="chart-container">
              {/* เพิ่ม key เพื่อบังคับให้ component render ใหม่เมื่อข้อมูลเปลี่ยน */}
              <AverageBookingsChart 
                key={bookingsChartKey}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                selectedFields={selectedFields}
                selectedCourtTypes={selectedCourtTypes}
                chartFilterPeriod={bookingsChartFilterPeriod}
                dashboardFilterPeriod={dashboardFilterPeriod}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Revenue Proportion */}
        <div className="chart-card revenue-proportion">
          <div className="chart-header">
            <h2 className="chart-title">Revenue Proportion</h2>
            <select 
              className="chart-select"
              value={pieChartType}
              onChange={(e) => setPieChartType(e.target.value.toLowerCase())}
            >
              <option value="field">Field</option>
              <option value="court_type">Court Type</option>
            </select>
          </div>
          <div className="pie-chart-container">
            <RevenuePieChart 
              filterPeriod={dashboardFilterPeriod}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedFields={selectedFields}
              selectedCourtTypes={selectedCourtTypes}
              chartType={pieChartType}
            />
          </div>
        </div>
      </div>

      {/* Booking History */}
      <div className="booking-history">
        <BookingHistoryTable 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          selectedFields={selectedFields}
          selectedCourtTypes={selectedCourtTypes}
        />
      </div>
    </div>
  );
};

export default DashboardPage;