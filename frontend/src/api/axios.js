import axios from 'axios';

const API_PREFIX = '/api/v1';

const normalizeBaseURL = (value) => {
  const trimmed = (value || '').trim().replace(/\/+$/, '');

  if (!trimmed) {
    return API_PREFIX;
  }

  if (trimmed.endsWith('/api/v1')) {
    return trimmed;
  }

  if (trimmed.endsWith('/api')) {
    return `${trimmed}/v1`;
  }

  return `${trimmed}${API_PREFIX}`;
};

const configuredBaseURL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL;
const baseURL = normalizeBaseURL(configuredBaseURL);

const api = axios.create({
  baseURL,
  withCredentials: true
});

export default api;
