import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ clientSecret, bookingData, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);

    const handleSubmit = async (event) => {
  event.preventDefault();
  if (!stripe || !elements || !clientSecret) return;

  setProcessing(true);
  setMessage(null);

  try {
    // Confirm payment without redirect
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // prevents redirect unless absolutely needed
    });

    if (result.error) {
      console.error('Stripe confirm error:', result.error);
      setMessage(result.error.message || 'Payment error');
      setProcessing(false);
      return;
    }

    const paymentIntent = result.paymentIntent;
    console.log('Stripe paymentIntent:', paymentIntent);

    if (!paymentIntent) {
      setMessage('No payment intent returned.');
      setProcessing(false);
      return;
    }

    // Check if payment succeeded immediately
    if (paymentIntent.status === 'succeeded') {
      // Call your backend API to save the booking with this paymentIntentId
      const bookingPayload = {
        ...bookingData,
        paymentIntentId: paymentIntent.id,
      };
      console.log('Booking payload:', bookingPayload);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/bookings`,
        bookingPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Booking API response:', response.data);

      // Navigate after booking is successfully saved
      onSuccess();

    } else {
      // When payment is in a pending state or needs additional actions
      setMessage('Payment is processing or requires additional steps.');
      setProcessing(false);
    }
  } catch (err) {
    console.error('Error during payment confirmation or booking:', err);
    setMessage('An unexpected error occurred.');
    setProcessing(false);
  }
};




  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {message && <p className="text-red-600">{message}</p>}
      <button disabled={processing || !stripe} className="btn btn-primary mt-4">
        {processing ? 'Processing...' : `Pay ₹${bookingData.amount}`}
      </button>
    </form>
  );
};

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state;

  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingData || !bookingData.amount) {
      navigate('/movies');
      return;
    }

    async function createPaymentIntent() {
      const token = localStorage.getItem('token');
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/payments/create-payment-intent`,
          { amount: bookingData.amount },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setClientSecret(data.clientSecret);
        setLoading(false);
      } catch (err) {
        console.error('Error creating payment intent', err);
        setLoading(false);
      }
    }

    createPaymentIntent();
  }, [bookingData, navigate]);

  if (loading) return <p>Loading payment form...</p>;

  const onSuccess = () => {
    navigate('/booking-confirmation');
  };

  return (
    <div className="payment-page max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="mb-4 text-xl font-bold">Complete Your Payment</h2>

      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm clientSecret={clientSecret} bookingData={bookingData} onSuccess={onSuccess} />
      </Elements>
    </div>
  );
};

export default PaymentPage;
