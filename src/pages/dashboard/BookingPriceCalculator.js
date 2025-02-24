import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc
} from 'firebase/firestore';

const calculatePrice = (startTime, endTime, priceSlot, bookingSlot) => {
  // Convert time to milliseconds
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  
  // Calculate duration in bookingSlot units (minutes)
  const durationInMs = end - start;
  const durationInMinutes = durationInMs / (1000 * 60);
  const slots = Math.ceil(durationInMinutes / bookingSlot);
  
  // Calculate total price
  return slots * priceSlot;
};

const BookingPriceCalculator = ({ bookingId }) => {
  const [bookingData, setBookingData] = useState(null);
  const [courtData, setCourtData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        // Fetch booking data
        const bookingRef = doc(db, 'Booking', bookingId);
        const bookingSnap = await getDoc(bookingRef);
        
        if (!bookingSnap.exists()) {
          throw new Error('Booking not found');
        }
        
        const bookingData = bookingSnap.data();
        setBookingData(bookingData);
        
        // Fetch court data
        const courtRef = doc(db, 'Court', bookingData.court_id);
        const courtSnap = await getDoc(courtRef);
        
        if (!courtSnap.exists()) {
          throw new Error('Court not found');
        }
        
        const courtData = courtSnap.data();
        setCourtData(courtData);
        
        // Calculate price
        const price = calculatePrice(
          bookingData.start_time,
          bookingData.end_time,
          courtData.priceslot,
          courtData.bookingslot
        );
        
        setTotalPrice(price);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="booking-details">
      <h2>Booking Details</h2>
      {bookingData && courtData && (
        <>
          <div>
            <p>Booking ID: {bookingData.booking_id}</p>
            <p>Court: {courtData.field}</p>
            <p>Start Time: {new Date(bookingData.start_time).toLocaleString('en-US')}</p>
            <p>End Time: {new Date(bookingData.end_time).toLocaleString('en-US')}</p>
            <p>Price per Slot: ${courtData.priceslot}</p>
            <p>Time per Slot: {courtData.bookingslot} minutes</p>
            <p className="total-price">Total Price: ${totalPrice.toLocaleString()}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default BookingPriceCalculator;