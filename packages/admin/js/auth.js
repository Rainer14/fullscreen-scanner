// Autenticación del cliente del panel de administración con JWT.
// Obtiene un JWT desde /api/auth/login y lo guarda en localStorage;
// lo valida contra /api/auth/check usando el header Authorization: Bearer.

const TOKEN_KEY = 'lumen_admin_token';

// Devuelve el JWT guardado (vacío si no hay o el almacenamiento no está disponible).
export function getStoredToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || '';
  } catch (e) {
    return '';
  }
}

// Guarda el JWT de administración al iniciar sesión.
export function saveToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {}
}

// Elimina el JWT guardado al cerrar sesión.
export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
}

// Devuelve el token para incluirlo en las peticiones de escritura.
export function getAuthToken() {
  return getStoredToken();
}

// Inicia sesión: envía la contraseña y, si es correcta, devuelve el JWT firmado.
export async function login(password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.token || null;
}

// Confirma con el backend si el JWT sigue siendo válido.
export async function checkToken(token) {
  const response = await fetch('/api/auth/check', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.ok;
}
