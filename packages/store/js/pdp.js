import { money } from '../../shared/js/money.js';
import { trackView, trackClick } from './cart.js';
import { categoryNames } from './catalog.js';

let navigateTo;

export function initRouter(navigateFn) {
  navigateTo = navigateFn;
}

export function renderProductDetail(products, productId) {
  const product = products.find((p) => String(p.id) === String(productId));
  if (!product) {
    navigateTo('catalogo');
    return;
  }

  trackView(productId);

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
  detailsWrap.innerHTML = details.length
    ? `<ul class="pdp-details-list">${details.join('')}</ul>`
    : '<p>Información detallada no disponible.</p>';

  renderPdpGallery(product);
  renderPdpColors(product);
  renderPdpSizes(product);
  renderPdpRelated(products, product);
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
      colorName.textContent = colors[sw.dataset.index].name;
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
      sizeName.textContent = sizes[btn.dataset.index];
      container.querySelectorAll('.pdp-size-button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

export function renderPdpRelated(products, product) {
  const related = getRelatedProductsHybrid(product, products);
  const gridEl = document.getElementById('pdp-related-grid');
  gridEl.innerHTML = related.map((p) => `
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
      trackClick(card.dataset.id);
      navigateTo(`product-${card.dataset.id}`);
      card.blur();
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
}

export function getRelatedProductsHybrid(product, allProducts, options = {}) {
  const maxItems = options.maxItems || 4;
  const contentFactors = options.contentFactors || ['category', 'brand', 'price'];

  const contentScores = computeContentScores(product, allProducts, contentFactors);

  const results = [];
  const usedIds = new Set();
  contentScores.forEach(({ product: p, score }) => {
    if (p.id !== product.id && score > 0 && results.length < maxItems) {
      results.push(p);
      usedIds.add(String(p.id));
    }
  });

  allProducts.forEach((p) => {
    if (results.length >= maxItems) return;
    if (String(p.id) === String(product.id) || usedIds.has(String(p.id))) return;
    results.push(p);
    usedIds.add(String(p.id));
  });

  return results.slice(0, maxItems);
}

function computeContentScores(product, allProducts, factors) {
  return allProducts
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let matchCount = 0;
      if (factors.includes('category') && p.category === product.category) matchCount++;
      if (factors.includes('brand') && p.marca && p.marca === product.marca) matchCount++;
      if (factors.includes('price')) {
        const p1 = product.price || product.detal || 0;
        const p2 = p.price || p.detal || 0;
        if (p1 > 0 && p2 > 0 && Math.abs(p1 - p2) / Math.max(p1, p2) < 0.5) matchCount++;
      }
      if (factors.includes('colors')) {
        const p1Colors = new Set((product.colors || []).map((c) => c.hex));
        const p2Colors = new Set((p.colors || []).map((c) => c.hex));
        if ([...p1Colors].some((hex) => p2Colors.has(hex))) matchCount++;
      }
      if (factors.includes('materials')) {
        const p1Mats = new Set((product.materials || '').split(/\s*,\s*/).filter(Boolean));
        const p2Mats = new Set((p.materials || '').split(/\s*,\s*/).filter(Boolean));
        if ([...p1Mats].some((mat) => p2Mats.has(mat))) matchCount++;
      }
      return { product: p, score: factors.length ? matchCount / factors.length : 0 };
    })
    .sort((a, b) => b.score - a.score);
}

export function initPdp() {
  document.querySelectorAll('.pdp-section-header').forEach((header) => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const expanded = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', String(!expanded));
      body.hidden = expanded;
      header.querySelector('span').textContent = expanded ? '+' : '−';
    });
  });

  document.getElementById('pdp-add-fav').addEventListener('click', (event) => {
    event.preventDefault();
    const btn = document.getElementById('pdp-add-fav');
    const heart = btn.querySelector('.pdp-heart');
    const faved = heart.classList.toggle('faved');
    heart.textContent = faved ? '♥' : '♡';
    btn.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) node.textContent = faved ? ' Añadido a Favoritos ' : ' Añadir a Favoritos ';
    });
  });
}