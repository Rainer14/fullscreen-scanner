let toastEl = null;

function ensureToast() {
  if (!toastEl) {
    toastEl = document.getElementById('toast');
  }
  return toastEl;
}

export function showToast(message) {
  const toast = ensureToast();
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
}
