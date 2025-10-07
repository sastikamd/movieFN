import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ bookingData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!bookingData) return <p>Loading booking data...</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Create payment intent
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/payments/create-payment-intent`,
        { amount: bookingData.amount }, // Use bookingData.amount (consistent)
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const clientSecret = data.clientSecret;

      // Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: bookingData.userName || 'Customer',
            email: bookingData.userEmail || 'customer@example.com',
          },
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Save booking in backend with authorization
        await axios.post(
          `${import.meta.env.VITE_API_URL}/bookings`,
          {
            paymentIntentId: paymentIntent.id,
            movieId: bookingData.movieId,
            seats: bookingData.seats,
            showDate: bookingData.showDate,
            showTime: bookingData.showTime,
            theater: bookingData.theater,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Redirect after booking saved
        navigate('/booking-confirmation');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment or booking failed');
    }

    setLoading(false);
  };

  return (
      <form onSubmit={handleSubmit}>
        <div className="stripe-container">

          <CardElement
  options={{
    style: {
      base: {
        fontSize: '16px',
        color: '#32325d',
        letterSpacing: '0.025em',
        fontFamily: 'Arial, sans-serif',
        '::placeholder': {
          color: '#a0aec0',
        },
        padding: '10px 14px',
        boxSizing: 'border-box',
      },
      invalid: {
        color: '#fa755a',
      },
    }
  }}
/>

          </div>

          <button disabled={loading || !stripe}>
              {loading ? 'Processing...' : `Pay ₹${bookingData.amount}`}
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
  );
};

const PaymentPage = () => {
  const location = useLocation();
  const bookingData = location.state;
  console.log('Booking data received:', bookingData);

  if (!bookingData) {
    return <p>Missing booking data. Please go back to select seats.</p>;
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm bookingData={bookingData} />
    </Elements>
  );
};

export default PaymentPage;
