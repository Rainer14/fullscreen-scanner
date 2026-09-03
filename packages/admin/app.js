import { getProducts, setProducts, createProduct, updateProduct, deleteProduct, loadProducts } from './js/products.js';
import { initFormController, recalculatePrices } from './js/form-controller.js';
import { initImageUploader } from './js/image-uploader.js';
import { fillProductForm } from './js/product-data-mapper.js';
import { initQrScanner } from './js/qr-scanner.js';
import { getStoredToken, saveToken, clearToken, checkToken, login } from './js/auth.js';
import { showToast } from '../shared/js/toast.js';
import { money } from '../shared/js/money.js';

const categoryNames = { escolar: 'Escolar', belleza: 'Belleza', hogar: 'Hogar', tecnologia: 'Tecnología', variados: 'Variados' };

const loginPage = document.getElementById('login-page');
const accountView = document.getElementById('account-view');
const adminView = document.getElementById('admin-view');
const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const productSubmitBtn = document.getElementById('product-submit');

function renderProductList() {
  const products = getProducts();
  productList.innerHTML = products.length
    ? products.map((product) => `
      <article class="product-item">
        <div>
          <p>${product.name}</p>
          <small>${categoryNames[product.category] || product.category} · ${money(product.price)}</small>
        </div>
        <div class="product-controls">
          <button type="button" data-edit-product="${product.id}">Modificar</button>
          <button type="button" data-delete-product="${product.id}">Eliminar</button>
        </div>
      </article>`).join('')
    : '<p class="product-empty">Aún no hay productos en el catálogo.</p>';
}

function openAccount() {
  accountView.hidden = false;
  adminView.hidden = false;
  renderProductList();
  document.getElementById('product-description')?.focus();
}

function closeAccount() {
  accountView.hidden = true;
}

function showLoginPage() {
  closeAccount();
  document.getElementById('app').hidden = true;
  loginPage.hidden = false;
  document.body.dataset.route = 'cuenta';
  window.scrollTo({ top: 0 });
  document.getElementById('login-email')?.focus();
}

function showDashboard() {
  loginPage.hidden = true;
  document.getElementById('app').hidden = false;
  document.body.dataset.route = 'admin';
  openAccount();
  fetchBcvRate();
}

function setSubmitButtonText(text) {
  if (productSubmitBtn) productSubmitBtn.innerHTML = text;
}

function isEditing() {
  return !!document.getElementById('product-id').value;
}

async function fetchBcvRate() {
  const tasaInput = document.getElementById('product-tasaCambio');
  if (!tasaInput) return;
  try {
    const response = await fetch('/api/bcv-rate');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const data = payload.data || payload;
    const tasa = Number(data.tasa);
    if (tasa > 0) {
      tasaInput.value = tasa.toFixed(4);
      recalculatePrices();
    }
  } catch (error) {
    console.error('No se pudo obtener la tasa BCV:', error);
    showToast('No se pudo obtener la tasa BCV automáticamente.');
  }
}

const qrScanner = initQrScanner({
  onDetected: async (decodedText) => {
    try {
      const barcodeInput = document.getElementById('product-codigoBarras');
      if (barcodeInput) barcodeInput.value = decodedText;
    } catch (error) {
      console.log('Error al enviar el QR:', error);
    }
  }
});

initFormController({
  onSubmit: async (productData) => {
    const id = document.getElementById('product-id').value;
    if (id) {
      return updateProduct(id, productData);
    }
    return createProduct(productData);
  },
  onFormReset: async () => {
    if (qrScanner.isActive()) await qrScanner.stop();
    if (productForm) productForm.reset();
    const idInput = document.getElementById('product-id');
    if (idInput) idInput.value = '';
    setSubmitButtonText('Registrar producto <span>&rarr;</span>');
  },
  onSuccess: async () => {
    await loadProducts();
    renderProductList();
    if (isEditing()) {
      showToast('Producto modificado con éxito.');
    } else {
      showToast('Producto registrado con éxito.');
    }
    setSubmitButtonText('Registrar producto <span>&rarr;</span>');
  },
  onReloadRate: fetchBcvRate
});

initImageUploader({
  onDataExtracted: (responseData) => {
    fillProductForm(responseData);
    recalculatePrices();
    showToast('Datos extraídos con IA. Revisa y completa los campos.');
  }
});

document.getElementById('account-close').addEventListener('click', closeAccount);

const passwordToggle = document.getElementById('password-toggle');
passwordToggle?.addEventListener('click', () => {
  const passwordField = document.getElementById('login-password');
  if (!passwordField) return;
  const showing = passwordField.type === 'text';
  passwordField.type = showing ? 'password' : 'text';
  passwordToggle.classList.toggle('is-visible', !showing);
  passwordToggle.setAttribute('aria-pressed', String(!showing));
  passwordToggle.setAttribute('aria-label', showing ? 'Mostrar contraseña' : 'Ocultar contraseña');
  passwordField.focus();
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const passwordField = document.getElementById('login-password');
  const password = passwordField?.value.trim() || '';
  const submitButton = event.target.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  try {
    const token = await login(password);
    if (!token) {
      showToast('Credenciales de administración incorrectas.');
      return;
    }
    saveToken(token);
    showDashboard();
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    showToast('No se pudo conectar con el servidor.');
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

document.getElementById('logout-button').addEventListener('click', () => {
  clearToken();
  closeAccount();
  showLoginPage();
});

productList.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-edit-product]');
  const deleteButton = event.target.closest('[data-delete-product]');

  if (editButton) {
    const product = getProducts().find((item) => String(item.id) === String(editButton.dataset.editProduct));
    if (!product) return;
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-description').value = product.name || '';
    document.getElementById('product-categoria').value = product.category || 'variados';
    document.getElementById('product-precio').value = product.price || '';
    document.getElementById('product-precioDetal').value = product.precioDetal || '';
    document.getElementById('product-precioMayor').value = product.precioMayor || '';
    document.getElementById('product-tasaCambio').value = product.tasaCambio || '';
    document.getElementById('product-margen').value = product.margen !== undefined && product.margen !== null ? product.margen : '';
    document.getElementById('product-precioDolar').value = product.precioDolar || '';
    document.getElementById('product-precioDolarTienda').value = product.precioDolarTienda || '';
    document.getElementById('product-marca').value = product.marca || '';
    document.getElementById('product-origen').value = product.origen || '';
    document.getElementById('product-codigoBarras').value = product.codigoBarras || '';
    document.getElementById('product-image').value = product.image || '';
    setSubmitButtonText('Guardar cambios <span>✓</span>');
  }

  if (deleteButton) {
    const id = deleteButton.dataset.deleteProduct;
    const product = getProducts().find((item) => String(item.id) === String(id));
    if (window.confirm(`¿Eliminar ${product?.name}?`)) {
      try {
        await deleteProduct(id);
        setProducts(getProducts().filter((item) => String(item.id) !== String(id)));
        renderProductList();
        showToast('Producto eliminado');
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        showToast(error.message || 'No se pudo eliminar el producto.');
      }
    }
  }
});

async function restoreSession() {
  const token = getStoredToken();
  if (token) {
    const valid = await checkToken(token).catch(() => false);
    if (valid) {
      showDashboard();
      return;
    }
    clearToken();
  }
  showLoginPage();
}

loadProducts({
  onSuccess: () => renderProductList(),
  onError: () => showToast('No se pudo conectar a la API; mostrando catálogo local.')
});

renderProductList();
restoreSession();