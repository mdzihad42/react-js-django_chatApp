import axios from 'axios';

// Define the Base URL here so we can import it in other components
export const BASE_URL = 'https://chatapp.crsyndicate.info';

const api = axios.create({
  baseURL: `${BASE_URL}/api/`,
});

// Add a request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
