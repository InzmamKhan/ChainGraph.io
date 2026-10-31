const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  UPLOAD_FILE: `${BACKEND_BASE_URL}/api/transactions/upload`,
  ANALYZE_MANUAL: `${BACKEND_BASE_URL}/api/transactions/manual`,
};
