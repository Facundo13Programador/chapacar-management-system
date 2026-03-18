import http from './http';

export const listCategories = async () => {
  const { data } = await http.get('/api/categories');
  return data;
};

export const getCategory = async (id) => {
  const { data } = await http.get(`/api/categories/${id}`);
  return data;
};

export const createCategory = async (payload) => {
  const { data } = await http.post('/api/categories', payload);
  return data;
};

export const updateCategory = async (id, payload) => {
  const { data } = await http.put(`/api/categories/${id}`, payload);
  return data;
};

export const deleteCategory = async (id) => {
  await http.delete(`/api/categories/${id}`);
};



export const listPublicCategories = async () => {
  const { data } = await http.get("/api/categories/public", { skipAuth: true });
  return data;
};