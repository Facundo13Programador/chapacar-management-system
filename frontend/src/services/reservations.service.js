// src/services/reservations.service.js
import http from './http';

// Crea una reserva (cliente)
export const createReservation = async (payload) => {
  const { data } = await http.post('/api/reservations', payload);
  return data;
};

// Trae las reservas del usuario logueado
export const getMyReservations = async () => {
  const { data } = await http.get('/api/reservations/mine');
  return data;
};

// Cancela una reserva del usuario
export const cancelMyReservation = async (id) => {
  const { data } = await http.patch(`/api/reservations/${id}/cancel`);
  return data;
};


// ADMIN / JEFE DE TALLER

// Traer TODAS las reservas
export const getAllReservations = async () => {
  const { data } = await http.get('/api/reservations');
  return data;
};

// Cambiar estado de una reserva
export const updateReservationStatus = async (id, status) => {
  const { data } = await http.patch(`/api/reservations/${id}/status`, {
    status,
  });
  return data;
};

export const listReservationsForBudget = async () => {
  const { data } = await http.get('/api/reservations/for-budget');
  return data;
};
