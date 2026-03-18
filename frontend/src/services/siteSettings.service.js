import http from './http';

export const getAdminSiteSettings = async () => (await http.get("/api/site-settings")).data;
export const updateSiteSettings = async (payload) => (await http.put("/api/site-settings", payload)).data;
export const getPublicSiteSettings = async () => (await http.get("/api/site-settings/public")).data;
