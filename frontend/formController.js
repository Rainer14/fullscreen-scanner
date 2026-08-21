export function initFormController({ onFormReset }) {
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

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();

    let isValid = true;
    const requiredFields = [
      { id: 'description', message: 'La descripción es obligatoria.' },
      { id: 'codigo', message: 'El código es obligatorio.' }
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

    const formData = Object.fromEntries(
      ['description', 'codigo', 'categoria', 'detal', 'mayor', 'marca', 'origen'].map((id) => [
        id,
        document.getElementById(id)?.value.trim() || ''
      ])
    );
    formData.barcode = barcode;

    console.log('Formulario enviado', formData);
    alert('Producto registrado con éxito. Revisa la consola para ver los datos.');
    form.reset();
    onFormReset?.();
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
