import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://intermetameric-codi-unexasperating.ngrok-free.dev/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('rider_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('rider_token');
      AsyncStorage.removeItem('rider_id');
      AsyncStorage.removeItem('rider_name');
      AsyncStorage.removeItem('rider_email');
    }

    return Promise.reject(error);
  }
);

export const deliveryApi = {
  login: async (email, password) => {
    const response = await api.post('/rider/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('rider_token', response.data.token);
      await AsyncStorage.setItem('rider_id', String(response.data.riderId));
      await AsyncStorage.setItem('rider_name', response.data.riderName || '');
      await AsyncStorage.setItem('rider_email', response.data.email || email);
    }
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['rider_token', 'rider_id', 'rider_name', 'rider_email']);
  },

  getAssignedOrders: async (riderId) => {
    const response = await api.get(`/rider/orders/${riderId}`);
    return response.data;
  },

  acceptOrder: async (orderId) => {
    const riderId = Number(await AsyncStorage.getItem('rider_id') || '0');
    const response = await api.post(`/rider/orders/${orderId}/accept`, { riderId });
    return response.data;
  },

  deliverOrder: async (orderId) => {
    const riderId = Number(await AsyncStorage.getItem('rider_id') || '0');
    const response = await api.post(`/rider/orders/${orderId}/deliver`, { riderId });
    return response.data;
  },

  sendLocation: async (riderId, latitude, longitude) => {
    const response = await api.post('/rider/location', {
      riderId,
      latitude,
      longitude,
    });
    return response.data;
  },

  getOrderDetails: async (orderId) => {
    const response = await api.get(`/rider/orders/${orderId}/details`);
    return response.data;
  },

  getAllOrders: async () => {
    const riderId = Number(await AsyncStorage.getItem('rider_id') || '0');
    const response = await api.get(`/rider/orders/${riderId}`);
    return response.data;
  },
};

export default api;
