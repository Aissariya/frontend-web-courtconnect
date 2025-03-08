import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import './FieldManagementPage.css';
import AddCourtForm from './AddCourtForm';
import CourtDetailsModal from './CourtDetailsModal';

function CourtManagement() {
  const [showAddCourtForm, setShowAddCourtForm] = useState(false);
  const [selectedPage, setSelectedPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const statusDropdownRef = useRef(null);
  
  const handleViewDetails = (court) => {
    setSelectedCourt(court);
  };

  const handleCloseDetails = () => {
    setSelectedCourt(null);
  };

  const handleSaveStatus = (courtId, newStatus) => {
    // Update court status in your data
    const updatedCourts = courts.map(court => 
      court.id === courtId ? { ...court, status: newStatus } : court
    );
    
    // In a real app, you would update your state or make an API call here
    console.log('Updated courts:', updatedCourts);
    
    Swal.fire({
      title: 'Success!',
      text: 'Court status has been updated successfully',
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#A2F193'
    });
  };

  const toggleStatusDropdown = () => {
    setIsStatusDropdownOpen(!isStatusDropdownOpen);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setIsStatusDropdownOpen(false);
  };
  
  const handleAddCourt = () => {
    setShowAddCourtForm(true);
  };

  const handleBackFromAddCourt = () => {
    setShowAddCourtForm(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const courts = [
    { 
      id: 1, 
      name: 'Alpha Court TH', 
      type: 'Football', 
      hours: '13:00 - 23:00', 
      capacity: '22', 
      bookingSlots: 'Hourly', 
      status: 'Available',
      days: ['Wed', 'Sat', 'Sun'],
      price: '1,500'
    },
    { 
      id: 2, 
      name: 'Beta Court TH', 
      type: 'Basketball', 
      hours: '09:00 - 18:00', 
      capacity: '12', 
      bookingSlots: 'Hourly', 
      status: 'Available',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      price: '1,200'
    },
    { 
      id: 3, 
      name: 'Gamma Court TH', 
      type: 'Swim', 
      hours: '15:00 - 20:00', 
      capacity: '25', 
      bookingSlots: '30 minutes', 
      status: 'Available',
      days: ['Mon', 'Wed', 'Fri'],
      price: '800'
    },
    { 
      id: 4, 
      name: 'Lion Singto', 
      type: 'Badminton', 
      hours: '17:30 - 23:30', 
      capacity: '22', 
      bookingSlots: 'Hourly', 
      status: 'Available',
      days: ['Tue', 'Thu', 'Sat', 'Sun'],
      price: '1,000'
    },
    { 
      id: 5, 
      name: 'Football Club', 
      type: 'Yoga', 
      hours: '08:00 - 18:00', 
      capacity: '13', 
      bookingSlots: 'Hourly', 
      status: 'Unavailable',
      days: ['Mon', 'Wed', 'Fri'],
      price: '900'
    },
  ];

  const filteredCourts = statusFilter
    ? courts.filter(court => court.status === statusFilter)
    : courts;

  // If showing add court form, render that component
  if (showAddCourtForm) {
    return <AddCourtForm onBack={handleBackFromAddCourt} />;
  }

  // Otherwise render the court management page
  return (
    <div className="court-management">
      <div className="filter-button">
        <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 7.5H18.5" stroke="#363636" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6.5 11.5H16.5" stroke="#363636" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8.5 15.5H14.5" stroke="#363636" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span>Filter</span>
      </div>
      
      <div className="dashboard-button" onClick={handleAddCourt}>
        <span>Add Court</span>
      </div>
      
      <div className="main-container">
        <div className="header-section">
          <div className="topic-card">
            <div className="icon-container">
              <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 2.25C7.29 2.25 2.25 7.29 2.25 13.5C2.25 19.71 7.29 24.75 13.5 24.75C19.71 24.75 24.75 19.71 24.75 13.5C24.75 7.29 19.71 2.25 13.5 2.25ZM13.5 22.5C8.53 22.5 4.5 18.47 4.5 13.5C4.5 8.53 8.53 4.5 13.5 4.5C18.47 4.5 22.5 8.53 22.5 13.5C22.5 18.47 18.47 22.5 13.5 22.5Z" fill="#363636"/>
                <path d="M14.625 7.875C14.625 8.49632 14.1213 9 13.5 9C12.8787 9 12.375 8.49632 12.375 7.875C12.375 7.25368 12.8787 6.75 13.5 6.75C14.1213 6.75 14.625 7.25368 14.625 7.875Z" fill="#363636"/>
                <path d="M14.625 19.125C14.625 19.7463 14.1213 20.25 13.5 20.25C12.8787 20.25 12.375 19.7463 12.375 19.125C12.375 18.5037 12.8787 18 13.5 18C14.1213 18 14.625 18.5037 14.625 19.125Z" fill="#363636"/>
                <path d="M7.875 14.625C7.25368 14.625 6.75 14.1213 6.75 13.5C6.75 12.8787 7.25368 12.375 7.875 12.375C8.49632 12.375 9 12.8787 9 13.5C9 14.1213 8.49632 14.625 7.875 14.625Z" fill="#363636"/>
                <path d="M19.125 14.625C18.5037 14.625 18 14.1213 18 13.5C18 12.8787 18.5037 12.375 19.125 12.375C19.7463 12.375 20.25 12.8787 20.25 13.5C20.25 14.1213 19.7463 14.625 19.125 14.625Z" fill="#363636"/>
              </svg>
            </div>
            <span className="topic-text">My Court</span>
          </div>
          
          <div className="selection-dropdown" ref={statusDropdownRef}>
            <button onClick={toggleStatusDropdown} className="status-button">
              <span>Status</span>
              <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.25 8.75L10.5 14L15.75 8.75" stroke="rgba(54, 54, 54, 0.5)" strokeWidth="2" />
              </svg>
            </button>
            {isStatusDropdownOpen && (
              <div className="status-dropdown">
                <button onClick={() => handleStatusFilter('Available')}>Available</button>
                <button onClick={() => handleStatusFilter('Unavailable')}>Unavailable</button>
                {statusFilter && (
                  <button onClick={() => handleStatusFilter(null)}>Clear Filter</button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="table-container">
          <div className="table-header">
            <div className="header-cell with-sort">
              <span>Field</span>
              <div className="sort-icon">
                <svg width="10.51" height="15.76" viewBox="0 0 11 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 0L10 5H1L5.5 0Z" fill="rgba(54, 54, 54, 0.5)"/>
                  <path d="M5.5 16L1 11H10L5.5 16Z" fill="rgba(54, 54, 54, 0.5)"/>
                </svg>
              </div>
            </div>
            <div className="header-cell with-sort">
              <span>Court Type</span>
              <div className="sort-icon">
                <svg width="10.51" height="15.76" viewBox="0 0 11 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 0L10 5H1L5.5 0Z" fill="rgba(54, 54, 54, 0.5)"/>
                  <path d="M5.5 16L1 11H10L5.5 16Z" fill="rgba(54, 54, 54, 0.5)"/>
                </svg>
              </div>
            </div>
            <div className="header-cell">
              <span>Available Hours</span>
            </div>
            <div className="header-cell">
              <span>Capacity</span>
            </div>
            <div className="header-cell">
              <span>Booking Slots</span>
            </div>
            <div className="header-cell">
              <span>Status</span>
            </div>
            <div className="header-cell">
              <span>Action</span>
            </div>
          </div>
          
          <div className="table-body">
            {filteredCourts.map(court => (
              <div className="table-row" key={court.id}>
                <div className="court-info">
                  <div className="court-image"></div>
                  <span className="court-name">{court.name}</span>
                </div>
                <div className="court-type">{court.type}</div>
                <div className="court-hours">{court.hours}</div>
                <div className="court-capacity">{court.capacity}</div>
                <div className="court-booking-slots">{court.bookingSlots}</div>
                <div className={`court-status ${court.status.toLowerCase()}`}>
                  {court.status}
                </div>
                <div className="court-action">
                  <button className="action-button" onClick={() => handleViewDetails(court)}>
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pagination">
          <div className="pagination-text">Showing 1 to {filteredCourts.length} of {filteredCourts.length} entries</div>
          <div className="pagination-controls">
            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="chevron-left">
              <path d="M13 16L7 10.5L13 5" stroke="rgba(54, 54, 54, 0.5)" strokeWidth="2" />
            </svg>
            <div className={`page-number ${selectedPage === 1 ? 'active' : ''}`} onClick={() => setSelectedPage(1)}>1</div>
            <div className={`page-number ${selectedPage === 2 ? 'active' : ''}`} onClick={() => setSelectedPage(2)}>2</div>
            <div className={`page-number ${selectedPage === 3 ? 'active' : ''}`} onClick={() => setSelectedPage(3)}>3</div>
            <div className={`page-number ${selectedPage === 4 ? 'active' : ''}`} onClick={() => setSelectedPage(4)}>4</div>
            <div className={`page-number ${selectedPage === 5 ? 'active' : ''}`} onClick={() => setSelectedPage(5)}>5</div>
            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="chevron-right">
              <path d="M8 5L14 10.5L8 16" stroke="#363636" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
      
      {selectedCourt && (
        <CourtDetailsModal 
          court={selectedCourt} 
          onClose={handleCloseDetails} 
          onSave={handleSaveStatus} 
        />
      )}
    </div>
  );
}

export default CourtManagement;