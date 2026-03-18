// utils/authUtils.js
const KEY = 'userInfo';

// --- helpers internos ---
function safeParse(json) {
  try { return JSON.parse(json); } catch { return null; }
}
function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('auth-changed'));
}

// --- API pública ---
export function saveAuth(data) {
  write(data ?? {});
}

export function getAuth() {
  return safeParse(localStorage.getItem(KEY)) || null;
}

export function getAccessToken() {
  return getAuth()?.accessToken || null;
}

export function getUser() {
  return getAuth()?.user || null;
}

export function clearAuth() {
  localStorage.removeItem(KEY);
  localStorage.removeItem('user');
  localStorage.removeItem('userInfo'); // (por si quedó en otra key en algún momento)

  window.dispatchEvent(new Event('auth-changed'));
}




function parseJwt(token) {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenValid(token) {
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
}


export function isAuthenticated() {
  const token = getAccessToken();
  return isTokenValid(token);
}

export function setAccessToken(token) {
  const curr = getAuth() || {};
  write({ ...curr, accessToken: token || null });
}

export function setUser(user) {
  const curr = getAuth() || {};
  write({ ...curr, user: user || null });
}

export function onAuthChange(handler) {
  const storageHandler = (e) => {
    if (!e || e.key === null || e.key === KEY) handler();
  };
  const customHandler = () => handler();

  window.addEventListener('storage', storageHandler);
  window.addEventListener('auth-changed', customHandler);

  return () => {
    window.removeEventListener('storage', storageHandler);
    window.removeEventListener('auth-changed', customHandler);
  };
}
