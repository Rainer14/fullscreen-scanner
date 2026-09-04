export function initGalleryManager() {
  const container = document.getElementById('gallery-list');
  const addBtn = document.getElementById('gallery-add');
  if (!container || !addBtn) return null;

  function createRow(url = '') {
    const row = document.createElement('div');
    row.className = 'gallery-row';
    row.innerHTML = `
      <input type="url" class="gallery-url" placeholder="https://imagen..." value="${escapeAttr(url)}">
      <button type="button" class="gallery-row-remove" aria-label="Quitar imagen">&times;</button>
    `;
    row.querySelector('.gallery-row-remove').addEventListener('click', () => {
      row.remove();
      if (!container.children.length) container.hidden = true;
    });
    return row;
  }

  addBtn.addEventListener('click', () => {
    container.appendChild(createRow());
    container.hidden = false;
    container.lastElementChild.querySelector('input').focus();
  });

  return {
    getUrls() {
      return Array.from(container.querySelectorAll('.gallery-url'))
        .map((input) => input.value.trim())
        .filter(Boolean);
    },

    setUrls(urls) {
      container.innerHTML = '';
      (Array.isArray(urls) ? urls : []).forEach((url) => container.appendChild(createRow(url)));
      container.hidden = !container.children.length;
    },

    reset() {
      container.innerHTML = '';
      container.hidden = true;
    }
  };
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
