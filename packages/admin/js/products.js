import { normalizeApiProduct } from '../../shared/js/normalize.js';
import { PRODUCT_API_URL } from '../../shared/js/api-config.js';

let products = [];

export function getProducts() { return products; }

export function setProducts(list) { products = list; }

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

export async function createProduct(productData) {
  const response = await fetch(PRODUCT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export async function updateProduct(id, productData) {
  const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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

export async function deleteProduct(id) {
  const response = await fetch(`${PRODUCT_API_URL}/${id}`, { method: 'DELETE' });
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
