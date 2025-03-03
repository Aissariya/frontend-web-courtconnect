import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from '../../firebaseConfig';
import { ChevronDown, ChevronLeft, X } from "lucide-react";
import "./RefundRequest.css";

const RefundRequest = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Refund"));
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRefunds(data);
      } catch (error) {
        console.error("Error fetching refunds:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = (refund) => {
    setSelectedRefund(refund);
    setRejectionReason("");
  };

  const closeModal = () => {
    setSelectedRefund(null);
  };

  const formatCurrency = (amount) => {
    return `฿${amount ? amount.toFixed(2) : "0.00"}`;
  };

  return (
    <div className="container">
      <div className="refund-header">
        <div className="refund-title">
          <ChevronLeft className="back-icon" />
          <span>Refund Request</span>
        </div>
        <div className="status-dropdown">
          <select className="status-button">
            <option>Status</option>
            <option>Need Action</option>
            <option>Accepted</option>
            <option>Rejected</option>
          </select>
          <ChevronDown className="dropdown-icon" />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : refunds.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Datetime</th>
              <th>Reason</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((item) => (
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
        <div className="data-info">Showing {refunds.length} requests</div>
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
              
              <div className="info-row">
                <div className="label">Date</div>
                <div className="value">{selectedRefund.Date || "N/A"}</div>
              </div>
              
              <div className="divider"></div>
              
              <div className="info-row">
                <div className="label">Time</div>
                <div className="value">{selectedRefund.Time || "N/A"}</div>
              </div>
              
              <div className="divider"></div>
              
              <div className="info-row">
                <div className="label">Reason</div>
                <div className="value">{selectedRefund.reason || "N/A"}</div>
              </div>
              
              <div className="refund-amount">
                <div className="label">Refund Amount</div>
                <div className="value">{formatCurrency(selectedRefund.amount || 0)}</div>
              </div>
            </div>
            
            <div className="rejection-section">
              <div className="rejection-label">Reason for Rejecting a Request</div>
              <select 
                className="dropdown-reason" 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)}
              >
                <option value="">Please select a reason</option>
                <option value="cancellation_policy_violation">Cancellation Policy Violation</option>
                <option value="non_refundable_deposit">Non-Refundable Deposit</option>
                <option value="last_minute_cancellation">Last-Minute Cancellation</option>
              </select>
            </div>
            
            <div className="modal-footer">
              <button className="reject-button">Reject</button>
              <button className="accept-button">Accept</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundRequest;
