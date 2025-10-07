import React from 'react';
import { useNavigate } from 'react-router-dom';

const BookingConfirmation = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Booking Successful</h1>
      <p>Your booking has been recorded successfully.</p>
      <button onClick={() => navigate('/profile')}>Go to My Bookings</button>
    </div>
  );
};

export default BookingConfirmation;




// import React, { useEffect, useState } from 'react';
// import { useSearchParams, Link } from 'react-router-dom';
// import axios from 'axios';

// const BookingConfirmation = () => {
//   const [searchParams] = useSearchParams();
//   const paymentIntentId = searchParams.get('payment_intent');
//   const [booking, setBooking] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!paymentIntentId) {
//       setLoading(false);
//       return;
//     }

//     axios.get(`/api/bookings/by-payment-intent/${paymentIntentId}`)
//       .then(res => {
//         if(res.data.success) {
//           setBooking(res.data.data);
//         }
//       })
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, [paymentIntentId]);

//   if (loading) return <div>Loading booking details...</div>;
//   if (!booking) return (
//     <div>
//       <h2>Booking not found</h2>
//       <Link to="/movies">Back to Movies</Link>
//     </div>
//   );

//   return (
//     <div>
//       <h1>Booking Confirmed</h1>
//       <p>Movie: {booking.movieTitle}</p>
//       <p>Date: {booking.showDate}</p>
//       <p>Time: {booking.showTime}</p>
//       <p>Seats: {booking.seats.map(s => s.seatNumber).join(', ')}</p>
//       <p>Total Paid: ₹{booking.totalAmount}</p>
//     </div>
//   );
// };

// export default BookingConfirmation;