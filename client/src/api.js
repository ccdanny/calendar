import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const getRecords = (month) => api.get(`/records?month=${month}`);
export const saveRecord = (data) => api.post('/records', data);
export const exportData = (year) => window.open(`/api/export?year=${year}`, '_blank');
