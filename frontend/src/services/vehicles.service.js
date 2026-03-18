// src/services/vehicles.service.js
import http from './http';

export const listMyVehicles = async () => {
  const { data } = await http.get('/api/vehicles/my');
  return data;
};

export const createMyVehicle = async (payload) => {
  const { data } = await http.post('/api/vehicles/my', payload);
  return data;
};

export const updateMyVehicle = async (id, payload) => {
  const { data } = await http.put(`/api/vehicles/my/${id}`, payload);
  return data;
};

export const deleteMyVehicle = async (id) => {
  await http.delete(`/api/vehicles/my/${id}`);
};
