import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from '../../firebaseConfig';
import { ChevronDown, ChevronLeft, X, ArrowUp, ArrowDown } from "lucide-react"; // Import ไอคอนเพิ่มเติม
import "./RefundRequest.css";
import { onSnapshot } from "firebase/firestore";


const RefundRequest = () => {
  const [error, setError] = useState("");
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejected, setIsRejected] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // State สำหรับการจัดเรียงวันที่

  useEffect(() => {
    // Subscribe to Firestore collection in real-time
    const unsubscribe = onSnapshot(
      collection(db, "Refund"),
      (snapshot) => {
        const refundData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRefunds(refundData);
        setLoading(false);
      },
      (err) => {
        setError("Error loading data. Please try again later.");
        console.error("Firebase Error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  if (loading) return <p>Loading data...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const openModal = (refund) => {
    setSelectedRefund(refund);
    setRejectionReason(refund.rejectionReason || "");
    setIsRejected(refund.status === "Rejected");
    setIsAccepted(refund.status === "Accepted");
  };

  const closeModal = () => {
    setSelectedRefund(null);
    setIsRejected(false);
    setIsAccepted(false);
  };

  const formatCurrency = (amount) => {
    return `฿${amount ? amount.toFixed(2) : "0.00"}`;
  };

  const handleAccept = async () => {
    if (selectedRefund) {
      const refundRef = doc(db, "Refund", selectedRefund.id);
      await updateDoc(refundRef, { 
        status: "Accepted", 
        rejectionReason: null // Set rejectionReason to null when accepting
      });
      setRefunds((prevRefunds) => prevRefunds.map((refund) =>
        refund.id === selectedRefund.id 
          ? { 
              ...refund, 
              status: "Accepted", 
              rejectionReason: null // Also update the local state
            } 
          : refund
      ));
      setIsAccepted(true);
      setRejectionReason(""); // Reset rejection reason in local state
      closeModal();
    }
  };

  const handleReject = async () => {
    if (selectedRefund && rejectionReason) {
      const refundRef = doc(db, "Refund", selectedRefund.id);
      await updateDoc(refundRef, { status: "Rejected", rejectionReason: rejectionReason });
      setRefunds((prevRefunds) => prevRefunds.map((refund) =>
        refund.id === selectedRefund.id ? { ...refund, status: "Rejected", rejectionReason: rejectionReason } : refund
      ));
      setIsRejected(true);
      closeModal();
    } else {
      alert("Please select a reason before rejecting.");
    }
  };

  // ฟังก์ชันสำหรับกรอง refund ตามสถานะ
  const filteredRefunds = statusFilter ? refunds.filter(refund => refund.status === statusFilter) : refunds;

  // ฟังก์ชันสำหรับจัดเรียง refund ตามวันที่
  const sortedRefunds = [...filteredRefunds].sort((a, b) => {
    const dateA = new Date(a.datetime);
    const dateB = new Date(b.datetime);
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  // ฟังก์ชันสลับการจัดเรียง
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

        <div className="status-dropdown">
          <select className="status-button" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Need Action">Need Action</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
          <ChevronDown className="dropdown-icon" />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : sortedRefunds.length > 0 ? (
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
                <td>{item.name || "N/A"}</td>
                <td>{item.datetime || "N/A"}</td>
                <td>{item.reason || "No reason provided"}</td>
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
      )}

      <div className="table-footer">
        <div className="data-info">Showing {sortedRefunds.length} requests</div>
      </div>

      {selectedRefund && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Refund Request Details</h3>
              <X className="close-icon" onClick={closeModal} />
            </div>

            <div className="user-info">
              <div className="avatar"></div>
              <span>{selectedRefund.name || "N/A"}</span>
              <span className="date-time">{selectedRefund.datetime || "N/A"}</span>
            </div>

            <div className="modal-body">
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
                <div className="value">{selectedRefund.reason || "N/A"}</div>
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

            <div className="modal-footer">
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
