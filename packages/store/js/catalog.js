import { money } from '../../shared/js/money.js';

const categoryNames = {
  escolar: 'Escolar',
  belleza: 'Belleza',
  hogar: 'Hogar',
  tecnologia: 'Tecnología',
  variados: 'Variados'
};

export { categoryNames };

export function renderProducts(products, storeState, grid, resultCount, filterCountEl) {
  const visible = products
    .filter((product) => storeState.category === 'todos' || product.category === storeState.category)
    .filter((product) => {
      if (!storeState.query) return true;
      return `${product.name} ${product.category} ${product.marca || ''}`.toLowerCase().includes(storeState.query.toLowerCase());
    })
    .filter((product) => {
      if (!storeState.priceRanges.length) return true;
      const price = product.price || product.detal || 0;
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

  if (storeState.sort === 'low') visible.sort((a, b) => (a.price || a.detal || 0) - (b.price || b.detal || 0));
  if (storeState.sort === 'high') visible.sort((a, b) => (b.price || b.detal || 0) - (a.price || a.detal || 0));
  if (storeState.sort === 'az') visible.sort((a, b) => a.name.localeCompare(b.name));

  resultCount.textContent = `${visible.length} ${visible.length === 1 ? 'producto' : 'productos'}`;

  const activeFilters = (storeState.priceRanges.length || storeState.brands.length)
    ? storeState.priceRanges.length + storeState.brands.length
    : 0;

  if (activeFilters > 0) {
    filterCountEl.textContent = activeFilters;
    filterCountEl.hidden = false;
  } else {
    filterCountEl.hidden = true;
  }

  grid.innerHTML = visible.length
    ? visible.map((product) => `<article class="product-card" data-id="${product.id}"><div class="product-image"><span class="product-badge">${product.label}</span>${product.image ? `<img class="lazy-image" src="${product.image}" alt="${product.name}" loading="lazy" decoding="async" onload="this.classList.add('is-loaded')" onerror="this.style.display='none'">` : `<span class="product-placeholder">${product.name.charAt(0)}</span>`}<button class="quick-add" data-add="${product.id}">Añadir +</button></div><div class="product-info"><span class="product-category">${categoryNames[product.category] || product.category}</span><h3 class="product-name">${product.name}</h3>${product.marca ? `<p class="product-brand">${product.marca}</p>` : ''}<div class="product-prices"><span class="price-detal">${money(product.price)}</span></div></div></article>`).join('')
    : '<p class="empty-state">No encontramos piezas con esa búsqueda. Prueba otra palabra.</p>';
}

export function generateBrandFilters(products, brandFiltersEl) {
  const brands = [...new Set(products.map((p) => p.marca).filter(Boolean))].sort();
  brandFiltersEl.innerHTML = brands.length
    ? brands.map((brand) => `<label class="filter-option"><input type="checkbox" name="filter-brand" value="${brand}"> <span>${brand}</span></label>`).join('')
    : '<p class="filter-empty">No hay marcas disponibles</p>';
}

export function selectCategory(category, storeState, renderCallback) {
  storeState.category = category;
  document.body.dataset.section = category;
  document.querySelectorAll('[data-category]').forEach((button) => button.classList.toggle('active', button.dataset.category === category));
  document.querySelectorAll('[data-nav]').forEach((link) => link.classList.toggle('active', link.dataset.nav === category));
  const categoryRadio = document.querySelector(`input[name="filter-category"][value="${category}"]`);
  if (categoryRadio) categoryRadio.checked = true;
  const catalogTitle = document.getElementById('catalog-title');
  if (catalogTitle) catalogTitle.textContent = category === 'todos' ? 'Todos' : (categoryNames[category] || category);
  renderCallback?.();
}

export function openFilters() {
  document.getElementById('filter-sidebar').classList.add('open');
  document.getElementById('filter-overlay').classList.add('open');
  document.getElementById('filter-toggle').setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

export function closeFilters() {
  document.getElementById('filter-sidebar').classList.remove('open');
  document.getElementById('filter-overlay').classList.remove('open');
  document.getElementById('filter-toggle').setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

export function applyFilters(storeState, renderCallback) {
  const checkedPrices = [...document.querySelectorAll('input[name="filter-price"]:checked')].map((el) => el.value);
  const checkedBrands = [...document.querySelectorAll('input[name="filter-brand"]:checked')].map((el) => el.value);
  storeState.priceRanges = checkedPrices;
  storeState.brands = checkedBrands;
  const checkedCategory = document.querySelector('input[name="filter-category"]:checked');
  if (checkedCategory) storeState.category = checkedCategory.value;
  renderCallback?.();
  closeFilters();
}

export function clearFilters(storeState, renderCallback) {
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
  renderCallback?.();
}

export function initFilters(storeState, renderCallback) {
  document.getElementById('filter-toggle').addEventListener('click', openFilters);
  document.getElementById('filter-close').addEventListener('click', closeFilters);
  document.getElementById('filter-overlay').addEventListener('click', closeFilters);
  document.getElementById('filter-apply').addEventListener('click', () => applyFilters(storeState, renderCallback));
  document.getElementById('filter-clear').addEventListener('click', () => clearFilters(storeState, renderCallback));
  document.querySelectorAll('input[name="filter-category"]').forEach((radio) => {
    radio.addEventListener('change', () => applyFilters(storeState, renderCallback));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('filter-sidebar').classList.contains('open')) closeFilters();
  });
}
