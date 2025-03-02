/*import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const courts = [
  { name: 'Alpha Court TH', type: 'Football', hours: '13:00 - 23:00', capacity: 10, slots: 'Hourly', status: 'Available' },
  { name: 'Beta Court TH', type: 'Basketball', hours: '09:00 - 18:00', capacity: 7, slots: 'Hourly', status: 'Available' },
  { name: 'Gamma Court TH', type: 'Swim', hours: '15:00 - 20:00', capacity: 25, slots: '30 minutes', status: 'Available' },
  { name: 'Lion Singto', type: 'Badminton', hours: '17:30 - 23:30', capacity: 12, slots: 'Hourly', status: 'Available' },
  { name: 'Football Club', type: 'Yoga', hours: '08:00 - 18:00', capacity: 5, slots: 'Hourly', status: 'Unavailable' }
];

const FieldManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  const handleAddCourtClick = () => setShowForm(true);
  const handleCancel = () => setShowForm(false);

  return (
    <div>
      <div className="bg-gray-100 p-4 flex justify-between">
        <div className="flex space-x-4">
          <a href="/refund-request" className="text-black">Refund Request</a>
          <a href="#" className="text-black">Dashboard</a>
          <a href="#" className="text-green-500">Field Management</a>
          <a href="#" className="text-black">Profile</a>
        </div>
        <Button className="bg-green-500 text-white" onClick={handleAddCourtClick}>Add Court</Button>
      </div>
      <div className="p-4">
        <h1 className="text-2xl font-bold">Court Connect</h1>
        {showForm ? (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="text-lg font-semibold">Field Information</h2>
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Field</option>
                  {courts.map((court, index) => (
                    <option key={index} value={court.name}>{court.name}</option>
                  ))}
                </select>
                <textarea placeholder="Address" className="w-full p-2 border rounded mt-2" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Court Information</h2>
                <input type="text" placeholder="Court Type" className="w-full p-2 border rounded" />
                <input type="number" placeholder="Capacity (people)" className="w-full p-2 border rounded mt-2" />
                <input type="text" placeholder="Available Hours" className="w-full p-2 border rounded mt-2" />
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              <Button className="bg-gray-200" onClick={handleCancel}>Cancel</Button>
              <Button className="bg-green-500 text-white">Add Court</Button>
            </div>
          </div>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="text-left p-2">Field</th>
                <th className="text-left p-2">Court Type</th>
                <th className="text-left p-2">Available Hours</th>
                <th className="text-left p-2">Capacity</th>
                <th className="text-left p-2">Booking Slots</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {courts.map((court, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">{court.name}</td>
                  <td className="p-2">{court.type}</td>
                  <td className="p-2">{court.hours}</td>
                  <td className="p-2">{court.capacity}</td>
                  <td className="p-2">{court.slots}</td>
                  <td className={`p-2 ${court.status === 'Available' ? 'text-green-500' : 'text-red-500'}`}>{court.status}</td>
                  <td className="p-2">
                    <Button className="bg-gray-200">Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FieldManagement;
*/