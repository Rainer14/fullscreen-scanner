import { initFormController } from './frontend/formController.js';
import { initImageUploader } from './frontend/imageUploader.js';
import { PRODUCT_API_URL } from './frontend/apiConfig.js';
import { fillProductForm } from './frontend/productDataMapper.js';
import { initQrScanner } from './frontend/qrScanner.js';

const qrScanner = initQrScanner({
  onDetected: async (decodedText) => {
    try {
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: decodedText })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al enviar el QR');
    } catch (error) {
      console.log('Error al enviar el QR:', error);
    }
  }
});

initFormController({
  onSubmit: async (productData) => {
    if (!PRODUCT_API_URL) {
      throw new Error('Configura la URL de la API de productos en frontend/apiConfig.js.');
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
      } catch (error) {
      }
      throw new Error(message);
    }

    return response;
  },
  onFormReset: async () => {
    if (qrScanner.isActive()) await qrScanner.stop();
  }
});
initImageUploader({
  onDataExtracted: (responseData) => {
    fillProductForm(responseData);
    document.getElementById('product-card')?.classList.remove('flipped');
  }
});
