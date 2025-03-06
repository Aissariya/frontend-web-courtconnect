import { useState } from "react"
import "./AddCourtForm.css"

const AddCourtForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    field: "",
    courtType: "",
    availableHours: "",
    capacity: 0,
    bookingSlots: "",
    status: "Available",
  })

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form className="add-court-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="field">Field Name</label>
        <input type="text" id="field" name="field" value={formData.field} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label htmlFor="courtType">Court Type</label>
        <select id="courtType" name="courtType" value={formData.courtType} onChange={handleChange} required>
          <option value="">Select court type</option>
          <option value="Football">Football</option>
          <option value="Basketball">Basketball</option>
          <option value="Swim">Swim</option>
          <option value="Badminton">Badminton</option>
          <option value="Yoga">Yoga</option>
          <option value="Tennis">Tennis</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="availableHours">Available Hours</label>
        <input
          type="text"
          id="availableHours"
          name="availableHours"
          placeholder="e.g. 09:00 - 18:00"
          value={formData.availableHours}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="capacity">Capacity</label>
        <input type="number" id="capacity" name="capacity" value={formData.capacity} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label htmlFor="bookingSlots">Booking Slots</label>
        <select id="bookingSlots" name="bookingSlots" value={formData.bookingSlots} onChange={handleChange} required>
          <option value="">Select booking slot type</option>
          <option value="Hourly">Hourly</option>
          <option value="30 minutes">30 minutes</option>
          <option value="15 minutes">15 minutes</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" value={formData.status} onChange={handleChange} required>
          <option value="Available">Available</option>
          <option value="Unavailable">Unavailable</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="submit-btn">
          Add Court
        </button>
      </div>
    </form>
  )
}

export default AddCourtForm