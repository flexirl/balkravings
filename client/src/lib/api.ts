import axios from 'axios';
import supabase from './supabase';

// This API client is ONLY used for Express backend endpoints that still need server-side logic:
// - /api/payment (Razorpay)
// - /api/coupons/apply (coupon validation)
// - /api/orders (order creation with server-side total calc)

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Supabase auth token to Express requests
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
