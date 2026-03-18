// src/services/auth.service.js
import http from './http';
const STORAGE_KEY = 'authData'; 

// API calls

export const login = async (email, password) => {
  const { data } = await http.post('/api/auth/login', { email, password });
  saveAuthData(data);
  return data;
};

export const register = async (name, email, password) => {
  const { data } = await http.post('/api/auth/register', {
    name,
    email,
    password,
  });
  saveAuthData(data);
  return data;
};

export const logout = async () => {
  try {
    await http.post('/api/auth/logout');
  } catch {
  } finally {
    clearAuthData();
  }
};

// localStorage helpers

export function saveAuthData({ user, accessToken }) {
  if (!user || !accessToken) {
    console.warn('saveAuthData: faltan user o accessToken');
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ user, accessToken })
  );
}

export function clearAuthData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAuthData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing auth data', e);
    return null;
  }
}

export function getCurrentUser() {
  const data = getAuthData();
  return data?.user || null;
}

export function getAccessToken() {
  const data = getAuthData();
  return data?.accessToken || null;
}


export const forgotPassword = async (email) => {
  const { data } = await http.post('/api/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token, password) => {
  const { data } = await http.post('/api/auth/reset-password', { token, password });
  return data;
};
