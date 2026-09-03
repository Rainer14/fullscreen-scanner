import { getProducts, setProducts, createProduct, updateProduct, deleteProduct, loadProducts } from './js/products.js';
import { initFormController } from './js/form-controller.js';
import { initImageUploader } from './js/image-uploader.js';
import { fillProductForm } from './js/product-data-mapper.js';
import { initQrScanner } from './js/qr-scanner.js';
import { getStoredToken, saveToken, clearToken, checkToken } from './js/auth.js';
import { showToast } from '../shared/js/toast.js';
import { money } from '../shared/js/money.js';

const categoryNames = { escolar: 'Escolar', belleza: 'Belleza', hogar: 'Hogar', tecnologia: 'Tecnología', variados: 'Variados' };

const loginPage = document.getElementById('login-page');
const accountView = document.getElementById('account-view');
const adminView = document.getElementById('admin-view');
const adminPanel = document.getElementById('admin-panel');
const managerForm = document.getElementById('manager-form');
const managerList = document.getElementById('manager-list');

function renderManagerList() {
  const products = getProducts();
  managerList.innerHTML = products.length
    ? products.map((product) => `<article class="manager-item"><div><p>${product.name}</p><small>${categoryNames[product.category] || product.category} · ${money(product.price)}</small></div><div class="manager-controls"><button type="button" data-edit-product="${product.id}">Modificar</button><button type="button" data-delete-product="${product.id}">Eliminar</button></div></article>`).join('')
    : '<p class="manager-empty">Aún no hay productos en el catálogo.</p>';
}

function openAccount() {
  accountView.hidden = false;
  adminView.hidden = false;
  renderManagerList();
  document.getElementById('manager-name').focus();
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
}

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
    return createProduct(productData);
  },
  onFormReset: async () => {
    if (qrScanner.isActive()) await qrScanner.stop();
  },
  onSuccess: async () => {
    await loadProducts();
    renderManagerList();
  }
});

initImageUploader({
  onDataExtracted: (responseData) => {
    fillProductForm(responseData);
    document.getElementById('product-card')?.classList.remove('flipped');
  }
});

document.getElementById('account-close').addEventListener('click', closeAccount);

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const passwordField = document.getElementById('login-password');
  const token = passwordField?.value.trim() || '';
  const submitButton = event.target.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  try {
    const valid = await checkToken(token);
    if (!valid) {
      showToast('Token de administración incorrecto.');
      return;
    }
    saveToken(token);
    showDashboard();
  } catch (error) {
    console.error('Error al verificar el token:', error);
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

document.getElementById('legacy-form-toggle').addEventListener('click', () => {
  adminPanel.hidden = !adminPanel.hidden;
});

document.getElementById('back-to-front-btn-copy').addEventListener('click', () => {
  adminPanel.hidden = true;
});

document.getElementById('manager-cancel').addEventListener('click', resetManagerForm);

managerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.getElementById('manager-id').value;
  const name = document.getElementById('manager-name').value.trim();
  const productData = {
    name,
    category: document.getElementById('manager-category').value,
    price: Number(document.getElementById('manager-price').value),
    image: document.getElementById('manager-image').value.trim(),
    label: 'Nuevo'
  };

  try {
    if (id) {
      await updateProduct(id, productData);
      setProducts(getProducts().map((p) => String(p.id) === String(id) ? { ...p, ...productData } : p));
      showToast('Producto modificado');
    } else {
      const response = await createProduct(productData);
      const created = await response.json().catch(() => ({}));
      const normalized = normalizeLocalProduct({ ...productData, _id: created._id || created.id || Date.now() });
      setProducts([...getProducts(), normalized]);
      showToast('Producto subido al catálogo');
    }
    renderManagerList();
    resetManagerForm();
  } catch (error) {
    console.error('Error al guardar producto:', error);
    showToast(error.message || 'No se pudo guardar el producto.');
  }
});

function normalizeLocalProduct(item) {
  return {
    id: item._id || item.id || Date.now(),
    name: item.name,
    category: item.category,
    price: item.price,
    detal: item.detal || item.price,
    mayor: item.mayor,
    image: item.image || '',
    label: item.label || 'Nuevo'
  };
}

managerList.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-edit-product]');
  const deleteButton = event.target.closest('[data-delete-product]');

  if (editButton) {
    const product = getProducts().find((item) => String(item.id) === String(editButton.dataset.editProduct));
    if (!product) return;
    document.getElementById('manager-id').value = product.id;
    document.getElementById('manager-name').value = product.name;
    document.getElementById('manager-category').value = product.category;
    document.getElementById('manager-price').value = product.price;
    document.getElementById('manager-image').value = product.image;
    document.getElementById('manager-submit').innerHTML = 'Guardar cambios <span>✓</span>';
    document.getElementById('manager-cancel').hidden = false;
    document.getElementById('manager-name').focus();
  }

  if (deleteButton) {
    const id = deleteButton.dataset.deleteProduct;
    const product = getProducts().find((item) => String(item.id) === String(id));
    if (window.confirm(`¿Eliminar ${product?.name}?`)) {
      try {
        await deleteProduct(id);
        setProducts(getProducts().filter((item) => String(item.id) !== String(id)));
        renderManagerList();
        showToast('Producto eliminado');
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        showToast(error.message || 'No se pudo eliminar el producto.');
      }
    }
  }
});

function resetManagerForm() {
  managerForm.reset();
  document.getElementById('manager-id').value = '';
  document.getElementById('manager-submit').innerHTML = 'Subir producto <span>+</span>';
  document.getElementById('manager-cancel').hidden = true;
}

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
  onSuccess: () => renderManagerList(),
  onError: () => showToast('No se pudo conectar a la API; mostrando catálogo local.')
});

renderManagerList();
restoreSession();
