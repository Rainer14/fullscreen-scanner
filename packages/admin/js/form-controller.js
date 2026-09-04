import { showToast } from '../../shared/js/toast.js';

const fieldMap = {
  description: 'descripcion',
  codigo: 'codigo',
  categoria: 'categoria',
  precioDetal: 'precioDetal',
  precioMayor: 'precioMayor',
  tasaCambio: 'tasaCambio',
  margen: 'margen',
  precioDolar: 'precioDolar',
  precioDolarTienda: 'precioDolarTienda',
  marca: 'marca',
  origen: 'origen',
  codigoBarras: 'codigoBarras',
  image: 'imagen'
};

export function recalculatePrices() {
  const detalEl = document.getElementById('product-precioDetal');
  const tasaEl = document.getElementById('product-tasaCambio');
  const margenEl = document.getElementById('product-margen');
  const dolarEl = document.getElementById('product-precioDolar');
  const tiendaEl = document.getElementById('product-precioDolarTienda');

  const detal = Number(detalEl?.value) || 0;
  const tasa = Number(tasaEl?.value) || 0;
  const margen = Number(margenEl?.value) || 0;

  const dolar = tasa > 0 ? detal / tasa : 0;
  const tienda = dolar > 0 ? dolar * (1 + margen / 100) : 0;

  if (dolarEl) dolarEl.value = dolar ? dolar.toFixed(2) : '';
  if (tiendaEl) tiendaEl.value = tienda ? tienda.toFixed(2) : '';
}

export function initFormController({ onSubmit, onFormReset, onSuccess, onReloadRate, galleryManager }) {
  const form = document.getElementById('product-form');
  const scanBtn = document.getElementById('btn-scan');
  const submitBtn = document.getElementById('product-submit');
  const reloadRateBtn = document.getElementById('btn-reload-rate');

  if (!form) return;

  reloadRateBtn?.addEventListener('click', () => {
    onReloadRate?.();
  });

  ['product-precioDetal', 'product-precioMayor', 'product-margen', 'product-tasaCambio'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', recalculatePrices);
  });

  scanBtn?.addEventListener('click', () => {
    const scannerModal = document.getElementById('scanner-modal');
    if (scannerModal) {
      scannerModal.removeAttribute('hidden');
      requestAnimationFrame(() => scannerModal.classList.add('open'));
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const formData = {};
    let isValid = true;

    const requiredFields = [
      { name: 'description', message: 'La descripción es obligatoria.' },
      { name: 'precioDetal', message: 'El precio es obligatorio.' }
    ];

    requiredFields.forEach(({ name, message }) => {
      const input = document.getElementById(`product-${name}`);
      if (input && !input.value.trim()) {
        showError(input, message);
        isValid = false;
      }
    });

    const precioDetalField = document.getElementById('product-precioDetal');
    const precioMayorField = document.getElementById('product-precioMayor');
    if (precioDetalField?.value && Number.isNaN(Number(precioDetalField.value))) {
      showError(precioDetalField, 'Precio Detal debe ser un número.');
      isValid = false;
    }
    if (precioMayorField?.value && Number.isNaN(Number(precioMayorField.value))) {
      showError(precioMayorField, 'Precio Mayor debe ser un número.');
      isValid = false;
    }

    const margenField = document.getElementById('product-margen');
    const margen = Number(margenField?.value);
    if (margenField?.value && (Number.isNaN(margen) || margen < 0)) {
      showError(margenField, 'El margen debe ser un número mayor o igual a 0.');
      isValid = false;
    }

    const tasaField = document.getElementById('product-tasaCambio');
    const tasa = Number(tasaField?.value);
    if (tasaField?.value && (Number.isNaN(tasa) || tasa <= 0)) {
      showError(tasaField, 'La tasa BCV debe ser mayor a 0.');
      isValid = false;
    }

    if (!isValid) return;

    Object.entries(fieldMap).forEach(([htmlId, backendKey]) => {
      const input = document.getElementById(`product-${htmlId}`);
      if (!input) return;
      let value = input.value.trim();
      if (['precioDetal', 'precioMayor', 'margen', 'tasaCambio', 'precioDolar', 'precioDolarTienda'].includes(htmlId)) {
        value = Number(value) || 0;
      }
      formData[backendKey] = value;
    });

    const galleryUrls = galleryManager?.getUrls ? galleryManager.getUrls() : [];
    const mainImage = formData.imagen || '';
    const gallery = galleryUrls.filter(Boolean);
    if (mainImage && !gallery.some((url) => url === mainImage)) {
      gallery.unshift(mainImage);
    }
    if (gallery.length) {
      formData.galeria = gallery;
      if (!formData.imagen) formData.imagen = gallery[0];
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
      await onSubmit?.(formData);
      await onSuccess?.();
      await onFormReset?.();
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      showToast(error.message || 'No se pudo guardar el producto.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  function showError(inputElement, message) {
    inputElement.classList.add('error');
    const errorSpan = document.createElement('span');
    errorSpan.className = 'error-message';
    errorSpan.innerText = message;
    inputElement.parentNode.appendChild(errorSpan);
  }

  function clearErrors() {
    document.querySelectorAll('.error-message').forEach((error) => error.remove());
    document.querySelectorAll('.unified-form input, .unified-form select').forEach((input) => {
      input.classList.remove('error');
    });
  }
}