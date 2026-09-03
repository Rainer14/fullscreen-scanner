const fieldMap = {
  description: 'descripcion',
  codigo: 'codigo',
  categoria: 'categoria',
  precio: 'precioDetal',
  precioDetal: 'precioDetal',
  precioMayor: 'precioMayor',
  marca: 'marca',
  origen: 'origen',
  codigoBarras: 'codigoBarras',
  image: 'imagen'
};

export function initFormController({ onSubmit, onFormReset, onSuccess }) {
  const form = document.getElementById('product-form');
  const scanBtn = document.getElementById('btn-scan');
  const submitBtn = document.getElementById('product-submit');

  if (!form) return;

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
      { name: 'codigo', message: 'El código es obligatorio.' },
      { name: 'precio', message: 'El precio es obligatorio.' }
    ];

    requiredFields.forEach(({ name, message }) => {
      const input = document.getElementById(`product-${name}`);
      if (input && !input.value.trim()) {
        showError(input, message);
        isValid = false;
      }
    });

    const precioField = document.getElementById('product-precio');
    const precio = Number(precioField?.value);
    if (precioField?.value && Number.isNaN(precio)) {
      showError(precioField, 'El precio debe ser un número.');
      isValid = false;
    }

    const precioDetalField = document.getElementById('product-precio-detal');
    const precioMayorField = document.getElementById('product-precio-mayor');
    if (precioDetalField?.value && Number.isNaN(Number(precioDetalField.value))) {
      showError(precioDetalField, 'Precio Detal debe ser un número.');
      isValid = false;
    }
    if (precioMayorField?.value && Number.isNaN(Number(precioMayorField.value))) {
      showError(precioMayorField, 'Precio Mayor debe ser un número.');
      isValid = false;
    }

    if (!isValid) return;

    Object.entries(fieldMap).forEach(([htmlId, backendKey]) => {
      const input = document.getElementById(`product-${htmlId}`);
      if (!input) return;
      let value = input.value.trim();
      if (['precio', 'precioDetal', 'precioMayor'].includes(htmlId)) {
        value = Number(value) || 0;
      }
      formData[backendKey] = value;
    });

    if (submitBtn) submitBtn.disabled = true;

    try {
      await onSubmit?.(formData);
      await onSuccess?.();
      await onFormReset?.();
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
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