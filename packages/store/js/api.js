import { normalizeApiProduct } from '../../shared/js/normalize.js';
import { PRODUCT_API_URL } from '../../shared/js/api-config.js';

let products = [];

export function getProducts() {
  return products;
}

export function setProducts(newProducts) {
  products = newProducts;
}

export async function loadProducts({ onProductsLoaded, onError }) {
  if (!PRODUCT_API_URL) {
    return products;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(PRODUCT_API_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const list = Array.isArray(payload) ? payload : (payload.data || payload.products || payload.result || []);
    products = list.map(normalizeApiProduct).filter((product) => product.name);
    onProductsLoaded?.();
    return products;
  } catch (error) {
    console.error('No se pudo cargar el catálogo desde la API:', error);
    onError?.(error);
    return products;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
