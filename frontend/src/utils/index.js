export const getError = (err) =>
    err?.response?.data?.message ||
    err?.message ||
    'Error inesperado';
  