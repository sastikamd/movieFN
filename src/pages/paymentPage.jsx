import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// 🎨 Appearance configuration
const appearance = {
  theme: 'flat',
  variables: {
    colorPrimary: '#0570de',
    colorBackground: '#ffffff',
    colorText: '#30313d',
    colorDanger: '#df1b41',
    fontFamily: 'Ideal Sans, system-ui, sans-serif',
    spacingUnit: '2px',
    borderRadius: '6px',
  },
  rules: {
    '.Input': {
      border: '1px solid #ccc',
      borderRadius: '6px',
      padding: '10px 14px',
      backgroundColor: '#fff',
    },
    '.Input--invalid': {
      borderColor: '#fa755a',
    },
    '.Input--complete': {
      borderColor: '#4caf50',
    },
  },
};

// 🧾 CheckoutForm component
const CheckoutForm = ({ clientSecret, bookingData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) return;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        payment_method_data: {
          billing_details: {
            name: bookingData.userName || 'Customer',
            email: bookingData.userEmail || 'customer@example.com',
          },
        },
      },
      redirect: 'if_required', // prevents auto redirect
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        const token = localStorage.getItem('token');
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
        navigate('/booking-confirmation');
      } catch (err) {
        setError('Booking save failed');
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-6 space-y-4">
      <PaymentElement />
      <button disabled={loading || !stripe} className="w-full py-2 bg-blue-600 text-white rounded-md">
        {loading ? 'Processing...' : `Pay ₹${bookingData.amount}`}
      </button>
      {error && <p className="text-red-500 text-center">{error}</p>}
    </form>
  );
};

// 💳 PaymentPage wrapper
const PaymentPage = () => {
  const location = useLocation();
  const bookingData = location.state;
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (!bookingData) return;

    const createPaymentIntent = async () => {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/payments/create-payment-intent`,
        { amount: bookingData.amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClientSecret(data.clientSecret);
    };

    createPaymentIntent();
  }, [bookingData]);

  if (!bookingData) return <p>Missing booking data. Please go back to select seats.</p>;
  if (!clientSecret) return <p>Setting up payment...</p>;

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm clientSecret={clientSecret} bookingData={bookingData} />
    </Elements>
  );
};

export default PaymentPage;
