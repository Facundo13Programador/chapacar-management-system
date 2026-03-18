// src/services/products.service.js
import http from './http';

// endpoint ADMIN
const endpoint = '/api/products';

// Lista para panel admin 
export const listProducts = async () => {
  const { data } = await http.get(endpoint);
  return data;
};

export const getProduct = async (id) => {
  const { data } = await http.get(`/api/products/${id}`);
  return data;
};

export const createProduct = async (payload) => {
  const { data } = await http.post('/api/products', payload);
  return data;
};

export const updateProduct = async (id, payload) => {
  const { data } = await http.put(`/api/products/${id}`, payload);
  return data;
};

export const deleteProduct = async (id) => {
  await http.delete(`/api/products/${id}`);
};

export const listPublicProducts = async (filters = {}) => {
  const { brand, model, category, sku } = filters;

  const { data } = await http.get('/api/products/public', {
    params: {
      brand: brand || undefined,
      model: model || undefined,
      category: category || undefined,
      sku: sku || undefined,
    },
    skipAuth: true,
  });

  return data;
};


export const getPublicProduct = async (id) => {
  const { data } = await http.get(`/api/products/public/${id}`, { skipAuth: true });
  return data;
};
