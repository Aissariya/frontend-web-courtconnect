import React, { useState } from 'react';
import Swal from 'sweetalert2';
import './FieldManagementPage.css';

const courtsData = [
  {
    field: "Alpha Court TH",
    courtType: "Football",
    availableHours: "13:00 - 23:00",
    capacity: 10,
    bookingSlots: "Hourly",
    status: "Available"
  },
  {
    field: "Beta Court TH",
    courtType: "Basketball",
    availableHours: "09:00 - 18:00",
    capacity: 7,
    bookingSlots: "Hourly",
    status: "Available"
  },
  {
    field: "Gamma Court TH",
    courtType: "Swim",
    availableHours: "15:00 - 20:00",
    capacity: 25,
    bookingSlots: "30 minutes",
    status: "Available"
  },
  {
    field: "Lion Single",
    courtType: "Badminton",
    availableHours: "17:30 - 23:30",
    capacity: 12,
    bookingSlots: "Hourly",
    status: "Available"
  },
  {
    field: "Football Club",
    courtType: "Yoga",
    availableHours: "08:00 - 18:00",
    capacity: 5,
    bookingSlots: "Hourly",
    status: "Unavailable"
  }
];

function FieldManagement() {
  const [courts, setCourts] = useState(courtsData);

  const handleDetails = (court) => {
    Swal.fire({
      title: `${court.field} Details`,
      html: `
        <b>Court Type:</b> ${court.courtType}<br>
        <b>Available Hours:</b> ${court.availableHours}<br>
        <b>Capacity:</b> ${court.capacity}<br>
        <b>Booking Slots:</b> ${court.bookingSlots}<br>
        <b>Status:</b> ${court.status}
      `,
      icon: 'info',
      confirmButtonText: 'Close'
    });
  };

  return (
    <div className="field-management">
      <div className="header">
        <h1>Court Connect</h1>
        <nav>
          <a href="#">Refund Request</a>
          <a href="#">Dashboard</a>
          <a href="#" className="active">Field Management</a>
          <a href="#">Profile</a>
        </nav>
        <div className="user-actions">
          <button className="add-court">Add Court</button>
          <div className="profile-icon">👤</div>
        </div>
      </div>

      <div className="filter-section">
        <button className="filter-btn">Filter</button>
      </div>

      <div className="courts-table">
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Court Type</th>
              <th>Available Hours</th>
              <th>Capacity</th>
              <th>Booking Slots</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {courts.map((court, index) => (
              <tr key={index}>
                <td>{court.field}</td>
                <td>{court.courtType}</td>
                <td>{court.availableHours}</td>
                <td>{court.capacity}</td>
                <td>{court.bookingSlots}</td>
                <td>
                  <span className={`status ${court.status.toLowerCase()}`}>
                    {court.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleDetails(court)}
                    className="details-btn"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="pagination">
          <button>1</button>
          <button>2</button>
          <button>3</button>
          <button>4</button>
          <button>5</button>
        </div>
      </div>
    </div>
  );
}

export default FieldManagement;