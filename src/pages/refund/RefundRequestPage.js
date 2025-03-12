import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, where, query, onSnapshot, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from '../../firebaseConfig';
import { ChevronDown, ChevronLeft, X, ArrowUp, ArrowDown } from "lucide-react";
import "./RefundRequest.css";

const RefundRequest = () => {
  const [error, setError] = useState("");
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejected, setIsRejected] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const auth = getAuth();

  const fetchRefundData = async (user) => {
    setLoading(true);
    setRefunds([]);
    
    try {
      if (!user) {
        console.log('No user provided');
        setError('No user logged in');
        setLoading(false);
        return;
      }

      console.log('Fetching refund data for user:', user.uid);
      
      // ดึงข้อมูล user_id จาก Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log('User document not found');
        setError('User not found');
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const userIdForQuery = userData.user_id;
      console.log('Using user_id for query:', userIdForQuery);

      // 1. ดึงข้อมูล Courts ทั้งหมดที่เป็นของ user นี้
      const courtsRef = collection(db, 'Court');
      const courtsQuery = query(courtsRef, where("user_id", "==", userIdForQuery));
      const courtsSnapshot = await getDocs(courtsQuery);
      
      // เก็บสนามที่เป็นของ user ปัจจุบัน
      const userCourtIds = [];
      const courtsMap = {};
      
      courtsSnapshot.forEach(doc => {
        const court = doc.data();
        courtsMap[court.court_id] = court;
        userCourtIds.push(court.court_id);
      });
      
      console.log('User owned courts:', userCourtIds.length, userCourtIds);
      
      if (userCourtIds.length === 0) {
        console.log('User does not own any courts');
        setRefunds([]);
        setLoading(false);
        return;
      }

      // 2. ติดตามการเปลี่ยนแปลงของ Refund collection
      const unsubscribe = onSnapshot(collection(db, "Refund"), async (snapshot) => {
        try {
          const refundData = await Promise.all(snapshot.docs.map(async (refundDoc) => {
            const refund = { id: refundDoc.id, ...refundDoc.data() };

            // 3. เช็คข้อมูล Booking ที่มี booking_id ตรงกับที่อยู่ใน Refund
            const bookingQuery = query(collection(db, "Booking"), where("booking_id", "==", refund.booking_id));
            const bookingSnapshot = await getDocs(bookingQuery);

            if (bookingSnapshot.empty) {
              console.log(`No matching booking found for booking_id: ${refund.booking_id}`);
              return null; // ไม่พบข้อมูล Booking ที่ตรงกัน
            }

            const bookingData = bookingSnapshot.docs[0].data();
            
            // 4. เช็คว่า Booking นั้นเกี่ยวข้องกับ Court ที่ user เป็นเจ้าของหรือไม่
            if (!bookingData.court_id) {
              console.log(`Booking doesn't have court_id: ${refund.booking_id}`);
              return null; // ไม่มี court_id ในข้อมูล Booking
            }
            
            if (!userCourtIds.includes(bookingData.court_id)) {
              console.log(`Court ID ${bookingData.court_id} is not owned by this user`);
              return null; // Court ไม่ได้เป็นของ user ที่ login
            }
            
            const courtData = courtsMap[bookingData.court_id];
            
            // ดึงข้อมูลและฟอร์แมตตามต้องการ
            refund.Court = courtData.court_type || "N/A";
            refund.Field = courtData.field || "N/A";

            // ฟอร์แมตวันที่และเวลา
            if (bookingData.start_time && bookingData.end_time) {
              const startDate = new Date(bookingData.start_time.seconds * 1000);
              const endDate = new Date(bookingData.end_time.seconds * 1000);

              // ฟอร์แมตวันที่
              refund.Date = startDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              // ฟอร์แมตเวลา
              const formatTime = (date) => {
                return date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
              };

              refund.Time = `${formatTime(startDate)} - ${formatTime(endDate)}`;

              // คำนวณจำนวนเงิน
              if (courtData.bookingslot && courtData.priceslot) {
                const startTime = startDate.getTime();
                const endTime = endDate.getTime();
                const durationInMinutes = (endTime - startTime) / (1000 * 60);
                const slots = Math.ceil(durationInMinutes / courtData.bookingslot);
                refund.amount = slots * courtData.priceslot;
              } else {
                refund.amount = 0;
              }
            } else {
              refund.Date = "N/A";
              refund.Time = "N/A";
              refund.amount = 0;
            }

            // ดึงข้อมูลผู้ใช้ (user_id จาก Refund)
            const usersQuery = query(collection(db, "users"), where("user_id", "==", refund.user_id));
            const usersSnapshot = await getDocs(usersQuery);
            let userName = "N/A";
            let userProfileImage = "";

            if (!usersSnapshot.empty) {
              const userData = usersSnapshot.docs[0].data();
              userName = `${userData.name || ""} ${userData.surname || ""}`.trim();
              userProfileImage = userData.profileImage || "";
            }

            refund.user = {
              name: userName,
              profileImage: userProfileImage,
            };

            return refund;
          }));

          // กรองข้อมูล null ออก (กรณีที่ไม่พบข้อมูลที่ตรงตามเงื่อนไข)
          const filteredRefundData = refundData.filter(item => item !== null);
          
          console.log(`Found ${filteredRefundData.length} refund requests for user's courts`);
          setRefunds(filteredRefundData);
          setLoading(false);
        } catch (err) {
          setError("Error loading data. Please try again later.");
          console.error("Firebase Error:", err);
          setLoading(false);
        }
      }, (err) => {
        setError("Error loading data. Please try again later.");
        console.error("Firebase Error:", err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error in fetchRefundData:", error);
      setError("Failed to load refund data");
      setLoading(false);
    }
  };

  // ตรวจสอบการ login และเรียกใช้ fetchRefundData
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchRefundData(user);
      } else {
        setError('No user logged in');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // Format currency
  const formatCurrency = (amount) => {
    return `฿${amount ? amount.toFixed(2) : "0.00"}`;
  };

  // Format timestamp to display in a readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    
    // Handle Firebase timestamp (with seconds and nanoseconds)
    if (timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    
    // Handle JavaScript Date object
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    
    // If it's a string that looks like a date, try to parse it
    if (typeof timestamp === "string") {
      try {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        }
        return timestamp; // If it's not parseable, just return the string
      } catch (e) {
        return timestamp;
      }
    }
    
    return "N/A";
  };

  // Modal functions
  const openModal = (refund) => {
    setSelectedRefund(refund);
    setRejectionReason(refund.reason_reject || "");
    setIsRejected(refund.status === "Rejected");
    setIsAccepted(refund.status === "Accepted");
  };

  const closeModal = () => {
    setSelectedRefund(null);
    setIsRejected(false);
    setIsAccepted(false);
  };

  // Handle accept/reject actions
  const handleAccept = async () => {
    if (selectedRefund) {
      const refundRef = doc(db, "Refund", selectedRefund.id);
      await updateDoc(refundRef, {
        status: "Accepted",
        reason_reject: null
      });
      setRefunds((prevRefunds) => prevRefunds.map((refund) =>
        refund.id === selectedRefund.id
          ? {
            ...refund,
            status: "Accepted",
            reason_reject: null
          }
          : refund
      ));
      setIsAccepted(true);
      setRejectionReason("");
      closeModal();
    }
  };

  const handleReject = async () => {
    if (selectedRefund && rejectionReason) {
      const refundRef = doc(db, "Refund", selectedRefund.id);
      await updateDoc(refundRef, {
        status: "Rejected",
        reason_reject: rejectionReason
      });
      setRefunds((prevRefunds) => prevRefunds.map((refund) =>
        refund.id === selectedRefund.id
          ? {
            ...refund,
            status: "Rejected",
            reason_reject: rejectionReason
          }
          : refund
      ));
      setIsRejected(true);
      closeModal();
    } else {
      alert("Please select a reason before rejecting.");
    }
  };

  // Filter refunds by status
  const filteredRefunds = statusFilter ? refunds.filter(refund => refund.status === statusFilter) : refunds;

  // Sort refunds by date
  const sortedRefunds = [...filteredRefunds].sort((a, b) => {
    const dateA = a.datetime_refund && a.datetime_refund.seconds ? 
      new Date(a.datetime_refund.seconds * 1000) : 
      new Date(0);
    const dateB = b.datetime_refund && b.datetime_refund.seconds ? 
      new Date(b.datetime_refund.seconds * 1000) : 
      new Date(0);
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="container">
      <div className="refund-header">
        <div className="refund-title" onClick={() => setStatusFilter("")} style={{ cursor: "pointer" }}>
          <ChevronLeft className="back-icon" />
          <span>Refund Request</span>
        </div>

        {/* Status filter */}
        <div className="status-dropdown2">
          <select className="status-button2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Need Action">Need Action</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
          <ChevronDown className="dropdown-icon" />
        </div>
      </div>

      {/* Refund table */}
      {loading ? (
        <div className="loading">Loading...</div>
      ) :
        sortedRefunds.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>
                  Datetime
                  <button className="sort-button2" onClick={toggleSortOrder}>
                    {sortOrder === "asc" ? <ArrowUp className="sort-icon2" /> : <ArrowDown className="sort-icon2" />}
                  </button>
                </th>
                <th>Reason</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedRefunds.map((item) => (
                <tr key={item.id}>
                  <td>{item.user.name || "N/A"}</td>
                  <td>{formatTimestamp(item.datetime_refund)}</td>
                  <td>{item.reason_refund || "No reason provided"}</td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>
                    <span className={`status ${item.status ? `status-${item.status.toLowerCase().replace(" ", "-")}` : ""}`}>
                      {item.status || "Unknown"}
                    </span>
                  </td>
                  <td>
                    <button className="details-button" onClick={() => openModal(item)}>Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">No refund requests found</div>
        )
      }

      <div className="table-footer">
        <div className="data-info">Showing {sortedRefunds.length} requests</div>
      </div>

      {/* Details modal */}
      {selectedRefund && (
        <div className="modal-overlay2">
          <div className="modal-content2">
            <div className="modal-header2">
              <h3>Refund Request Details</h3>
              <X className="close-icon2" onClick={closeModal} />
            </div>

            <div className="user-info">
              <img className="avatar" src={selectedRefund.user.profileImage} alt="Profile" />
              <span>{selectedRefund.user.name || "N/A"}</span>
              <span className="date-time">{formatTimestamp(selectedRefund.datetime_refund)}</span>
            </div>

            <div className="modal-body2">
              <div className="info-row">
                <div className="label">Field</div>
                <div className="value">{selectedRefund.Field || "N/A"}</div>
              </div>

              <div className="divider"></div>

              <div className="info-row">
                <div className="label">Court</div>
                <div className="value">{selectedRefund.Court || "N/A"}</div>
              </div>

              <div className="divider"></div>

              <div className="date-time-wrapper">
                <div className="info-row">
                  <div className="label">Date</div>
                  <div className="value">{selectedRefund.Date || "N/A"}</div>
                </div>

                <div className="info-row">
                  <div className="label">Time</div>
                  <div className="value">{selectedRefund.Time || "N/A"}</div>
                </div>
              </div>

              <div className="divider"></div>

              <div className="info-row">
                <div className="label">Reason</div>
                <div className="value">{selectedRefund.reason_refund || "N/A"}</div>
              </div>

              <div className="divider"></div>

              <div className="refund-amount">
                <div className="label">Refund Amount</div>
                <div className="value">{formatCurrency(selectedRefund.amount || 0)}</div>
              </div>
            </div>

            <div className="rejection-section">
              <div className="rejection-label">Reason for Rejecting a Request</div>
              <select
                className="dropdown-reason"
                value={isAccepted ? "none" : rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={isRejected || isAccepted}
              >
                <option value="">Please select a reason</option>
                <option value="cancellation_policy_violation">Cancellation Policy Violation</option>
                <option value="non_refundable_deposit">Non-Refundable Deposit</option>
                <option value="last_minute_cancellation">Last-Minute Cancellation</option>
                <option value="damage_to_property">Damage to Property</option>
                <option value="violation_of_terms">Violation of Terms and Conditions</option>
                <option value="booking_already_fulfilled">Booking Already Fulfilled</option>
              </select>
            </div>

            <div className="modal-footer2">
              {!isAccepted && !isRejected && (
                <>
                  <button className="reject-button" onClick={handleReject}>Reject</button>
                  <button className="accept-button" onClick={handleAccept}>Accept</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundRequest;