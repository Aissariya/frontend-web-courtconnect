import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { getMonthName, getAvailableYears } from '../../../utils/dateUtils';

const DateFilterBar = ({ 
  selectedMonth, 
  selectedYear, 
  filterPeriod, 
  onMonthChange, 
  onYearChange, 
  onFilterChange 
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // สร้างปีให้เลือกย้อนหลัง 5 ปี และไปข้างหน้า 1 ปี
  const currentYear = new Date().getFullYear();
  const availableYears = getAvailableYears(currentYear, 5, 1);

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleMonthSelectChange = (event) => {
    onMonthChange(parseInt(event.target.value));
  };

  const handleYearSelectChange = (event) => {
    onYearChange(parseInt(event.target.value));
  };

  const handleFilterPeriodChange = (event) => {
    onFilterChange(event.target.value.toLowerCase());
  };

  return (
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
              onChange={handleMonthSelectChange}
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
            
            <select 
              className="year-select" 
              value={selectedYear}
              onChange={handleYearSelectChange}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      <select 
        className="period-select" 
        value={filterPeriod}
        onChange={handleFilterPeriodChange}
      >
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
    </div>
  );
};

export default DateFilterBar;