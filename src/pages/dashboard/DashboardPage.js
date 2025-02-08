import React from 'react';
import MetricCard from '../../components/common/Card/MetricCard';
import RevenueChart from '../../components/common/Card/RevenueChart';
import RevenuePieChart from '../../components/common/Card/RevenuePieChart';
import AverageBookingsChart from '../../components/common/Card/AverageBookings';
import BookingHistoryTable from '../../components/common/Card/BookingHistoryTable';
import './Dashboard.css';
import { Calendar, SlidersHorizontal } from 'lucide-react';

const Dashboard = () => {
  const metrics = [
    { title: 'Revenue', value: '฿55,360.00', change: 26 },
    { title: 'Total Bookings', value: '374', change: 35 },
    { title: 'Total Booking Hours', value: '1,870 hr.', change: 50 },
    { title: 'Total new customers', value: '20', change: -55 },
  ];

  return (
    <div className="dashboard-container">
      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="date-group">
          <button className="date-button">
            <Calendar size={18} />
            <span>December 2024</span>
          </button>
          <select className="period-select">
            <option>Monthly</option>
            <option>Weekly</option>
            <option>Daily</option>
          </select>
        </div>

        <button className="filter-button">
          <SlidersHorizontal size={18} />
          <span>Filter</span>
        </button>
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
              <select className="chart-select">
                <option>Monthly</option>
              </select>
            </div>
            <div className="chart-container">
              <RevenueChart />
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
              <AverageBookingsChart />
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
            <RevenuePieChart />
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
        <BookingHistoryTable />
      </div>
    </div>
  );
};

export default Dashboard;