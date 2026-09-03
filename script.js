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
  { id: 1, name: 'Cuaderno Tapa Dura', category: 'escolar', label: 'Nuevo', price: 18, image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=700&q=80', description: 'Cuaderno de alta calidad con tapa dura en cartón reciclado. Interior de papel crema de 80g, 192 páginas rayadas. Ideal para escritura diaria, notas y apuntes.', materials: 'Cartón reciclado, papel 80g', care: 'Mantener seco, evitar exposición directa al sol', colors: [{ name: 'Negro', hex: '#1d2825' }, { name: 'Verde', hex: '#5a7a5e' }, { name: 'Rojo', hex: '#b8472b' }], sizes: ['A5', 'A4'], images: ['https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80'] },
  { id: 2, name: 'Set de Marcadores', category: 'escolar', label: 'Favorito', price: 12, image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=700&q=80', description: 'Set de 12 marcadores de colores vibrantes con punta雙al (fina y gruesa). Tinta a base de agua, no tóxica. Ideal para ilustración, caligrafía y organización.', materials: 'Cuerpo de plástico reciclado, tinta a base de agua', care: 'Cerrar bien después de cada uso. Almacenar en posición vertical.', colors: [{ name: 'Multicolor', hex: '#e8a849' }], sizes: ['12 colores', '24 colores'], images: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=900&q=80'] },
  { id: 3, name: 'Aceite Facial Botánico', category: 'belleza', label: 'Ritual', price: 24, image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=700&q=80', description: 'Aceite facial elaborado con una mezcla de aceites botánicos orgánicos: jojoba, rosa mosqueta y argán. Hidrata profundamente sin dejar residuos grasos. Apto para todo tipo de piel.', materials: 'Aceites orgánicos certificados', care: 'Almacenar en lugar fresco y seco. Usar dentro de 12 meses tras abrir.', colors: [{ name: 'Natural', hex: '#c9a96e' }], sizes: ['30ml', '50ml'], images: ['https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=900&q=80'] },
  { id: 4, name: 'Vela Cedro & Higo', category: 'hogar', label: 'Calma', price: 29, image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=700&q=80', description: 'Vela artesanal de cera de soja con aroma a cedro y higo. Quemado limpio de hasta 45 horas. Envase de cerámica reutilizable, perfecto para decorar después de usar.', materials: 'Cera de soja, mecha de algodón, cerámica artesanal', care: 'Recortar la mecha a 5mm antes de cada encendido. No dejar encendida más de 4 horas seguidas.', colors: [{ name: 'Blanco', hex: '#f0ece4' }], sizes: ['200g'], images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80'] },
  { id: 5, name: 'Lámpara de Mesa Noma', category: 'hogar', label: 'Nuevo', price: 86, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80', description: 'Lámpara de mesa de diseño escandinavo con base de madera de roble y pantalla de lino natural. Luz cálida y difusa, ideal para escritorios y mesitas de noche.', materials: 'Robble certificado FSC, lino natural, cable textil', care: 'Limpiar la pantalla con un paño seco. No usar productos químicos en la madera.', colors: [{ name: 'Natural', hex: '#c8b69a' }, { name: 'Negro', hex: '#1d2825' }], sizes: ['35cm', '50cm'], images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80'] },
  { id: 6, name: 'Auriculares Mini', category: 'tecnologia', label: 'Esencial', price: 48, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80', description: 'Auriculares inalámbricos con cancelación de ruido activa. Batería de larga duración (30h), carga rápida USB-C. Diseño plegable y ligero para máximo confort.', materials: 'Aluminio anodizado, almohadillas de espuma con memoria', care: 'No mojar. Limpiar con paño húmedo. Almacenar en estuche incluido.', colors: [{ name: 'Negro', hex: '#1d2825' }, { name: 'Blanco', hex: '#f0ece4' }], sizes: ['Única'], images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'] },
  { id: 7, name: 'Crema de Manos', category: 'belleza', label: 'Suave', price: 16, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=80', description: 'Crema hidratante para manos con extracto de aloe vera y vitamina E. Absorción rápida, deja la piel suave y protegida sin sensación grasa.', materials: 'Aloe vera orgánico, vitamina E, manteca de karité', care: 'Uso externo. Evitar contacto con los ojos.', colors: [{ name: 'Blanco', hex: '#f5f0eb' }], sizes: ['50ml', '100ml'], images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80'] },
  { id: 8, name: 'Taza Terra', category: 'variados', label: 'Lumen', price: 22, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=700&q=80', description: 'Taza artesanal de cerámica esmaltada con acabado mate. Diseño orgánico inspirado en la naturaleza. Capacidad de 350ml, apta para lavavajillas y microondas.', materials: 'Cerámica artesanal, esmalte no tóxico', care: 'Apta para lavavajillas. No golpear.', colors: [{ name: 'Terracota', hex: '#c4785a' }, { name: 'Arena', hex: '#d9c9b0' }, { name: 'Índigo', hex: '#3d5a80' }], sizes: ['350ml'], images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80'] }
];

const storeState = { category: 'todos', query: '', sort: 'featured', cart: [], priceRanges: [], brands: [] };
const categoryNames = { escolar: 'Escolar', belleza: 'Belleza', hogar: 'Hogar', tecnologia: 'Tecnología', variados: 'Variados' };
const routeCategories = new Set(['todos', 'escolar', 'belleza', 'hogar', 'tecnologia', 'variados']);
const grid = document.getElementById('product-grid');
const resultCount = document.getElementById('result-count');
const catalogStatus = document.getElementById('catalog-status');
const toast = document.getElementById('toast');
const filterSidebar = document.getElementById('filter-sidebar');
const filterOverlay = document.getElementById('filter-overlay');
const filterToggle = document.getElementById('filter-toggle');
const filterClose = document.getElementById('filter-close');
const filterApply = document.getElementById('filter-apply');
const filterClear = document.getElementById('filter-clear');
const filterCountEl = document.getElementById('filter-count');
const brandFiltersEl = document.getElementById('brand-filters');

function money(value) { return `$${value.toLocaleString('es-CO')}`; }

function renderProducts() {
  const visible = products
    .filter((product) => storeState.category === 'todos' || product.category === storeState.category)
    .filter((product) => {
      if (!storeState.query) return true;
      return `${product.name} ${product.category} ${product.marca || ''}`.toLowerCase().includes(storeState.query.toLowerCase());
    })
    .filter((product) => {
      if (!storeState.priceRanges.length) return true;
      const price = product.detal || product.price;
      return storeState.priceRanges.some((range) => {
        if (range === '100+') return price >= 100;
        const [min, max] = range.split('-').map(Number);
        return price >= min && price <= max;
      });
    })
    .filter((product) => {
      if (!storeState.brands.length || !product.marca) return !storeState.brands.length ? true : false;
      return storeState.brands.includes(product.marca);
    });
  if (storeState.sort === 'low') visible.sort((first, second) => (first.detal || first.price) - (second.detal || second.price));
  if (storeState.sort === 'high') visible.sort((first, second) => (second.detal || second.price) - (first.detal || first.price));
  if (storeState.sort === 'az') visible.sort((first, second) => first.name.localeCompare(second.name));
  resultCount.textContent = `${visible.length} ${visible.length === 1 ? 'producto' : 'productos'}`;
  const activeFilters = (storeState.priceRanges.length || storeState.brands.length) ? storeState.priceRanges.length + storeState.brands.length : 0;
  if (activeFilters > 0) { filterCountEl.textContent = activeFilters; filterCountEl.hidden = false; } else { filterCountEl.hidden = true; }
  grid.innerHTML = visible.length ? visible.map((product) => `<article class="product-card" data-id="${product.id}"><div class="product-image"><span class="product-badge">${product.label}</span>${product.image ? `<img class="lazy-image" src="${product.image}" alt="${product.name}" loading="lazy" decoding="async" onload="this.classList.add('is-loaded')" onerror="this.style.display='none'">` : `<span class="product-placeholder">${product.name.charAt(0)}</span>`}<button class="quick-add" data-add="${product.id}">Añadir +</button></div><div class="product-info"><span class="product-category">${categoryNames[product.category] || product.category}</span><h3 class="product-name">${product.name}</h3>${product.marca ? `<p class="product-brand">${product.marca}</p>` : ''}<div class="product-prices"><span class="price-detal">${money(product.detal || product.price)}</span>${product.mayor ? `<span class="price-mayor">Mayor ${money(product.mayor)}</span>` : ''}</div></div></article>`).join('') : '<p class="empty-state">No encontramos piezas con esa búsqueda. Prueba otra palabra.</p>';
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
  const detal = Number(pick('precioDetal', 'precio_detal', 'precio', 'price', 'detal')) || 0;
  const mayor = Number(pick('precioMayor', 'precio_mayor', 'mayor')) || 0;
  const price = detal || mayor;
  const image = pick('image', 'imagen', 'img', 'foto', 'photo', 'url');
  const label = pick('label', 'etiqueta', 'badge') ?? 'Nuevo';
  const marca = pick('marca', 'brand') ?? '';
  const codigo = pick('codigo', 'código', 'code', 'codigoInterno', 'internalCode') ?? '';
  const origen = pick('origen', 'origin', 'paisOrigen', 'paísOrigen') ?? '';
  const description = pick('description', 'descripcion', 'detalle', 'detal') ?? '';
  const materials = pick('materials', 'materiales', 'composition') ?? '';
  const care = pick('care', 'cuidado') ?? '';
  const rawColors = pick('colors', 'colores', 'variants') ?? [];
  const colors = Array.isArray(rawColors) ? rawColors.map((c) => typeof c === 'string' ? { name: c, hex: '#c8b69a' } : { name: c?.name || 'Color', hex: c?.hex || '#c8b69a' }) : [];
  const sizes = Array.isArray(pick('sizes', 'tallas', 'talles')) ? pick('sizes', 'tallas', 'talles') : [];
  const rawImages = pick('images', 'fotos', 'gallery', 'imagenes');
  const images = Array.isArray(rawImages) ? rawImages.filter(Boolean) : [];
  return { id, name, category, price, image: image || '', label, detal, mayor, marca, codigo, origen, description, materials, care, colors, sizes, images }; 
}

async function loadProducts() {
  if (!PRODUCT_API_URL) {
    renderProducts();
    return;
  }

  grid.setAttribute('aria-busy', 'true');
  if (catalogStatus) catalogStatus.textContent = 'Actualizando catálogo...';

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(PRODUCT_API_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const list = Array.isArray(payload) ? payload : (payload.data || payload.products || payload.result || []);
    products = list.map(normalizeApiProduct).filter((product) => product.name);
    generateBrandFilters();
    renderProducts();
    if (catalogStatus) catalogStatus.textContent = 'Catálogo actualizado.';
    if (adminView && !adminView.hidden) renderManagerList();
  } catch (error) {
    console.error('No se pudo cargar el catálogo desde la API:', error);
    if (catalogStatus) catalogStatus.textContent = 'Mostrando catálogo local.';
    showToast('No se pudo conectar a la API; mostrando catálogo local.');
  } finally {
    window.clearTimeout(timeoutId);
    grid.removeAttribute('aria-busy');
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
  const categoryRadio = document.querySelector(`input[name="filter-category"][value="${category}"]`);
  if (categoryRadio) categoryRadio.checked = true;
  const catalogTitle = document.getElementById('catalog-title');
  if (catalogTitle) catalogTitle.textContent = category === 'todos' ? 'Todos' : (categoryNames[category] || category);
  renderProducts();
}

function generateBrandFilters() {
  const brands = [...new Set(products.map((p) => p.marca).filter(Boolean))].sort();
  brandFiltersEl.innerHTML = brands.length ? brands.map((brand) => `<label class="filter-option"><input type="checkbox" name="filter-brand" value="${brand}"> <span>${brand}</span></label>`).join('') : '<p class="filter-empty">No hay marcas disponibles</p>';
}

function openFilters() {
  filterSidebar.classList.add('open');
  filterOverlay.classList.add('open');
  filterToggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeFilters() {
  filterSidebar.classList.remove('open');
  filterOverlay.classList.remove('open');
  filterToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function applyFilters() {
  const checkedPrices = [...document.querySelectorAll('input[name="filter-price"]:checked')].map((el) => el.value);
  const checkedBrands = [...document.querySelectorAll('input[name="filter-brand"]:checked')].map((el) => el.value);
  storeState.priceRanges = checkedPrices;
  storeState.brands = checkedBrands;
  const checkedCategory = document.querySelector('input[name="filter-category"]:checked');
  if (checkedCategory) storeState.category = checkedCategory.value;
  renderProducts();
  closeFilters();
}

function clearFilters() {
  document.querySelectorAll('input[name="filter-price"]:checked').forEach((el) => el.checked = false);
  document.querySelectorAll('input[name="filter-brand"]:checked').forEach((el) => el.checked = false);
  const allCategory = document.querySelector('input[name="filter-category"][value="todos"]');
  if (allCategory) allCategory.checked = true;
  storeState.priceRanges = [];
  storeState.brands = [];
  storeState.category = 'todos';
  document.body.dataset.section = 'todos';
  document.querySelectorAll('[data-category]').forEach((btn) => btn.classList.toggle('active', btn.dataset.category === 'todos'));
  document.querySelectorAll('[data-nav]').forEach((link) => link.classList.toggle('active', link.dataset.nav === 'todos'));
  const catalogTitle = document.getElementById('catalog-title');
  if (catalogTitle) catalogTitle.textContent = 'Todos';
  renderProducts();
}

filterToggle.addEventListener('click', openFilters);
filterClose.addEventListener('click', closeFilters);
filterOverlay.addEventListener('click', closeFilters);
filterApply.addEventListener('click', applyFilters);
filterClear.addEventListener('click', clearFilters);
document.querySelectorAll('input[name="filter-category"]').forEach((radio) => radio.addEventListener('change', () => {
  applyFilters();
}));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && filterSidebar.classList.contains('open')) closeFilters(); });

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
  if (route.startsWith('product-')) {
    const productId = route.replace('product-', '');
    showProductDetail(productId);
    return;
  }
  hideProductDetail();
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
  const productCard = event.target.closest('#product-grid .product-card');
  if (addButton) {
    const product = products.find((item) => String(item.id) === addButton.dataset.add);
    const existing = storeState.cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += 1;
    else storeState.cart.push({ ...product, quantity: 1 });
    renderCart();
    showToast(`${product.name} se añadió a tu bolsa`);
  }
  if (removeButton) { storeState.cart = storeState.cart.filter((item) => String(item.id) !== removeButton.dataset.remove); renderCart(); }
  if (productCard && !addButton) {
    navigateTo(`product-${productCard.dataset.id}`);
    return;
  }
  const categoryButton = event.target.closest('[data-category]');
  const navLink = event.target.closest('[data-nav]');
  if (categoryButton) navigateTo(categoryButton.dataset.category);
  if (navLink) { navigateTo(navLink.dataset.nav); closeMobileMenu(); }
});

document.getElementById('sort-select').addEventListener('change', (event) => { storeState.sort = event.target.value; renderProducts(); });
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

const pdpSection = document.getElementById('product-detail');
let selectedPdpColor = null;
let selectedPdpSize = null;

function hideProductDetail() {
  pdpSection.hidden = true;
  document.getElementById('inicio').hidden = false;
}

function showProductDetail(productId) {
  closeAccount();
  closeMobileMenu();
  document.getElementById('inicio').hidden = true;
  loginPage.hidden = true;
  pdpSection.hidden = false;
  document.body.dataset.route = 'producto';
  window.scrollTo({ top: 0 });
  renderProductDetail(productId);
}

function renderProductDetail(id) {
  const product = products.find((p) => String(p.id) === String(id));
  if (!product) return navigateTo('catalogo');

  selectedPdpColor = null;
  selectedPdpSize = null;

  document.getElementById('pdp-crumb-cat').textContent = categoryNames[product.category] || product.category;
  document.getElementById('pdp-crumb-name').textContent = product.name;
  document.getElementById('pdp-brand').textContent = product.marca || 'Lumen';
  document.getElementById('pdp-title').textContent = product.name;
  document.getElementById('pdp-price').textContent = money(product.detal || product.price);
  document.getElementById('pdp-mayor').textContent = product.mayor ? `Mayor ${money(product.mayor)}` : '';
  document.getElementById('pdp-desc').textContent = product.description || 'Este producto no tiene descripción disponible.';

  const details = [];
  if (product.codigo) details.push(`<li><strong>Código:</strong> ${product.codigo}</li>`);
  if (product.materials) details.push(`<li><strong>Materiales:</strong> ${product.materials}</li>`);
  if (product.care) details.push(`<li><strong>Cuidado:</strong> ${product.care}</li>`);
  if (product.origen) details.push(`<li><strong>Origen:</strong> ${product.origen}</li>`);
  const detailsWrap = document.getElementById('pdp-details');
  detailsWrap.innerHTML = details.length ? `<ul class="pdp-details-list">${details.join('')}</ul>` : '<p>Información detallada no disponible.</p>';

  renderPdpGallery(product);
  renderPdpColors(product);
  renderPdpSizes(product);
  renderPdpRelated(product);
}

function renderPdpGallery(product) {
  const images = (product.images && product.images.length ? product.images : [product.image]).filter(Boolean);
  const mainImg = document.getElementById('pdp-main-img');
  mainImg.src = images[0];
  mainImg.alt = product.name;

  const thumbs = document.getElementById('pdp-thumbs');
  if (images.length > 1) {
    thumbs.innerHTML = images.map((img, i) => `<button class="pdp-thumb ${i === 0 ? 'active' : ''}" data-index="${i}" style="background-image:url('${img}')" role="button" aria-label="Ver imagen ${i + 1}"></button>`).join('');
    thumbs.querySelectorAll('.pdp-thumb').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        mainImg.src = images[thumb.dataset.index];
        thumbs.querySelectorAll('.pdp-thumb').forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
    thumbs.hidden = false;
  } else {
    thumbs.innerHTML = '';
    thumbs.hidden = true;
  }
}

function renderPdpColors(product) {
  const colors = product.colors || [];
  const wrap = document.getElementById('pdp-colors-wrap');
  const colorName = document.getElementById('pdp-color-name');
  const container = document.getElementById('pdp-colors');
  if (!colors.length) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  colorName.textContent = colors[0].name;
  container.innerHTML = colors.map((c, i) => `<button class="pdp-color-swatch ${i === 0 ? 'active' : ''}" data-index="${i}" role="radio" style="background:${c.hex}" aria-label="Color ${c.name}" title="${c.name}"></button>`).join('');
  container.querySelectorAll('.pdp-color-swatch').forEach((sw) => {
    sw.addEventListener('click', () => {
      const color = colors[sw.dataset.index];
      selectedPdpColor = color;
      colorName.textContent = color.name;
      container.querySelectorAll('.pdp-color-swatch').forEach((s) => s.classList.remove('active'));
      sw.classList.add('active');
    });
  });
}

function renderPdpSizes(product) {
  const sizes = product.sizes || [];
  const wrap = document.getElementById('pdp-sizes-wrap');
  const sizeName = document.getElementById('pdp-size-name');
  const container = document.getElementById('pdp-sizes');
  if (!sizes.length) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  sizeName.textContent = 'Seleccionar';
  container.innerHTML = sizes.map((s, i) => `<button class="pdp-size-button" data-index="${i}" role="radio">${s}</button>`).join('');
  container.querySelectorAll('.pdp-size-button').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedPdpSize = sizes[btn.dataset.index];
      sizeName.textContent = selectedPdpSize;
      container.querySelectorAll('.pdp-size-button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function renderPdpRelated(product) {
  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  const fallback = related.length < 4 ? products.filter((p) => p.id !== product.id && !related.includes(p)).slice(0, 4 - related.length) : [];
  const gridEl = document.getElementById('pdp-related-grid');
  const items = [...related, ...fallback].slice(0, 4);
  gridEl.innerHTML = items.map((p) => `
    <article class="product-card" data-id="${p.id}" role="button" tabindex="0">
      <div class="product-image">
        <span class="product-badge">${p.label}</span>
        ${p.image ? `<img class="lazy-image" src="${p.image}" alt="${p.name}" loading="lazy" decoding="async" onload="this.classList.add('is-loaded')" onerror="this.style.display='none'">` : `<span class="product-placeholder">${p.name.charAt(0)}</span>`}
      </div>
      <div class="product-info">
        <span class="product-category">${categoryNames[p.category] || p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        ${p.marca ? `<p class="product-brand">${p.marca}</p>` : ''}
        <div class="product-prices"><span class="price-detal">${money(p.detal || p.price)}</span></div>
      </div>
    </article>`).join('');
  gridEl.querySelectorAll('.product-card').forEach((card) => {
    const go = () => {
      navigateTo(`product-${card.dataset.id}`);
      card.blur();
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
}

function resetManagerForm() {
  managerForm.reset();
  document.getElementById('manager-id').value = '';
  document.getElementById('manager-submit').innerHTML = 'Subir producto <span>+</span>';
  document.getElementById('manager-cancel').hidden = true;
}

document.querySelectorAll('.pdp-section-header').forEach((header) => {
  header.addEventListener('click', () => {
    const body = header.nextElementSibling;
    const expanded = header.getAttribute('aria-expanded') === 'true';
    header.setAttribute('aria-expanded', String(!expanded));
    body.hidden = expanded;
    header.querySelector('span').textContent = expanded ? '+' : '−';
  });
});

document.getElementById('pdp-add-bag').addEventListener('click', () => {
  const route = routeFromLocation();
  const id = route.replace('product-', '');
  const product = products.find((p) => String(p.id) === String(id));
  if (!product) return;
  const existing = storeState.cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    storeState.cart.push({ ...product, quantity: 1 });
  }
  renderCart();
  showToast(`${product.name} añadido a la bolsa`);
  openCart();
});

document.getElementById('pdp-add-fav').addEventListener('click', (event) => {
  event.preventDefault();
  const btn = document.getElementById('pdp-add-fav');
  const heart = btn.querySelector('.pdp-heart');
  const faved = heart.classList.toggle('faved');
  heart.textContent = faved ? '♥' : '♡';
  btn.childNodes.forEach((node) => { if (node.nodeType === Node.TEXT_NODE) node.textContent = faved ? ' Añadido a Favoritos ' : ' Añadir a Favoritos '; });
  showToast(faved ? 'Añadido a favoritos' : 'Eliminado de favoritos');
});

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

generateBrandFilters();
renderProducts();
loadProducts().finally(() => applyRoute());
