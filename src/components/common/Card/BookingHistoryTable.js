import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card/Card';
import './BookingHistoryTable.css';

const BookingHistoryTable = () => {
  // Sample data - replace with actual data
  const bookings = [
    { id: 1, name: 'Philip Virtous', date: '2024-12-31', time: '18:00-20:00', field: 'Alpha', courtType: 'Football', status: 'Successful' },
    { id: 2, name: 'Brandon Saris', date: '2024-12-30', time: '19:30-21:30', field: 'Alpha', courtType: 'Basketball', status: 'Successful' },
    { id: 3, name: 'Cooper Goose', date: '2024-12-30', time: '14:00-15:00', field: 'Beta', courtType: 'Swim', status: 'Cancelled' },
    { id: 4, name: 'Jocelyn Dorin', date: '2024-12-29', time: '17:30-20:30', field: 'Gamma', courtType: 'Badminton', status: 'Successful' },
    { id: 5, name: 'Dulce Baptiste', date: '2024-12-29', time: '18:00-17:30', field: 'Gamma', courtType: 'Yoga', status: 'Successful' },
  ];

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'successful':
        return 'status-successful';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="booking-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Field</th>
                <th>Court Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.name}</td>
                  <td>{booking.date}</td>
                  <td>{booking.time}</td>
                  <td>{booking.field}</td>
                  <td>{booking.courtType}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="pagination">
          <div className="pagination-info">
            Showing 5 from 100 data
          </div>
          <div className="pagination-buttons">
            <button className="pagination-button active">1</button>
            <button className="pagination-button">2</button>
            <button className="pagination-button">3</button>
            <button className="pagination-button">4</button>
            <button className="pagination-button">5</button>
            <button className="pagination-button">→</button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingHistoryTable;