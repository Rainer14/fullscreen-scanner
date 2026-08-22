export function initFormController({ onFormReset, onSubmit }) {
  const form = document.getElementById('product-form');
  const flashcard = document.getElementById('product-card');
  const openBackButton = document.getElementById('open-back-btn');
  const backToFrontButtons = document.querySelectorAll('#back-to-front-btn, #back-to-front-btn-copy');

  if (!form || !flashcard) return;

  function flipCard() {
    flashcard.classList.add('flipped');
  }

  function unflipCard() {
    flashcard.classList.remove('flipped');
  }

  openBackButton?.addEventListener('click', flipCard);
  backToFrontButtons.forEach((button) => button.addEventListener('click', unflipCard));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    let isValid = true;
    const requiredFields = [
      { id: 'description', message: 'La descripción es obligatoria.' },
      { id: 'codigo', message: 'El código es obligatorio.' },
      { id: 'detal', message: 'El precio detal es obligatorio.' },
      { id: 'mayor', message: 'El precio mayor es obligatorio.' }
    ];

    requiredFields.forEach(({ id, message }) => {
      const input = document.getElementById(id);
      if (input && input.value.trim() === '') {
        showError(input, message);
        isValid = false;
      }
    });

    const barcodeField = document.getElementById('barcode');
    const barcode = barcodeField?.value.trim() || '';
    if (!barcode) {
      if (barcodeField) showError(barcodeField, 'El código de barras es obligatorio.');
      isValid = false;
      flipCard();
    }

    ['detal', 'mayor'].forEach((id) => {
      const input = document.getElementById(id);
      if (input && input.value.trim() !== '' && Number.isNaN(Number(input.value))) {
        showError(input, `${id === 'detal' ? 'Precio Detal' : 'Precio Mayor'} debe ser un número.`);
        isValid = false;
      }
    });

    if (!isValid) return;

    const formData = {
      descripcion: document.getElementById('description').value.trim(),
      codigo: document.getElementById('codigo').value.trim(),
      categoria: document.getElementById('categoria')?.value.trim() || '',
      precioDetal: Number(document.getElementById('detal').value),
      precioMayor: Number(document.getElementById('mayor').value),
      marca: document.getElementById('marca')?.value.trim() || '',
      origen: document.getElementById('origen')?.value.trim() || '',
      codigoBarras: barcode
    };

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      await onSubmit?.(formData);
      console.log('Formulario enviado', formData);
      alert('Producto registrado con éxito.');
      form.reset();
      await onFormReset?.();
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      alert(error.message || 'No se pudo enviar el formulario.');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  function showError(inputElement, message) {
    inputElement.style.borderColor = '#ef4444';
    inputElement.style.backgroundColor = '#fef2f2';

    const errorSpan = document.createElement('span');
    errorSpan.className = 'error-message';
    errorSpan.innerText = message;
    inputElement.parentNode.appendChild(errorSpan);
  }

  function clearErrors() {
    document.querySelectorAll('.error-message').forEach((error) => error.remove());
    document.querySelectorAll('input, select, textarea').forEach((input) => {
      input.style.borderColor = '';
      input.style.backgroundColor = '';
    });
  }
}
