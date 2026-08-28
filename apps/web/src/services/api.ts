const RAW_API_URL = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/+$/, '')}/api` : '/api';

export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('villagio_token') || localStorage.getItem('villagio_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  unread_count?: number;
  totals?: {
    pending_total: number;
    completed_total: number;
    total_count: number;
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    return {
      success: false,
      error: err.message || 'Network error. Please check backend connection.',
    };
  }
}

export const api = {
  // Auth
  register: (farmerData: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(farmerData) }),
  login: (phone: string, pin: string) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ phone, pin }) }),
  adminLogin: (username: string, pin: string) => request<any>('/auth/admin/login', { method: 'POST', body: JSON.stringify({ username, pin }) }),
  getMe: () => request<any>('/auth/me'),

  // Products
  getProducts: () => request<any>('/products'),

  // Produce
  submitProduce: (produceData: any) => request<any>('/produce', { method: 'POST', body: JSON.stringify(produceData) }),
  getFarmerProduce: (farmerId: number) => request<any>(`/produce/farmer/${farmerId}`),
  getAllProduce: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/produce${query}`);
  },

  // Collections
  getCollections: () => request<any>('/collections'),
  getCollectionById: (id: number) => request<any>(`/collections/${id}`),
  updateCollection: (id: number, updateData: any) => request<any>(`/collections/${id}`, { method: 'PUT', body: JSON.stringify(updateData) }),

  // Payments
  getFarmerPayments: (farmerId: number) => request<any>(`/payments/farmer/${farmerId}`),
  processPayment: (id: number) => request<any>(`/payments/${id}/process`, { method: 'PUT' }),

  // Notifications
  getFarmerNotifications: (farmerId: number) => request<any>(`/notifications/farmer/${farmerId}`),
  markNotificationRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: (farmerId: number) => request<any>(`/notifications/farmer/${farmerId}/read-all`, { method: 'PUT' }),

  // Farmer Profile
  getFarmerProfile: (id: number) => request<any>(`/farmers/${id}`),
  updateFarmerProfile: (id: number, data: any) => request<any>(`/farmers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Support
  submitSupportRequest: (data: { issue_type: string; description: string }) => request<any>('/support', { method: 'POST', body: JSON.stringify(data) }),

  // Admin APIs
  getAdminDashboard: () => request<any>('/admin/dashboard'),
  getAdminFarmers: (search?: string) => request<any>(`/admin/farmers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getAdminExceptions: () => request<any>('/admin/exceptions'),
  createException: (data: any) => request<any>('/admin/exceptions', { method: 'POST', body: JSON.stringify(data) }),
  updateException: (id: number, data: any) => request<any>(`/admin/exceptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getAdminLogistics: () => request<any>('/admin/logistics'),
  ftmaAcceptCollection: (collectionId: string) => request<any>(`/admin/logistics/ftma-accept/${collectionId}`, { method: 'POST' }),
  getAuditLogs: () => request<any>('/admin/audit-logs'),
  getSmsLogs: () => request<any>('/integrations/sms/log'),

  // Sourcing & Demand
  getSourcingSummary: () => request<any>('/sourcing/summary'),
  generateCollectionBatch: (productId?: number, locationFilter?: string) =>
    request<any>('/sourcing/generate-collection', { method: 'POST', body: JSON.stringify({ product_id: productId, location_filter: locationFilter }) }),
  getDemandSummary: () => request<any>('/sourcing/demand'),

  // USSD & IVR Simulators
  sendUssdJson: (sessionId: string, phoneNumber: string, text: string) =>
    request<any>('/integrations/ussd/json', { method: 'POST', body: JSON.stringify({ sessionId, phoneNumber, text }) }),
  sendIvrJson: (sessionId: string, phoneNumber: string, dtmfDigits: string) =>
    request<any>('/integrations/ivr', { method: 'POST', body: JSON.stringify({ sessionId, phoneNumber, dtmfDigits }) }),
};
