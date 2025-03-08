import React, { useState } from 'react';
import './CourtDetailsModal.css';

function CourtDetailsModal({ court, onClose, onSave }) {
  const [status, setStatus] = useState(court.status);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setIsStatusDropdownOpen(false);
  };

  const handleSaveStatus = () => {
    onSave(court.id, status);
    onClose();
  };

  const handleEditDetail = () => {
    // Handle edit detail action
    console.log('Edit detail for court:', court.id);
    // You would typically navigate to an edit form or open another modal
  };

  const toggleStatusDropdown = () => {
    setIsStatusDropdownOpen(!isStatusDropdownOpen);
  };

  return (
    <div className="court-details-modal-overlay">
      <div className="court-details-modal">
        <div className="modal-header">
          <h2 className="modal-title">Court Details</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 1L1 13" stroke="#363636" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 1L13 13" stroke="#363636" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className="modal-content">
          <div className="detail-section">
            <div className="detail-label">Field</div>
            <div className="detail-value">{court.name}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-column">
              <div className="detail-label">Court</div>
              <div className="detail-value">{court.type}</div>
            </div>
            <div className="detail-column">
              <div className="detail-label">Capacity (people)</div>
              <div className="detail-value">{court.capacity}</div>
            </div>
          </div>
          
          <div className="detail-section">
            <div className="detail-label">Days</div>
            <div className="days-container">
              <div className={`day-button ${court.days?.includes('Mon') ? 'active' : ''}`}>
                <span className="day-text">Mon</span>
              </div>
              <div className={`day-button ${court.days?.includes('Tue') ? 'active' : ''}`}>
                <span className="day-text">Tue</span>
              </div>
              <div className={`day-button ${court.days?.includes('Wed') ? 'active' : ''}`}>
                <span className="day-text">Wed</span>
              </div>
              <div className={`day-button ${court.days?.includes('Thu') ? 'active' : ''}`}>
                <span className="day-text">Thu</span>
              </div>
              <div className={`day-button ${court.days?.includes('Fri') ? 'active' : ''}`}>
                <span className="day-text">Fri</span>
              </div>
              <div className={`day-button ${court.days?.includes('Sat') ? 'active' : ''}`}>
                <span className="day-text">Sat</span>
              </div>
              <div className={`day-button ${court.days?.includes('Sun') ? 'active' : ''}`}>
                <span className="day-text">Sun</span>
              </div>
            </div>
          </div>
          
          <div className="detail-section">
            <div className="detail-label">Available Hours</div>
            <div className="detail-value">{court.hours}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-column">
              <div className="detail-label">Booking Slots</div>
              <div className="detail-value">{court.bookingSlots}</div>
            </div>
            <div className="detail-column">
              <div className="detail-label">Price per Slot</div>
              <div className="detail-value">${court.price || '1,500'}</div>
            </div>
          </div>
          
          <div className="detail-section status-section">
            <div className="detail-label">Status</div>
            <div className="status-dropdown-container">
              <div className="status-dropdown-button" onClick={toggleStatusDropdown}>
                <span className={`status-text ${status.toLowerCase()}`}>{status}</span>
                <svg width="16" height="16" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.25 8.75L10.5 14L15.75 8.75" stroke="rgba(54, 54, 54, 0.5)" strokeWidth="2" />
                </svg>
              </div>
              {isStatusDropdownOpen && (
                <div className="status-dropdown-menu">
                  <div className="status-option" onClick={() => handleStatusChange('Available')}>Available</div>
                  <div className="status-option" onClick={() => handleStatusChange('Unavailable')}>Unavailable</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="edit-button" onClick={handleEditDetail}>
            Edit Detail
          </button>
          <button className="save-button" onClick={handleSaveStatus}>
            Save Status
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourtDetailsModal;