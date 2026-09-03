import { loadProducts, getProducts } from './js/api.js';
import { storeState, initCart, renderCart, addToCart, openCart } from './js/cart.js';
import { renderProducts, generateBrandFilters, selectCategory, initFilters, categoryNames } from './js/catalog.js';
import { renderProductDetail, initPdp, initRouter } from './js/pdp.js';
import { showToast } from '../shared/js/toast.js';
import { money } from '../shared/js/money.js';

const grid = document.getElementById('product-grid');
const resultCount = document.getElementById('result-count');
const filterCountEl = document.getElementById('filter-count');
const brandFiltersEl = document.getElementById('brand-filters');
const catalogStatus = document.getElementById('catalog-status');
const siteHeaderEl = document.getElementById('site-header');
const pdpSection = document.getElementById('product-detail');
const mobileMenu = document.getElementById('mobile-menu');
const menuToggle = document.getElementById('menu-toggle');

function render() {
  renderProducts(getProducts(), storeState, grid, resultCount, filterCountEl);
}

function routeFromLocation() {
  return window.location.hash.replace(/^#\/?/, '').split('?')[0] || 'inicio';
}

function navigateTo(category) {
  const nextHash = category === 'inicio' ? '#inicio' : `#${category}`;
  if (window.location.hash !== nextHash) window.history.pushState({ category }, '', nextHash);
  applyRoute();
}

initRouter(navigateTo);

function hideProductDetail() {
  pdpSection.hidden = true;
  document.getElementById('inicio').hidden = false;
}

function showProductDetail(productId) {
  closeMobileMenu();
  document.getElementById('inicio').hidden = true;
  pdpSection.hidden = false;
  document.body.dataset.route = 'producto';
  window.scrollTo({ top: 0 });
  renderProductDetail(getProducts(), productId);
}

function applyRoute() {
  const route = routeFromLocation();
  hideProductDetail();
  if (route.startsWith('product-')) {
    const productId = route.replace('product-', '');
    showProductDetail(productId);
    return;
  }
  const routeCategories = new Set(['todos', 'escolar', 'belleza', 'hogar', 'tecnologia', 'variados']);
  const category = routeCategories.has(route) ? route : 'todos';
  selectCategory(category, storeState, render);
  if (route === 'catalogo' || routeCategories.has(route)) {
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  mobileMenu.inert = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

function openMobileMenu() {
  mobileMenu.classList.add('open');
  mobileMenu.setAttribute('aria-hidden', 'false');
  mobileMenu.inert = false;
  menuToggle.setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-open');
  mobileMenu.querySelector('a')?.focus();
}

menuToggle.addEventListener('click', () => (mobileMenu.classList.contains('open') ? closeMobileMenu() : openMobileMenu()));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileMenu.classList.contains('open')) closeMobileMenu();
});

document.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add]');
  const productCard = event.target.closest('#product-grid .product-card');
  if (addButton) {
    const product = getProducts().find((item) => String(item.id) === addButton.dataset.add);
    if (product) addToCart(product);
  }
  if (productCard && !addButton) {
    navigateTo(`product-${productCard.dataset.id}`);
    return;
  }
  const navLink = event.target.closest('[data-nav]');
  if (navLink) {
    navigateTo(navLink.dataset.nav);
    closeMobileMenu();
  }
});

document.getElementById('pdp-add-bag').addEventListener('click', () => {
  const route = routeFromLocation();
  const id = route.replace('product-', '');
  const product = getProducts().find((p) => String(p.id) === String(id));
  if (product) {
    addToCart(product);
    openCart();
  }
});

document.getElementById('sort-select').addEventListener('change', (event) => {
  storeState.sort = event.target.value;
  render();
});

const updateHeaderShadow = () => siteHeaderEl.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', updateHeaderShadow, { passive: true });
updateHeaderShadow();

initCart();
initFilters(storeState, render);
initPdp();
generateBrandFilters(getProducts(), brandFiltersEl);
render();

loadProducts({
  onProductsLoaded: () => {
    render();
    generateBrandFilters(getProducts(), brandFiltersEl);
    if (catalogStatus) catalogStatus.textContent = 'Catálogo actualizado.';
  },
  onError: () => {
    showToast('No se pudo conectar a la API; mostrando catálogo local.');
  }
}).finally(() => applyRoute());

window.addEventListener('popstate', applyRoute);
window.addEventListener('hashchange', applyRoute);
