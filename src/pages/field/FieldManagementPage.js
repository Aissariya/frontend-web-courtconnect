import React, { useState } from 'react';
import Swal from 'sweetalert2';
import './FieldManagementPage.css';
import AddCourtForm from "./AddCourtForm"

const courtsData = [
  {
    field: "Alpha Court TH",
    courtType: "Football",
    availableHours: "13:00 - 23:00",
    capacity: 10,
    bookingSlots: "Hourly",
    status: "Available",
  },
  {
    field: "Beta Court TH",
    courtType: "Basketball",
    availableHours: "09:00 - 18:00",
    capacity: 7,
    bookingSlots: "Hourly",
    status: "Available",
  },
  {
    field: "Gamma Court TH",
    courtType: "Swim",
    availableHours: "15:00 - 20:00",
    capacity: 25,
    bookingSlots: "30 minutes",
    status: "Available",
  },
  {
    field: "Lion Single",
    courtType: "Badminton",
    availableHours: "17:30 - 23:30",
    capacity: 12,
    bookingSlots: "Hourly",
    status: "Available",
  },
  {
    field: "Football Club",
    courtType: "Yoga",
    availableHours: "08:00 - 18:00",
    capacity: 5,
    bookingSlots: "Hourly",
    status: "Unavailable",
  },
]

const FieldManagement = () => {
  const [courts, setCourts] = useState(courtsData)
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAddCourtOpen, setIsAddCourtOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("field-management")

  const handleDetails = (court) => {
    setSelectedCourt(court)
    setIsDetailsOpen(true)
  }

  const handleAddCourt = () => {
    setIsAddCourtOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
  }

  const handleCloseAddCourt = () => {
    setIsAddCourtOpen(false)
  }

  const handleTabClick = (tab) => {
    setActiveTab(tab)
  }

  const handleAddNewCourt = (newCourt) => {
    setCourts([...courts, newCourt])
    setIsAddCourtOpen(false)
  }

  return (
    <div className="field-management">
      <header className="header">
        <h1>Court Connect</h1>

        <nav className="navigation">
          <button
            className={activeTab === "refund-request" ? "active" : ""}
            onClick={() => handleTabClick("refund-request")}
          >
            Refund Request
          </button>
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => handleTabClick("dashboard")}>
            Dashboard
          </button>
          <button
            className={activeTab === "field-management" ? "active" : ""}
            onClick={() => handleTabClick("field-management")}
          >
            Field Management
          </button>
          <button className={activeTab === "profile" ? "active" : ""} onClick={() => handleTabClick("profile")}>
            Profile
          </button>
        </nav>

        <div className="user-actions">
          <button className="add-court-btn" onClick={handleAddCourt}>
            <span className="icon">+</span>
            Add Court
          </button>
          <div className="profile-icon">👤</div>
        </div>
      </header>

      <div className="filter-section">
        <button className="filter-btn">
          <span className="filter-icon">⚙️</span>
          Filter
        </button>
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
                  <span className={`status ${court.status.toLowerCase()}`}>{court.status}</span>
                </td>
                <td>
                  <button onClick={() => handleDetails(court)} className="details-btn">
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button className="active">1</button>
          <button>2</button>
          <button>3</button>
          <button>4</button>
          <button>5</button>
        </div>
      </div>

      {/* Court Details Modal */}
      {isDetailsOpen && selectedCourt && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{selectedCourt.field} Details</h2>
              <button className="close-btn" onClick={handleCloseDetails}>
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="detail-row">
                <span className="detail-label">Court Type:</span>
                <span className="detail-value">{selectedCourt.courtType}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Available Hours:</span>
                <span className="detail-value">{selectedCourt.availableHours}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Capacity:</span>
                <span className="detail-value">{selectedCourt.capacity}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Booking Slots:</span>
                <span className="detail-value">{selectedCourt.bookingSlots}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`status ${selectedCourt.status.toLowerCase()}`}>{selectedCourt.status}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="close-modal-btn" onClick={handleCloseDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Court Modal */}
      {isAddCourtOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Court</h2>
              <button className="close-btn" onClick={handleCloseAddCourt}>
                ×
              </button>
            </div>
            <div className="modal-content">
              <AddCourtForm onSubmit={handleAddNewCourt} onCancel={handleCloseAddCourt} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FieldManagement