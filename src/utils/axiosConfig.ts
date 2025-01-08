// src/utils/axiosConfig.ts or similar
import axios from 'axios';

axios.interceptors.request.use(
  (config) => {
    console.log('Axios interceptor config:', {
      url: config.url,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;