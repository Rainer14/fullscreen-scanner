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
  },
  onSuccess: () => loadProducts()
});
initImageUploader({
  onDataExtracted: (responseData) => {
    fillProductForm(responseData);
    document.getElementById('product-card')?.classList.remove('flipped');
  }
});

let products = [
  { id: 1, name: 'Cuaderno Tapa Dura', category: 'escolar', label: 'Nuevo', price: 18, image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=700&q=80' },
  { id: 2, name: 'Set de Marcadores', category: 'escolar', label: 'Favorito', price: 12, image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=700&q=80' },
  { id: 3, name: 'Aceite Facial Botánico', category: 'belleza', label: 'Ritual', price: 24, image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=700&q=80' },
  { id: 4, name: 'Vela Cedro & Higo', category: 'hogar', label: 'Calma', price: 29, image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=700&q=80' },
  { id: 5, name: 'Lámpara de Mesa Noma', category: 'hogar', label: 'Nuevo', price: 86, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80' },
  { id: 6, name: 'Auriculares Mini', category: 'tecnologia', label: 'Esencial', price: 48, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80' },
  { id: 7, name: 'Crema de Manos', category: 'belleza', label: 'Suave', price: 16, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=80' },
  { id: 8, name: 'Taza Terra', category: 'variados', label: 'Lumen', price: 22, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=700&q=80' }
];

const storeState = { category: 'todos', query: '', sort: 'featured', cart: [] };
const categoryNames = { escolar: 'Escolar', belleza: 'Belleza', hogar: 'Hogar', tecnologia: 'Tecnología', variados: 'Variados' };
const routeCategories = new Set(['todos', 'escolar', 'belleza', 'hogar', 'tecnologia', 'variados']);
const grid = document.getElementById('product-grid');
const resultCount = document.getElementById('result-count');
const toast = document.getElementById('toast');

function money(value) { return `$${value.toLocaleString('es-CO')}`; }

function renderProducts() {
  const visible = products
    .filter((product) => storeState.category === 'todos' || product.category === storeState.category)
    .filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(storeState.query.toLowerCase()));
  if (storeState.sort === 'low') visible.sort((first, second) => first.price - second.price);
  if (storeState.sort === 'high') visible.sort((first, second) => second.price - first.price);
  resultCount.textContent = `${visible.length} ${visible.length === 1 ? 'producto' : 'productos'}`;
  grid.innerHTML = visible.length ? visible.map((product) => `<article class="product-card"><div class="product-image"><span class="product-badge">${product.label}</span>${product.image ? `<img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.style.display='none'">` : `<span class="product-placeholder">${product.name.charAt(0)}</span>`}<button class="quick-add" data-add="${product.id}">Añadir a la bolsa +</button></div><div class="product-info"><span class="product-category">${categoryNames[product.category] || product.category}</span><h3 class="product-name">${product.name}</h3><p class="product-price">${money(product.price)}</p></div></article>`).join('') : '<p class="empty-state">No encontramos piezas con esa búsqueda. Prueba otra palabra.</p>';
}

function normalizeApiProduct(item) {
  const pick = (...keys) => {
    for (const key of keys) {
      const value = item[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return undefined;
  };
  const id = pick('_id', 'id') ?? '';
  const name = pick('name', 'nombre', 'title', 'producto', 'descripcion') ?? 'Producto';
  const category = String(pick('category', 'categoria') ?? 'variados').toLowerCase();
  const price = Number(pick('price', 'precio', 'precioDetal', 'precio_detal', 'precioMayor', 'precio_mayor')) || 0;
  const image = pick('image', 'imagen', 'img', 'foto', 'photo', 'url');
  const label = pick('label', 'etiqueta', 'badge') ?? 'Nuevo';
  return { id, name, category, price, image: image || '', label };
}

async function loadProducts() {
  if (!PRODUCT_API_URL) return;
  try {
    const response = await fetch(PRODUCT_API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const list = Array.isArray(payload) ? payload : (payload.data || payload.products || payload.result || []);
    products = list.map(normalizeApiProduct).filter((product) => product.name);
    renderProducts();
    if (adminView && !adminView.hidden) renderManagerList();
  } catch (error) {
    console.error('No se pudo cargar el catálogo desde la API:', error);
    showToast('No se pudo conectar a la API; mostrando catálogo local.');
  }
}

function renderCart() {
  const count = storeState.cart.reduce((total, item) => total + item.quantity, 0);
  const total = storeState.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById('cart-count').textContent = count;
  document.getElementById('drawer-count').textContent = `(${count})`;
  document.getElementById('cart-total').textContent = money(total);
  document.getElementById('cart-items').innerHTML = storeState.cart.length ? storeState.cart.map((item) => `<div class="cart-line"><img src="${item.image}" alt="" onerror="this.style.display='none'"><div><strong>${item.name}</strong><br><small>${item.quantity} × ${money(item.price)}</small><br><button class="remove-item" data-remove="${item.id}">Eliminar</button></div><strong>${money(item.price * item.quantity)}</strong></div>`).join('') : '<p class="empty-state">Tu bolsa está esperando algo especial.</p>';
}

function showToast(message) { toast.textContent = message; toast.classList.add('show'); window.setTimeout(() => toast.classList.remove('show'), 2200); }
function openCart() { document.getElementById('cart-drawer').classList.add('open'); document.getElementById('drawer-overlay').classList.add('open'); document.getElementById('cart-drawer').setAttribute('aria-hidden', 'false'); }
function closeCart() { document.getElementById('cart-drawer').classList.remove('open'); document.getElementById('drawer-overlay').classList.remove('open'); document.getElementById('cart-drawer').setAttribute('aria-hidden', 'true'); }
function selectCategory(category) {
  storeState.category = category;
  document.body.dataset.section = category;
  document.querySelectorAll('[data-category]').forEach((button) => button.classList.toggle('active', button.dataset.category === category));
  document.querySelectorAll('[data-nav]').forEach((link) => link.classList.toggle('active', link.dataset.nav === category));
  renderProducts();
}

function routeFromLocation() {
  const route = window.location.hash.replace(/^#\/?/, '').split('?')[0] || 'inicio';
  return route;
}

function navigateTo(category) {
  const nextHash = category === 'inicio' ? '#inicio' : `#${category}`;
  if (window.location.hash !== nextHash) window.history.pushState({ category }, '', nextHash);
  applyRoute();
}

function applyRoute() {
  const route = routeFromLocation();
  if (route === 'cuenta') {
    showLoginPage();
    return;
  }
  hideLoginPage();
  const category = routeCategories.has(route) ? route : 'todos';
  selectCategory(category);
  if (route === 'catalogo' || routeCategories.has(route)) {
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

const mobileMenu = document.getElementById('mobile-menu');
const menuToggle = document.getElementById('menu-toggle');
let menuReturnFocus;
function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  mobileMenu.inert = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
  menuReturnFocus?.focus();
}
function openMobileMenu() {
  menuReturnFocus = document.activeElement;
  mobileMenu.classList.add('open');
  mobileMenu.setAttribute('aria-hidden', 'false');
  mobileMenu.inert = false;
  menuToggle.setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-open');
  mobileMenu.querySelector('a')?.focus();
}
menuToggle.addEventListener('click', () => (mobileMenu.classList.contains('open') ? closeMobileMenu() : openMobileMenu()));
window.addEventListener('popstate', applyRoute);
window.addEventListener('hashchange', applyRoute);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && mobileMenu.classList.contains('open')) closeMobileMenu(); });
document.querySelectorAll('[data-mobile-action]').forEach((button) => button.addEventListener('click', () => {
  closeMobileMenu();
  if (button.dataset.mobileAction === 'admin') openAccount();
  else navigateToLogin();
}));

document.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add]');
  const removeButton = event.target.closest('[data-remove]');
  if (addButton) {
    const product = products.find((item) => String(item.id) === addButton.dataset.add);
    const existing = storeState.cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += 1;
    else storeState.cart.push({ ...product, quantity: 1 });
    renderCart();
    showToast(`${product.name} se añadió a tu bolsa`);
  }
  if (removeButton) { storeState.cart = storeState.cart.filter((item) => String(item.id) !== removeButton.dataset.remove); renderCart(); }
  const categoryButton = event.target.closest('[data-category]');
  const navLink = event.target.closest('[data-nav]');
  if (categoryButton) navigateTo(categoryButton.dataset.category);
  if (navLink) { navigateTo(navLink.dataset.nav); closeMobileMenu(); }
});

document.getElementById('search-input').addEventListener('input', (event) => { storeState.query = event.target.value; renderProducts(); });
document.getElementById('sort-select').addEventListener('change', (event) => { storeState.sort = event.target.value; renderProducts(); });
document.getElementById('search-toggle').addEventListener('click', () => { document.getElementById('search-input').focus(); document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' }); });
document.getElementById('cart-toggle').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
document.getElementById('drawer-overlay').addEventListener('click', closeCart);
document.getElementById('checkout-button').addEventListener('click', () => { if (!storeState.cart.length) showToast('Añade un producto antes de finalizar'); else showToast('Checkout listo para conectar con tu pasarela'); });
const siteHeaderEl = document.getElementById('site-header');
const updateHeaderShadow = () => siteHeaderEl.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', updateHeaderShadow, { passive: true });
updateHeaderShadow();

renderCart();

const accountView = document.getElementById('account-view');
const adminView = document.getElementById('admin-view');
const loginPage = document.getElementById('login-page');
const managerForm = document.getElementById('manager-form');
const managerList = document.getElementById('manager-list');

function renderManagerList() {
  managerList.innerHTML = products.map((product) => `<article class="manager-item"><div><p>${product.name}</p><small>${categoryNames[product.category] || product.category} · ${money(product.price)}</small></div><div class="manager-controls"><button type="button" data-edit-product="${product.id}">Modificar</button><button type="button" data-delete-product="${product.id}">Eliminar</button></div></article>`).join('');
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

function navigateToLogin() {
  if (window.location.hash !== '#/cuenta') window.history.pushState({ route: 'cuenta' }, '', '#/cuenta');
  applyRoute();
}

function showLoginPage() {
  closeAccount();
  closeMobileMenu();
  document.getElementById('inicio').hidden = true;
  loginPage.hidden = false;
  document.body.dataset.route = 'cuenta';
  window.scrollTo({ top: 0 });
  document.getElementById('login-email')?.focus();
}

function hideLoginPage() {
  loginPage.hidden = true;
  document.getElementById('inicio').hidden = false;
  document.body.dataset.route = 'inicio';
}

function resetManagerForm() {
  managerForm.reset();
  document.getElementById('manager-id').value = '';
  document.getElementById('manager-submit').innerHTML = 'Subir producto <span>+</span>';
  document.getElementById('manager-cancel').hidden = true;
}

document.getElementById('account-toggle').addEventListener('click', navigateToLogin);
document.getElementById('admin-toggle').addEventListener('click', openAccount);
document.getElementById('account-close').addEventListener('click', closeAccount);
document.getElementById('login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  window.history.pushState({ category: 'inicio' }, '', '#inicio');
  applyRoute();
  openAccount();
});
document.getElementById('logout-button').addEventListener('click', () => {
  closeAccount();
  if (window.location.hash !== '#inicio') window.history.pushState({ category: 'inicio' }, '', '#inicio');
  applyRoute();
});
document.getElementById('legacy-form-toggle').addEventListener('click', () => {
  const legacyPanel = document.getElementById('admin-panel');
  legacyPanel.hidden = !legacyPanel.hidden;
});
document.getElementById('back-to-front-btn-copy').addEventListener('click', () => {
  document.getElementById('admin-panel').hidden = true;
});
document.getElementById('manager-cancel').addEventListener('click', resetManagerForm);
managerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const id = document.getElementById('manager-id').value;
  const productData = {
    name: document.getElementById('manager-name').value.trim(),
    category: document.getElementById('manager-category').value,
    price: Number(document.getElementById('manager-price').value),
    image: document.getElementById('manager-image').value.trim(),
    label: 'Nuevo'
  };
  if (id) products = products.map((product) => product.id === id ? { ...product, ...productData } : product);
  else products.push({ ...productData, id: Date.now() });
  renderProducts();
  renderManagerList();
  resetManagerForm();
  showToast(id ? 'Producto modificado' : 'Producto subido al catálogo');
});

managerList.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit-product]');
  const deleteButton = event.target.closest('[data-delete-product]');
  if (editButton) {
    const product = products.find((item) => String(item.id) === String(editButton.dataset.editProduct));
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
    const product = products.find((item) => String(item.id) === id);
    if (window.confirm(`¿Eliminar ${product.name}?`)) {
      products = products.filter((item) => item.id !== id);
      storeState.cart = storeState.cart.filter((item) => item.id !== id);
      renderProducts();
      renderCart();
      renderManagerList();
      showToast('Producto eliminado');
    }
  }
});

loadProducts().finally(() => applyRoute());
