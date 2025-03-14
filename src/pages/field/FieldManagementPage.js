import { useState, useRef, useEffect } from "react"
import Swal from "sweetalert2"
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import "./FieldManagementPage.css"
import AddCourtForm from "./AddCourtForm"
import CourtDetailsModal from "./CourtDetailsModal"
import FilterButton from "../dashboard/FilterButton"
import firebaseApp from "../../firebaseConfig"

function CourtManagement() {
  const [showAddCourtForm, setShowAddCourtForm] = useState(false)
  const [selectedPage, setSelectedPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState(null)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [selectedFields, setSelectedFields] = useState([])
  const [selectedCourtTypes, setSelectedCourtTypes] = useState([])
  const [courts, setCourts] = useState([])
  const [timeslots, setTimeslots] = useState({})
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [authError, setAuthError] = useState(null)
  const statusDropdownRef = useRef(null)

  useEffect(() => {
    const auth = getAuth(firebaseApp)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // User is signed in, get their user document from Firestore
          const db = getFirestore(firebaseApp)
          const userDocRef = doc(collection(db, "users"), firebaseUser.uid)
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data()
            setCurrentUser(userData)

            // Now fetch courts and timeslots
            await fetchCourtsAndTimeslots(db, userData.user_id)
          } else {
            // User document doesn't exist in Firestore
            console.error("User document not found in Firestore")
            setAuthError("User profile not found. Please contact support.")
            setLoading(false)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setAuthError("Error loading user data. Please try again.")
          setLoading(false)
        }
      } else {
        // User is signed out
        setCurrentUser(null)
        setCourts([])
        setLoading(false)
        setAuthError("Please sign in to view your courts")
      }
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  const fetchCourtsAndTimeslots = async (db, userId) => {
    try {
      // Fetch timeslots
      const timeslotsCollection = collection(db, "Timeslot")
      const timeslotsSnapshot = await getDocs(timeslotsCollection)

      const timeslotsData = {}
      timeslotsSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        if (data.court_id) {
          if (!timeslotsData[data.court_id]) {
            timeslotsData[data.court_id] = []
          }
          timeslotsData[data.court_id].push({
            id: doc.id,
            ...data,
          })
        }
      })
      setTimeslots(timeslotsData)

      // Fetch courts for the current user
      const courtsCollection = collection(db, "Court")
      const courtsQuery = query(courtsCollection, where("user_id", "==", userId))
      const courtsSnapshot = await getDocs(courtsQuery)

      const courtsList = courtsSnapshot.docs.map((doc) => {
        const data = doc.data()
        const courtTimeslots = timeslotsData[data.court_id] || []

        // Determine court status based on timeslots' available field (boolean)
        const isAvailable = courtTimeslots.some((slot) => slot.available === true)

        return {
          id: doc.id,
          name: data.field,
          type: data.court_type,
          capacity: data.capacity,
          bookingSlots: data.bookingslot,
          status: isAvailable ? "Available" : "Unavailable",
          address: data.address,
          court_id: data.court_id,
          priceslot: data.priceslot,
          user_id: data.user_id,
          // Extract images array from court document
          images: data.images || [],
          // Extract image link string from court document
          imageUrl: data.imageUrl || "",
          timeslots: courtTimeslots.filter((slot) => slot.available === true), // Only include available timeslots
        }
      })

      setCourts(courtsList)
      console.log("Fetched courts for user:", courtsList)
    } catch (error) {
      console.error("Error fetching data:", error)
      setAuthError("Error loading court data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (court) => {
    setSelectedCourt(court)
  }

  const handleCloseDetails = () => {
    setSelectedCourt(null)
  }

  const handleSaveStatus = (courtId, newStatus) => {
    const updatedCourts = courts.map((court) => (court.id === courtId ? { ...court, status: newStatus } : court))
    setCourts(updatedCourts)
    console.log("Updated courts:", updatedCourts)

    Swal.fire({
      title: "Success!",
      text: "Court status has been updated successfully",
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: "#A2F193",
    })
  }

  const toggleStatusDropdown = () => {
    setIsStatusDropdownOpen(!isStatusDropdownOpen)
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setIsStatusDropdownOpen(false)
  }

  const handleApplyFilters = (fields, courtTypes) => {
    setSelectedFields(fields)
    setSelectedCourtTypes(courtTypes)
  }

  const handleAddCourt = () => {
    setShowAddCourtForm(true)
  }

  const handleBackFromAddCourt = () => {
    setShowAddCourtForm(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Function to get the court image URL
  const getCourtImageUrl = (court) => {
    try {
      // First check if there's a direct imageUrl string
      if (court.imageUrl && typeof court.imageUrl === "string") {
        // Clean the URL and ensure it's valid
        const url = new URL(court.imageUrl)
        return url.toString()
      }

      // Then check if there's an images array with at least one item
      if (court.images && Array.isArray(court.images) && court.images.length > 0) {
        // Find the first valid image URL
        for (const image of court.images) {
          if (image && typeof image === "string") {
            try {
              const url = new URL(image)
              return url.toString()
            } catch (e) {
              console.warn("Invalid image URL in array:", image)
              continue
            }
          }
        }
      }
    } catch (e) {
      console.warn("Error processing image URL:", e)
    }

    // Return a placeholder if no valid image is found
    return "/placeholder.svg?height=59&width=59"
  }

  const filteredCourts = courts.filter((court) => {
    const matchesField = selectedFields.length === 0 || selectedFields.includes(court.name)
    const matchesCourtType = selectedCourtTypes.length === 0 || selectedCourtTypes.includes(court.type)
    const matchesStatus = !statusFilter || court.status === statusFilter
    return matchesField && matchesCourtType && matchesStatus
  })

  if (showAddCourtForm) {
    return <AddCourtForm onBack={handleBackFromAddCourt} />
  }

  return (
    <>
      <div className="court-management">
        <div className="filter-buttonkr" onClick={() => {}}>
          <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 7.5H18.5" stroke="#363636" strokeWidth="2" strokeLinecap="round" />
            <path d="M6.5 11.5H16.5" stroke="#363636" strokeWidth="2" strokeLinecap="round" />
            <path d="M8.5 15.5H14.5" stroke="#363636" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <FilterButton onApplyFilters={handleApplyFilters} />
        </div>

        {currentUser && (
          <div className="dashboard-button" onClick={handleAddCourt}>
            <span>Add Court</span>
          </div>
        )}

        <div className="main-containerkr">
          {currentUser && (
            <div className="selection-dropdown status-top-right" ref={statusDropdownRef}>
              <button onClick={toggleStatusDropdown} className="status-button">
                <span>Status</span>
                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.25 8.75L10.5 14L15.75 8.75" stroke="rgba(54, 54, 54, 0.5)" strokeWidth="2" />
                </svg>
              </button>
              {isStatusDropdownOpen && (
                <div className="status-dropdown">
                  <button onClick={() => handleStatusFilter("Available")}>Available</button>
                  <button onClick={() => handleStatusFilter("Unavailable")}>Unavailable</button>
                  {statusFilter && <button onClick={() => handleStatusFilter(null)}>Clear Filter</button>}
                </div>
              )}
            </div>
          )}
          <div className="header-section">
            <div className="topic-card">
              <div className="icon-container">
                <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M13.5 2.25C7.29 2.25 2.25 7.29 2.25 13.5C2.25 19.71 7.29 24.75 13.5 24.75C19.71 24.75 24.75 19.71 24.75 13.5C24.75 7.29 19.71 2.25 13.5 2.25ZM13.5 22.5C8.53 22.5 4.5 18.47 4.5 13.5C4.5 8.53 8.53 4.5 13.5 4.5C18.47 4.5 22.5 8.53 22.5 13.5C22.5 18.47 18.47 22.5 13.5 22.5Z"
                    fill="#363636"
                  />
                  <path
                    d="M14.625 7.875C14.625 8.49632 14.1213 9 13.5 9C12.8787 9 12.375 8.49632 12.375 7.875C12.375 7.25368 12.8787 6.75 13.5 6.75C14.1213 6.75 14.625 7.25368 14.625 7.875Z"
                    fill="#363636"
                  />
                  <path
                    d="M14.625 19.125C14.625 19.7463 14.1213 20.25 13.5 20.25C12.8787 20.25 12.375 19.7463 12.375 19.125C12.375 18.5037 12.8787 18 13.5 18C14.1213 18 14.625 18.5037 14.625 19.125Z"
                    fill="#363636"
                  />
                  <path
                    d="M7.875 14.625C7.25368 14.625 6.75 14.1213 6.75 13.5C6.75 12.8787 7.25368 12.375 7.875 12.375C8.49632 12.375 9 12.8787 9 13.5C9 14.1213 8.49632 14.625 7.875 14.625Z"
                    fill="#363636"
                  />
                  <path
                    d="M19.125 14.625C18.5037 14.625 18 14.1213 18 13.5C18 12.8787 18.5037 12.375 19.125 12.375C19.7463 12.375 20.25 12.8787 20.25 13.5C20.25 14.1213 19.7463 14.625 19.125 14.625Z"
                    fill="#363636"
                  />
                </svg>
              </div>
              <span className="topic-text">{currentUser ? `${currentUser.name}'s Courts` : "My Courts"}</span>
            </div>
          </div>

          <div className="table-container">
            <div className="table-header">
              <div className="header-cell with-sort">
                <span>Field</span>
                <div className="sort-icon">
                  <svg width="10.51" height="15.76" viewBox="0 0 11 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5 0L10 5H1L5.5 0Z" fill="rgba(54, 54, 54, 0.5)" />
                    <path d="M5.5 16L1 11H10L5.5 16Z" fill="rgba(54, 54, 54, 0.5)" />
                  </svg>
                </div>
              </div>
              <div className="header-cell with-sort">
                <span>Court Type</span>
                <div className="sort-icon">
                  <svg width="10.51" height="15.76" viewBox="0 0 11 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5 0L10 5H1L5.5 0Z" fill="rgba(54, 54, 54, 0.5)" />
                    <path d="M5.5 16L1 11H10L5.5 16Z" fill="rgba(54, 54, 54, 0.5)" />
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
              {loading ? (
                <div className="table-row" style={{ justifyContent: "center" }}>
                  <div>Loading courts data...</div>
                </div>
              ) : authError ? (
                <div className="table-row" style={{ justifyContent: "center" }}>
                  <div>{authError}</div>
                </div>
              ) : courts.length > 0 ? (
                filteredCourts.map((court) => (
                  <div className="table-row" key={court.id}>
                    <div className="court-info">
                      {/* Removed the image completely */}
                      <span className="court-name">{court.name}</span>
                    </div>
                    <div className="court-type">{court.type}</div>
                    <div className="court-hours">
                      {court.status === "Available" && court.timeslots.length > 0 ? (
                        <div className="space-y-1">
                          {[
                            ...new Set(
                              court.timeslots.map((slot) => {
                                // Format timestamps to extract only time
                                const formatTime = (timestamp) => {
                                  if (!timestamp) return ""
                                  // If timestamp is a Firestore Timestamp object
                                  if (timestamp.toDate) {
                                    const date = timestamp.toDate()
                                    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                  }
                                  // If timestamp is already a Date object or string
                                  const date = new Date(timestamp)
                                  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                }

                                return `${formatTime(slot.time_start)} - ${formatTime(slot.time_end)}`
                              }),
                            ),
                          ].map((timeRange, index) => (
                            <div key={index} className="time-slot">
                              {timeRange}
                            </div>
                          ))}
                        </div>
                      ) : (
                        "No available hours"
                      )}
                    </div>
                    <div className="court-capacity">{court.capacity}</div>
                    <div className="court-booking-slots">{court.bookingSlots}</div>
                    <div className={`court-status ${court.status?.toLowerCase()}`}>{court.status}</div>
                    <div className="court-action">
                      <button className="action-button" onClick={() => handleViewDetails(court)}>
                        Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="table-row" style={{ justifyContent: "center" }}>
                  <div>
                    {currentUser
                      ? "No courts found for your account. Add a court to get started."
                      : "Please sign in to view your courts."}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="paginationkr">
            <div className="pagination-textkr">Showing all {filteredCourts.length} entries</div>
          </div>
        </div>

        {selectedCourt && (
          <CourtDetailsModal court={selectedCourt} onClose={handleCloseDetails} onSave={handleSaveStatus} />
        )}
      </div>
    </>
  )
}

export default CourtManagement