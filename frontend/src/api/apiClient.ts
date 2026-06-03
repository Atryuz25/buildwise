import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: 'http://localhost:3005/api',
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.map(cb => cb(token));
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber(() => {
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post('http://localhost:3005/api/auth/refresh', {}, { withCredentials: true });
        isRefreshing = false;
        onRefreshed('Success');
        refreshSubscribers = [];
        return axiosInstance(originalRequest);
      } catch (err) {
        isRefreshing = false;
        refreshSubscribers = [];
        // Refresh token failed, redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  async get(endpoint: string) {
    const res = await axiosInstance.get(endpoint);
    return res.data;
  },

  async post(endpoint: string, data?: any) {
    const res = await axiosInstance.post(endpoint, data);
    return res.data;
  },

  async put(endpoint: string, data?: any) {
    const res = await axiosInstance.put(endpoint, data);
    return res.data;
  },

  async delete(endpoint: string) {
    const res = await axiosInstance.delete(endpoint);
    return res.data;
  },

  async patch(endpoint: string, data?: any) {
    const res = await axiosInstance.patch(endpoint, data);
    return res.data;
  }
};
