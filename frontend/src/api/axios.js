import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://full-stack-assignment-xfkz.onrender.com',
  withCredentials: true // This is crucial for sending cookies cross-origin
});

export default api;
