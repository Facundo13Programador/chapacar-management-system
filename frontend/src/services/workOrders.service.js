// src/services/workOrders.service.js
import http from './http';

// Lista de órdenes de trabajo
export const listWorkOrders = async () => {
  const { data } = await http.get('/api/work-orders');
  return data;
};

// Detalle de una OT
export const getWorkOrder = async (id) => {
  const { data } = await http.get(`/api/work-orders/${id}`);
  return data;
};

// Actualizar OT 
export const updateWorkOrder = async (id, payload) => {
  const { data } = await http.put(`/api/work-orders/${id}`, payload);
  return data;
};

export const createWorkOrderFromBudget = async (budgetId, payload) => {
  const { data } = await http.post(`/api/budgets/${budgetId}/work-order`, payload);
  return data;
};
