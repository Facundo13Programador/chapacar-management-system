// src/services/budgets.service.js
import http from './http';

export const listBudgets = async () => {
  const { data } = await http.get('/api/budgets');
  return data;
};

export const getBudget = async (id) => {
  const { data } = await http.get(`/api/budgets/${id}`);
  return data;
};

export const updateBudget = async (id, payload) => {
  const { data } = await http.put(`/api/budgets/${id}`, payload);
  return data;
};

export const sendBudgetToClient = async (id, payload) => {
  const { data } = await http.post(`/api/budgets/${id}/send`, payload);
  return data;
};

export const getBudgetPdf = async (id) => {
  const response = await http.get(`/api/budgets/${id}/pdf`, {
    responseType: 'blob',
  });
  return response.data; 
};

export const createBudgetFromReservation = async (payload) => {
  const { data } = await http.post('/api/budgets', payload);
  return data;
};
