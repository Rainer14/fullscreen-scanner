import { money } from '../../shared/js/money.js';
import { showToast } from '../../shared/js/toast.js';

const SESSION_WINDOW_MS = 30 * 60 * 1000;
const SESSION_MAX_EVENTS = 50;

let currentUserId = localStorage.getItem('lumen_user_id');
if (!currentUserId) {
  currentUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  localStorage.setItem('lumen_user_id', currentUserId);
}

export const storeState = {
  category: 'todos',
  query: '',
  sort: 'featured',
  cart: [],
  priceRanges: [],
  brands: [],
  session: {
    viewedProducts: [],
    clickedProducts: [],
    purchasedProducts: []
  }
};

export function trackInteraction(productId, eventType) {
  const targetMap = {
    view: storeState.session.viewedProducts,
    click: storeState.session.clickedProducts,
    purchase: storeState.session.purchasedProducts
  };
  const target = targetMap[eventType];
  if (!target) return;
  cleanSessionData();
  target.unshift({ id: productId, timestamp: new Date().toISOString(), userId: currentUserId });
  if (target.length > SESSION_MAX_EVENTS) target.pop();
}

export function trackView(productId) { trackInteraction(productId, 'view'); }
export function trackClick(productId) { trackInteraction(productId, 'click'); }
export function trackPurchase(productId) { trackInteraction(productId, 'purchase'); }

function cleanSessionData() {
  const now = Date.now();
  Object.keys(storeState.session).forEach((key) => {
    storeState.session[key] = storeState.session[key].filter(
      (item) => now - new Date(item.timestamp).getTime() <= SESSION_WINDOW_MS
    );
  });
}

setInterval(cleanSessionData, 60000);

export function renderCart() {
  const count = storeState.cart.reduce((total, item) => total + item.quantity, 0);
  const total = storeState.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById('cart-count').textContent = count;
  document.getElementById('drawer-count').textContent = `(${count})`;
  document.getElementById('cart-total').textContent = money(total);
  document.getElementById('cart-items').innerHTML = storeState.cart.length
    ? storeState.cart.map((item) => `<div class="cart-line"><img src="${item.image}" alt="" onerror="this.style.display='none'"><div><strong>${item.name}</strong><br><small>${item.quantity} × ${money(item.price)}</small><br><button class="remove-item" data-remove="${item.id}">Eliminar</button></div><strong>${money(item.price * item.quantity)}</strong></div>`).join('')
    : '<p class="empty-state">Tu bolsa está esperando algo especial.</p>';
}

export function addToCart(product) {
  const existing = storeState.cart.find((item) => item.id === product.id);
  if (existing) existing.quantity += 1;
  else storeState.cart.push({ ...product, quantity: 1 });
  renderCart();
  showToast(`${product.name} se añadió a tu bolsa`);
}

export function removeFromCart(productId) {
  storeState.cart = storeState.cart.filter((item) => String(item.id) !== String(productId));
  renderCart();
}

export function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('cart-drawer').setAttribute('aria-hidden', 'false');
}

export function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('cart-drawer').setAttribute('aria-hidden', 'true');
}

export function initCart() {
  document.getElementById('cart-toggle').addEventListener('click', openCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('drawer-overlay').addEventListener('click', closeCart);
  document.getElementById('checkout-button').addEventListener('click', () => {
    if (!storeState.cart.length) showToast('Añade un producto antes de finalizar');
    else showToast('Checkout listo para conectar con tu pasarela');
  });

  document.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove]');
    if (removeButton) removeFromCart(removeButton.dataset.remove);
  });

  renderCart();
}
