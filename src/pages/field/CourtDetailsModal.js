import { useState, useEffect } from "react"
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import firebaseApp from "../../firebaseConfig"
import Swal from "sweetalert2"
import "./CourtDetailsModal.css"

function CourtDetailsModal({ court, onClose, onSave }) {
  // State for court details
  const [status, setStatus] = useState(court.status || "Available")
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [courtData, setCourtData] = useState(court)
  const [timeslotData, setTimeslotData] = useState(court.timeslots || [])

  // Editable fields
  const [editableFields, setEditableFields] = useState({
    name: court.name || court.field || "",
    type: court.type || court.court_type || "",
    capacity: court.capacity || 0,
    bookingSlots: court.bookingSlots || court.bookingslot || 1,
    priceslot: court.priceslot || 0,
    address: court.address || "",
  })

  // Days selection
  const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const [selectedDays, setSelectedDays] = useState(
    court.availableDays || {
      Mon: true,
      Tue: true,
      Wed: true,
      Thu: true,
      Fri: true,
      Sat: true,
      Sun: true,
    },
  )

  // Time range
  const [timeRange, setTimeRange] = useState({
    start:
      court.timeslots && court.timeslots.length > 0 ? extractTimeFromTimestamp(court.timeslots[0].time_start) : "08:00",
    end:
      court.timeslots && court.timeslots.length > 0 ? extractTimeFromTimestamp(court.timeslots[0].time_end) : "20:00",
  })

  // Fix the fetchCourtData function to properly load data from Firebase
  const fetchCourtData = async (courtId) => {
    try {
      setLoading(true)
      const db = getFirestore(firebaseApp)

      // Fetch court document
      const courtDocRef = doc(db, "Court", courtId)
      const courtDocSnap = await getDoc(courtDocRef)

      if (courtDocSnap.exists()) {
        const courtDocData = courtDocSnap.data()

        console.log("Fetched court data:", courtDocData) // Debug log

        setCourtData({
          id: courtId,
          ...courtDocData,
          court_id: courtDocData.court_id || courtId, // Ensure court_id is available
        })

        // Set available days from database or initialize with defaults
        const availableDays = courtDocData.availableDays || {
          Mon: true,
          Tue: true,
          Wed: true,
          Thu: true,
          Fri: true,
          Sat: true,
          Sun: true,
        }
        setSelectedDays(availableDays)

        // Update editable fields
        setEditableFields({
          name: courtDocData.field || "",
          type: courtDocData.court_type || "",
          capacity: courtDocData.capacity || 0,
          bookingSlots: courtDocData.bookingslot || 1,
          priceslot: courtDocData.priceslot || 0,
          address: courtDocData.address || "",
        })

        // Fetch timeslots for this court
        const timeslotsCollection = collection(db, "Timeslot")
        const courtIdToUse = courtDocData.court_id || courtId
        const timeslotsQuery = query(timeslotsCollection, where("court_id", "==", courtIdToUse))
        const timeslotsSnapshot = await getDocs(timeslotsQuery)

        console.log("Timeslots query:", courtIdToUse, "found:", timeslotsSnapshot.size) // Debug log

        const timeslots = timeslotsSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            time_start: extractTimeFromTimestamp(data.time_start),
            time_end: extractTimeFromTimestamp(data.time_end),
            available: typeof data.available === "boolean" ? data.available : data.available === "yes",
          }
        })

        setTimeslotData(timeslots)

        // Set time range from first timeslot
        if (timeslots.length > 0) {
          setTimeRange({
            start: timeslots[0].time_start,
            end: timeslots[0].time_end,
          })
        }

        // Update status based on availability
        if (timeslots.length > 0) {
          setStatus(timeslots[0].available ? "Available" : "Unavailable")
        }
      } else {
        console.error("Court document not found")
      }
    } catch (error) {
      console.error("Error fetching court data:", error)
      Swal.fire({
        title: "Error",
        text: "Failed to load court details",
        icon: "error",
        confirmButtonText: "OK",
      })
    } finally {
      setLoading(false)
    }
  }

  // Extract time from timestamp or string
  function extractTimeFromTimestamp(timeValue) {
    // If it's a Firestore Timestamp
    if (timeValue && typeof timeValue === "object" && timeValue.toDate) {
      const date = timeValue.toDate()
      return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
    }

    // If it's a JavaScript Date
    if (timeValue instanceof Date) {
      return `${timeValue.getHours().toString().padStart(2, "0")}:${timeValue.getMinutes().toString().padStart(2, "0")}`
    }

    // If it's already a time string in 24-hour format
    if (typeof timeValue === "string" && timeValue.includes(":")) {
      return convertTo24Hour(timeValue)
    }

    // Default fallback
    return typeof timeValue === "string" ? timeValue : "08:00"
  }

  // Create timestamp from time string
  function createTimestampFromTime(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return Timestamp.fromDate(date)
  }

  // Convert 12-hour format to 24-hour format
  const convertTo24Hour = (time12h) => {
    if (!time12h) return ""

    // Check if time12h is a string before using includes
    if (typeof time12h !== "string") {
      return time12h.toString()
    }

    // Check if already in 24-hour format (no AM/PM)
    if (!time12h.includes("AM") && !time12h.includes("PM")) {
      return time12h
    }

    const [time, modifier] = time12h.split(" ")
    let [hours, minutes] = time.split(":")

    if (hours === "12") {
      hours = "00"
    }

    if (modifier === "PM") {
      hours = Number.parseInt(hours, 10) + 12
    }

    return `${hours.padStart(2, "0")}:${minutes}`
  }

  // Convert 24-hour format to 12-hour format (for backward compatibility if needed)
  const convertTo12Hour = (time24h) => {
    if (!time24h) return ""

    // Check if already in 12-hour format (has AM/PM)
    if (time24h.includes("AM") || time24h.includes("PM")) {
      return time24h
    }

    const [hours, minutes] = time24h.split(":")
    const hour = Number.parseInt(hours, 10)

    if (hour === 0) {
      return `12:${minutes} AM`
    } else if (hour < 12) {
      return `${hour}:${minutes} AM`
    } else if (hour === 12) {
      return `12:${minutes} PM`
    } else {
      return `${hour - 12}:${minutes} PM`
    }
  }

  // Add this function after the convertTo12Hour function and before handleSaveDetails

  // Extract open days from availableDays map
  const getOpenDays = () => {
    // Filter days where the value is true
    return Object.entries(selectedDays)
      .filter(([day, isOpen]) => isOpen)
      .map(([day]) => day)
  }

  // You can use this function anywhere you need to get the list of open days
  // For example, add this to display open days in a readable format:

  const formatOpenDays = () => {
    const openDays = getOpenDays()
    return openDays.length > 0 ? openDays.join(", ") : "No open days"
  }

  // Fix the handleSaveDetails function to properly update Firebase
  const handleSaveDetails = async () => {
    try {
      setLoading(true)
      const db = getFirestore(firebaseApp)

      console.log("Saving court details for ID:", court.id) // Debug log

      // Update court document
      const courtDocRef = doc(db, "Court", court.id)

      const updateData = {
        field: editableFields.name,
        court_type: editableFields.type,
        capacity: Number(editableFields.capacity),
        bookingslot: Number(editableFields.bookingSlots),
        priceslot: Number(editableFields.priceslot),
        address: editableFields.address,
        availableDays: selectedDays,
      }

      console.log("Updating court with data:", updateData) // Debug log

      await updateDoc(courtDocRef, updateData)

      // Update timeslots
      const timeslotsCollection = collection(db, "Timeslot")
      const courtIdToUse = courtData.court_id || court.id
      const timeslotsQuery = query(timeslotsCollection, where("court_id", "==", courtIdToUse))
      const timeslotsSnapshot = await getDocs(timeslotsQuery)

      console.log("Found timeslots to update:", timeslotsSnapshot.size) // Debug log

      // Create Timestamp objects for time_start and time_end
      const startTimestamp = createTimestampFromTime(timeRange.start)
      const endTimestamp = createTimestampFromTime(timeRange.end)

      // Get the list of open days
      const openDays = getOpenDays()
      console.log("Open days to update in timeslots:", openDays) // Debug log

      // Update each timeslot with new time range and available days
      const updatePromises = timeslotsSnapshot.docs.map(async (timeslotDoc) => {
        const timeslotRef = doc(db, "Timeslot", timeslotDoc.id)
        const timeslotData = timeslotDoc.data()

        // Check if this timeslot has a day field
        const timeslotDay = timeslotData.day || ""

        // Determine if this timeslot should be available based on its day
        // If the timeslot has a day field, check if it's in the open days list
        // Otherwise, keep the current availability status
        const isAvailableDay = timeslotDay ? openDays.includes(timeslotDay) : timeslotData.available

        const updateData = {
          time_start: startTimestamp,
          time_end: endTimestamp,
          available: isAvailableDay,
          availableDays: selectedDays, // Add the full availableDays map to each timeslot
        }

        console.log("Updating timeslot:", timeslotDoc.id, updateData) // Debug log
        return updateDoc(timeslotRef, updateData)
      })

      await Promise.all(updatePromises)

      Swal.fire({
        title: "Success",
        text: "Court details updated successfully",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#A2F193",
      })

      // Notify parent component about the status change
      onSave(court.id, status)
      // Exit edit mode
      setIsEditMode(false)
      // Refresh data
      fetchCourtData(court.id)
    } catch (error) {
      console.error("Error updating court details:", error)
      Swal.fire({
        title: "Error",
        text: "Failed to update court details: " + error.message,
        icon: "error",
        confirmButtonText: "OK",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fix the handleSaveStatus function to properly update Firebase
  const handleSaveStatus = async () => {
    try {
      setLoading(true)
      const db = getFirestore(firebaseApp)

      console.log("Saving status for court ID:", court.id, "Status:", status) // Debug log

      // Update timeslots with new status
      const timeslotsCollection = collection(db, "Timeslot")
      const courtIdToUse = courtData.court_id || court.id
      const timeslotsQuery = query(timeslotsCollection, where("court_id", "==", courtIdToUse))
      const timeslotsSnapshot = await getDocs(timeslotsQuery)

      console.log("Found timeslots for status update:", timeslotsSnapshot.size) // Debug log

      const updatePromises = timeslotsSnapshot.docs.map(async (timeslotDoc) => {
        const timeslotRef = doc(db, "Timeslot", timeslotDoc.id)
        const updateData = {
          available: status === "Available", // Changed to boolean
        }
        console.log("Updating timeslot status:", timeslotDoc.id, updateData) // Debug log
        return updateDoc(timeslotRef, updateData)
      })

      await Promise.all(updatePromises)

      Swal.fire({
        title: "Success",
        text: "Court status updated successfully",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#A2F193",
      })

      // Notify parent component about the status change
      onSave(court.id, status)
      onClose()
    } catch (error) {
      console.error("Error updating court status:", error)
      Swal.fire({
        title: "Error",
        text: "Failed to update court status: " + error.message,
        icon: "error",
        confirmButtonText: "OK",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
    setIsStatusDropdownOpen(false)
  }

  const toggleStatusDropdown = () => {
    setIsStatusDropdownOpen(!isStatusDropdownOpen)
  }

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
  }

  const handleInputChange = (field, value) => {
    setEditableFields({
      ...editableFields,
      [field]: value,
    })
  }

  const handleTimeChange = (type, value) => {
    setTimeRange({
      ...timeRange,
      [type]: value,
    })
  }

  const toggleDaySelection = (day) => {
    setSelectedDays({
      ...selectedDays,
      [day]: !selectedDays[day],
    })
  }

  const formatAvailableHours = () => {
    if (status === "Unavailable" || !timeslotData || timeslotData.length === 0) {
      return "No available hours"
    }

    // Get unique time ranges in 24-hour format
    const uniqueTimeRanges = [
      ...new Set(
        timeslotData.map((slot) => {
          const startTime = slot.time_start
          const endTime = slot.time_end
          return `${startTime} - ${endTime}`
        }),
      ),
    ]

    return uniqueTimeRanges[0] || "No available hours" // Show only the first time range
  }

  // Create custom time picker with 24-hour format
  const renderCustomTimePicker = (type) => {
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
    const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]

    const [currentHour, currentMinute] = timeRange[type].split(":")

    return (
      <div className="custom-time-picker">
        <select
          value={currentHour}
          onChange={(e) => {
            const newTime = `${e.target.value}:${currentMinute}`
            handleTimeChange(type, newTime)
          }}
          className="hour-select"
        >
          {hours.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
        <span>:</span>
        <select
          value={currentMinute}
          onChange={(e) => {
            const newTime = `${currentHour}:${e.target.value}`
            handleTimeChange(type, newTime)
          }}
          className="minute-select"
        >
          {minutes.map((minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // Ensure useEffect runs properly when court.id changes
  useEffect(() => {
    console.log("Court ID changed:", court.id) // Debug log
    if (court.id) {
      fetchCourtData(court.id)
    }
  }, [court.id])

  return (
    <div className="court-details-modal-overlay">
      <div className="court-details-modal">
        <div className="modal-header">
          <h2 className="modal-title">Court Details</h2>
          <button className="close-button" onClick={onClose} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 1L1 13" stroke="#363636" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1 1L13 13" stroke="#363636" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>
          ) : (
            <>
              <div className="detail-section">
                <div className="detail-label">Field</div>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editableFields.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <div className="detail-value">{editableFields.name}</div>
                )}
              </div>

              <div className="detail-row">
                <div className="detail-column">
                  <div className="detail-label">Court</div>
                  {isEditMode ? (
                    <select
                      value={editableFields.type}
                      onChange={(e) => handleInputChange("type", e.target.value)}
                      className="edit-input"
                    >
                      <option value="Yoga">Yoga</option>
                      <option value="Tennis">Tennis</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Football">Football</option>
                      <option value="Badminton">Badminton</option>
                      <option value="Ping Pong">Ping Pong</option>
                      <option value="Swimming">Swimming</option>
                      <option value="Boxing">Boxing</option>
                      <option value="Aerobics">Aerobics</option>
                    </select>
                  ) : (
                    <div className="detail-value">{editableFields.type}</div>
                  )}
                </div>
                <div className="detail-column">
                  <div className="detail-label">Capacity (people)</div>
                  {isEditMode ? (
                    <input
                      type="number"
                      value={editableFields.capacity}
                      onChange={(e) => handleInputChange("capacity", e.target.value)}
                      className="edit-input"
                      min="1"
                    />
                  ) : (
                    <div className="detail-value">{editableFields.capacity}</div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">Days</div>
                <div className="days-container">
                  {allDays.map((day) => (
                    <div
                      key={day}
                      className={`day-button ${isEditMode ? "editable" : ""} ${selectedDays[day] ? "active" : ""}`}
                      onClick={isEditMode ? () => toggleDaySelection(day) : undefined}
                      style={isEditMode ? { cursor: "pointer" } : {}}
                    >
                      <span className="day-text">{day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">Available Hours</div>
                {isEditMode ? (
                  <div className="time-range-inputs">
                    {renderCustomTimePicker("start")}
                    <span>to</span>
                    {renderCustomTimePicker("end")}
                  </div>
                ) : (
                  <div className="detail-value">{formatAvailableHours()}</div>
                )}
              </div>

              <div className="detail-row">
                <div className="detail-column">
                  <div className="detail-label">Booking Slots</div>
                  {isEditMode ? (
                    <input
                      type="number"
                      value={editableFields.bookingSlots}
                      onChange={(e) => handleInputChange("bookingSlots", e.target.value)}
                      className="edit-input"
                      min="1"
                    />
                  ) : (
                    <div className="detail-value">{editableFields.bookingSlots}</div>
                  )}
                </div>
                <div className="detail-column">
                  <div className="detail-label">Price per Slot</div>
                  {isEditMode ? (
                    <input
                      type="number"
                      value={editableFields.priceslot}
                      onChange={(e) => handleInputChange("priceslot", e.target.value)}
                      className="edit-input"
                      min="0"
                    />
                  ) : (
                    <div className="detail-value">฿{editableFields.priceslot?.toLocaleString() || "—"}</div>
                  )}
                </div>
              </div>

              {isEditMode && (
                <div className="detail-section">
                  <div className="detail-label">Address</div>
                  <textarea
                    value={editableFields.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="edit-input textarea"
                    rows="2"
                  />
                </div>
              )}

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
                      <div className="status-option" onClick={() => handleStatusChange("Available")}>
                        Available
                      </div>
                      <div className="status-option" onClick={() => handleStatusChange("Unavailable")}>
                        Unavailable
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {isEditMode ? (
            <>
              <button className="cancel-button" onClick={toggleEditMode} disabled={loading}>
                Cancel
              </button>
              <button className="save-button" onClick={handleSaveDetails} disabled={loading}>
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button className="edit-button" onClick={toggleEditMode} disabled={loading}>
                Edit Detail
              </button>
              <button className="save-button" onClick={handleSaveStatus} disabled={loading}>
                Save Status
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourtDetailsModal