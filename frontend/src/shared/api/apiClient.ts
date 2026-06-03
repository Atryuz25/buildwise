import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:3005/api', // Backend local port
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  projects: {
    getAll: () => apiClient.get('/projects').then(res => res.data),
    create: (data: any) => apiClient.post('/projects', data).then(res => res.data),
  },
  materials: {
    getInventory: (projectId: string) => apiClient.get(`/materials/project/${projectId}`).then(res => res.data),
    logDelivery: (id: string, amount: number, invoiceRef: string) => apiClient.post(`/materials/${id}/delivery`, { amount, invoiceRef }).then(res => res.data),
  },
  analytics: {
    getSummary: (projectId: string) => apiClient.get(`/analytics/project/${projectId}/summary`).then(res => res.data),
  },
  steel: {
    optimize: (data: any) => 
      apiClient.post('/estimates/steel', data).then(res => res.data),
  }
};
