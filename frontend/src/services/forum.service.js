import http from "./http";
const endpoint = '/api/forum';

export const listForumPosts = async () => {
  const { data } = await http.get(`${endpoint}/posts`);
  return data;
};

export const createForumPost = async (payload) => {
  const { data } = await http.post(`${endpoint}/posts`, payload);
  return data;
};

export const addForumComment = async (postId, payload) => {
  const { data } = await http.post(`${endpoint}/posts/${postId}/comments`, payload);
  return data;
};
