// Autenticación del cliente del panel de administración.
// Guarda el token de acceso en localStorage y lo valida contra /api/auth/check.

const TOKEN_KEY = 'lumen_admin_token';

// Devuelve el token guardado (vacío si no hay o el almacenamiento no está disponible).
export function getStoredToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || '';
  } catch (e) {
    return '';
  }
}

// Guarda el token de administración al iniciar sesión.
export function saveToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {}
}

// Elimina el token guardado al cerrar sesión.
export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
}

export function getAuthToken() {
  return getStoredToken();
}

// Confirma con el backend si el token es válido.
export async function checkToken(token) {
  const response = await fetch('/api/auth/check', {
    headers: { 'x-admin-token': token }
  });
  return response.ok;
}
