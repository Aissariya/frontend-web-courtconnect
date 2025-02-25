import React, { useState } from 'react';
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
  
  // State สำหรับ RevenueChart filter แยกต่างหาก
  const [revenueChartFilterPeriod, setRevenueChartFilterPeriod] = useState('daily');
  
  // ใช้ custom hooks
  const { user } = useAuth();
  const { metrics, loading, error } = useRevenueData(user, selectedMonth, selectedYear, dashboardFilterPeriod);

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

  // คำนวณเดือนก่อนหน้า
  const previousMonth = getPreviousMonth(selectedMonth, selectedYear);

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
        <FilterButton />
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
              />
            </div>
          </div>

          <div className="chart-card average-bookings">
            <div className="chart-header">
              <h2 className="chart-title">Average Bookings</h2>
              <select className="chart-select">
                <option>Hourly</option>
              </select>
            </div>
            <div className="chart-container">
              <AverageBookingsChart 
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Revenue Proportion */}
        <div className="chart-card revenue-proportion">
          <div className="chart-header">
            <h2 className="chart-title">Revenue Proportion</h2>
            <select className="chart-select">
              <option>Field</option>
            </select>
          </div>
          <div className="pie-chart-container">
            <RevenuePieChart 
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          </div>
          <div className="legend-container">
            <div className="legend-item">
              <div className="legend-label">
                <div className="legend-dot legend-dot-alpha"></div>
                <span>Alpha</span>
              </div>
              <span>27,680.00</span>
            </div>
            <div className="legend-item">
              <div className="legend-label">
                <div className="legend-dot legend-dot-beta"></div>
                <span>Beta</span>
              </div>
              <span>16,884.80</span>
            </div>
            <div className="legend-item">
              <div className="legend-label">
                <div className="legend-dot legend-dot-gamma"></div>
                <span>Gamma</span>
              </div>
              <span>10,795.20</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking History */}
      <div className="booking-history">
        <BookingHistoryTable 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      </div>
    </div>
  );
};

export default DashboardPage;