// src/services/users.service.js
import http from './http';

const endpoint = '/api/users';

// Listar todos los usuarios (admin/taller)
export const listUsers = async () => {
  const { data } = await http.get(endpoint);
  return data;
};

// Obtener un usuario por id
export const getUser = async (id) => {
  const { data } = await http.get(`${endpoint}/${id}`);
  return data;
};

// Actualizar datos de un usuario (admin/taller)
export const updateUser = async (id, payload) => {
  const { data } = await http.put(`${endpoint}/${id}`, payload);
  return data;
};

// Usuario se postula como mecánico (envía solicitud)
export const requestMechanicRole = async () => {
  const { data } = await http.post(`${endpoint}/me/request-mechanic`);
  return data;
};

// Listar solicitudes de rol pendientes (para el jefe)
export const listRoleRequests = async () => {
  const { data } = await http.get(`${endpoint}/role-requests`);
  return data;
};

// Aprobar o rechazar una solicitud de rol
export const resolveRoleRequest = async (id, action) => {
  const { data } = await http.post(`${endpoint}/${id}/role-request`, { action });
  return data;
};

// Traer mi perfil (usuario logueado)
export const getMyProfile = async () => {
  const { data } = await http.get(`${endpoint}/me`);
  return data;
};

// Actualizar mi perfil (nombre, email, teléfono, etc.)
export const updateMyProfile = async (payload) => {
  const { data } = await http.put(`${endpoint}/me`, payload);
  return data;
};

// Cambiar mi contraseña
export const changeMyPassword = async (payload) => {
  const { data } = await http.put(`${endpoint}/me/password`, payload);
  return data;
};

// Subir/actualizar mi foto de perfil
export const uploadMyAvatar = async (formData) => {
  const { data } = await http.post(`${endpoint}/me/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// Cambiar solo el rol de un usuario (helper)
export const updateUserRole = async (id, role) => {
  return updateUser(id, { role });
};
