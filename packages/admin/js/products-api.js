import { PRODUCT_API_URL } from '../../shared/js/api-config.js';

export async function submitProduct(productData) {
  if (!PRODUCT_API_URL) {
    throw new Error('Configura la URL de la API de productos en src/config.js.');
  }
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
    } catch (error) {}
    throw new Error(message);
  }
  return response;
}
