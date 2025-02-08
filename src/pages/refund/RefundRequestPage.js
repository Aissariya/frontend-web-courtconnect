import React, { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import "./RefundRequest.css";

const RefundRequest = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const mockData = [
    {
      id: 1,
      name: "Phillip Vetrovs",
      datetime: "2024-12-31 14:59:41",
      reason: "Made a mistake in booking",
      amount: 500.0,
      status: "Need Action",
    },
    {
      id: 2,
      name: "Jocelyn Donin",
      datetime: "2024-12-31 14:59:41",
      reason: "Change of plans",
      amount: 280.0,
      status: "Accepted",
    },
    {
      id: 3,
      name: "Cooper Gouse",
      datetime: "2024-12-31 14:59:41",
      reason: "Personal reasons",
      amount: 200.0,
      status: "Rejected",
    },
    {
      id: 4,
      name: "Dulce Baptista",
      datetime: "2024-12-31 14:59:41",
      reason: "Health issues",
      amount: 550.0,
      status: "Accepted",
    },
    {
      id: 5,
      name: "Brandon Saris",
      datetime: "2024-12-31 14:59:41",
      reason: "Transportation issues",
      amount: 390.0,
      status: "Accepted",
    },
    {
      id: 6,
      name: "Phillip Vetrovs",
      datetime: "2024-12-31 14:59:41",
      reason: "Weather concerns",
      amount: 120.0,
      status: "Accepted",
    },
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case "Need Action":
        return "status status-need-action";
      case "Accepted":
        return "status status-accepted";
      case "Rejected":
        return "status status-rejected";
      default:
        return "status";
    }
  };

  return (
    <div className="container">
      <div className="refund-header">
        <div className="refund-title">
          <div className="icon-black">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" fill="currentColor" />
              <path d="M12 6v12M6 12h12" stroke="white" />
            </svg>
          </div>
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

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>
              <div className="datetime-header">
                Datetime <ChevronDown />
              </div>
            </th>
            <th>Reason</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {mockData.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="user-info">
                  <div className="avatar"></div>
                  {item.name}
                </div>
              </td>
              <td>{item.datetime}</td>
              <td>{item.reason}</td>
              <td>฿{item.amount.toFixed(2)}</td>
              <td>
                <span className={getStatusClass(item.status)}>
                  {item.status}
                </span>
              </td>
              <td>
                <button className="details-button">Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="table-footer">
        <div className="data-info">Showing 6 from 150 data</div>
        <div className="pagination">
          <button className="pagination-arrow">
            <ChevronLeft />
          </button>
          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              className={`pagination-number ${
                currentPage === page ? "active" : ""
              }`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button className="pagination-arrow">
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundRequest;
