// Configuración inteligente de la API
// Detecta si estamos en Docker o desarrollo local
const getApiBaseUrl = () => {
  // Si hay variable de entorno específica, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Si estamos accediendo desde localhost (desarrollo local)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3002';
  }
  
  // Si estamos en Docker, usar el nombre del servicio
  return 'http://backend:3002';
};

const API_BASE_URL = getApiBaseUrl();

// Log para debug
console.log('API_BASE_URL:', API_BASE_URL);
console.log('Environment:', import.meta.env.NODE_ENV);
console.log('Hostname:', window.location.hostname);

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  
  // Client endpoints
  CLIENTS: `${API_BASE_URL}/api/clients`,
  CLIENT_BY_ID: (id) => `${API_BASE_URL}/api/clients/${id}`,
  
  // Service endpoints
  SERVICES: `${API_BASE_URL}/api/services`,
  SERVICE_BY_ID: (id) => `${API_BASE_URL}/api/services/${id}`,
  
  // Invoice endpoints
  INVOICES: `${API_BASE_URL}/api/invoices`,
  INVOICE_BY_ID: (id) => `${API_BASE_URL}/api/invoices/${id}`,
  INVOICE_STATUS: (id) => `${API_BASE_URL}/api/invoices/${id}/status`,
  INVOICE_PDF: (id) => `${API_BASE_URL}/api/invoices/${id}/pdf`,
  INVOICE_VIEW: (id) => `${API_BASE_URL}/api/invoices/${id}/view`,
  INVOICE_STATS: `${API_BASE_URL}/api/invoices/stats/overview`,
  
  // Dashboard endpoints
  DASHBOARD: `${API_BASE_URL}/api/dashboard`,
  DASHBOARD_CLIENT_STATS: `${API_BASE_URL}/api/dashboard/client-stats`,
  DASHBOARD_SERVICE_STATS: `${API_BASE_URL}/api/dashboard/service-stats`,
  DASHBOARD_REVENUE: `${API_BASE_URL}/api/dashboard/revenue-by-period`,
  
  // Test endpoint
  TEST: `${API_BASE_URL}/api/test`
};

export default API_BASE_URL;
