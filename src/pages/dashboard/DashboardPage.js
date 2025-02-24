import React, { useState } from 'react';
import MetricCard from '../../components/common/Card/MetricCard';
import RevenueChart from '../../components/common/Card/RevenueChart';
import RevenuePieChart from '../../components/common/Card/RevenuePieChart';
import AverageBookingsChart from '../../components/common/Card/AverageBookings';
import BookingHistoryTable from '../../components/common/Card/BookingHistoryTable';
import './Dashboard.css';
import { Calendar, SlidersHorizontal, ChevronDown } from 'lucide-react';
import FilterButton from './FilterButton';

const Dashboard = () => {
  const [filterPeriod, setFilterPeriod] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const metrics = [
    { title: 'Revenue', value: '฿55,360.00', change: 26 },
    { title: 'Total Bookings', value: '374', change: 35 },
    { title: 'Total Booking Hours', value: '1,870 hr.', change: 50 },
    { title: 'Total new customers', value: '20', change: -55 },
  ];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // สร้างปีให้เลือกย้อนหลัง 5 ปี และไปข้างหน้า 1 ปี
  const currentYear = new Date().getFullYear();
  const availableYears = [];
  for (let year = currentYear - 5; year <= currentYear + 1; year++) {
    availableYears.push(year);
  }

  const handleFilterChange = (event) => {
    setFilterPeriod(event.target.value.toLowerCase());
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(parseInt(event.target.value));
  };

  const handleYearChange = (event) => {
    setSelectedYear(parseInt(event.target.value));
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  // คำนวณเดือนก่อนหน้า
  const getPreviousMonth = () => {
    if (selectedMonth === 0) {
      return { month: 11, year: selectedYear - 1 };
    } else {
      return { month: selectedMonth - 1, year: selectedYear };
    }
  };

  const previousMonth = getPreviousMonth();

  return (
    <div className="dashboard-container">
      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="date-group">
          <button className="date-button" onClick={toggleDatePicker}>
            <Calendar size={18} />
            <span>{monthNames[selectedMonth]} {selectedYear}</span>
            <ChevronDown size={16} />
          </button>
          
          {showDatePicker && (
            <div className="date-picker-dropdown">
              <div className="date-picker-row">
                <select 
                  className="month-select" 
                  value={selectedMonth}
                  onChange={handleMonthChange}
                >
                  {monthNames.map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                  ))}
                </select>
                
                <select 
                  className="year-select" 
                  value={selectedYear}
                  onChange={handleYearChange}
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <select className="period-select" onChange={handleFilterChange}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <FilterButton />
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Left Column - Revenue Overview and Average Bookings */}
        <div className="left-charts">
          <div className="chart-card revenue-overview">
            <div className="chart-header">
              <h2 className="chart-title">Revenue Overview</h2>
              <select 
                className="chart-select"
                value={filterPeriod}
                onChange={handleFilterChange}
              >
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="chart-container">
              <RevenueChart 
                filterPeriod={filterPeriod} 
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

export default Dashboard;