// Cliente de la API de productos del panel de administración.
// La lectura es pública; la escritura (crear/modificar/eliminar) exige el token de admin.

import { normalizeApiProduct } from '../../shared/js/normalize.js';
import { PRODUCT_API_URL } from '../../shared/js/api-config.js';
import { getAuthToken } from './auth.js';

let products = [];

export function getProducts() { return products; }

export function setProducts(list) { products = list; }

// Headers para las peticiones de escritura: incluyen el token de administración.
function authHeaders() {
  return { 'Content-Type': 'application/json', 'x-admin-token': getAuthToken() };
}

// Carga el catálogo (lectura pública) y normaliza cada producto.
export async function loadProducts({ onSuccess, onError } = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(PRODUCT_API_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const list = Array.isArray(payload) ? payload : (payload.data || payload.products || payload.result || []);
    products = list.map(normalizeApiProduct).filter((product) => product.name);
    onSuccess?.(products);
    return products;
  } catch (error) {
    console.error('No se pudo cargar el catálogo:', error);
    onError?.(error);
    return [];
  } finally {
    window.clearTimeout(timeoutId);
  }
}

// Crea un producto (escritura protegida por token).
export async function createProduct(productData) {
  const response = await fetch(PRODUCT_API_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(productData)
  });
  if (!response.ok) {
    let message = `Error HTTP: ${response.status}`;
    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch (e) {}
    throw new Error(message);
  }
  return response;
}

// Modifica un producto existente (escritura protegida por token).
export async function updateProduct(id, productData) {
  const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(productData)
  });
  if (!response.ok) {
    let message = `Error HTTP: ${response.status}`;
    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch (e) {}
    throw new Error(message);
  }
  return response;
}

// Elimina un producto (escritura protegida por token).
export async function deleteProduct(id) {
  const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-token': getAuthToken() }
  });
  if (!response.ok) {
    let message = `Error HTTP: ${response.status}`;
    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch (e) {}
    throw new Error(message);
  }
  return response;
}
