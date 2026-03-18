// src/services/orders.service.js
import http from './http';

const endpoint = '/api/orders';

// POST /api/orders
export const createOrder = async (payload) => {
  const { data } = await http.post(endpoint, payload);
  return data;
};

// GET /api/orders/my
export const getMyOrders = async () => {
  const { data } = await http.get(`${endpoint}/my`);
  return data;
};

// GET /api/orders/:id
export const getOrder = async (id) => {
  const { data } = await http.get(`${endpoint}/${id}`);
  return data;
};

// Listado admin de órdenes
export const getAllOrders = async (params = {}) => {
  const { data } = await http.get(endpoint, { params });
  return data;
};

// Actualizar estado de la orden
export const updateOrderStatus = async (id, status) => {
  const { data } = await http.put(`${endpoint}/${id}/status`, { status });
  return data;
};
