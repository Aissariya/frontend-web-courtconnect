export const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  export const getAvailableYears = (backYears = 5, forwardYears = 1) => {
    const currentYear = new Date().getFullYear();
    const availableYears = [];
    for (let year = currentYear - backYears; year <= currentYear + forwardYears; year++) {
      availableYears.push(year);
    }
    return availableYears;
  };
  
  export const getPreviousMonth = (selectedMonth, selectedYear) => {
    if (selectedMonth === 0) {
      return { month: 11, year: selectedYear - 1 };
    } else {
      return { month: selectedMonth - 1, year: selectedYear };
    }
  };
  
  export default {
    monthNames,
    getAvailableYears,
    getPreviousMonth
  };