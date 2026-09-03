import { AI_API_URL } from '../../shared/js/api-config.js';

export function initImageUploader({ onDataExtracted } = {}) {
  const form = document.getElementById('uploadForm');
  const imageInput = document.getElementById('imageInput');
  const dropZone = document.getElementById('dropZone');
  const previewContainer = document.getElementById('previewContainer');
  const previewImage = document.getElementById('previewImage');
  const removeButton = document.getElementById('removeBtn');
  const submitButton = document.getElementById('submitBtn');
  const result = document.getElementById('result');
  const progressWrapper = document.getElementById('progressWrapper');
  const progressBar = document.getElementById('progressBar');
  const progressPercentage = document.getElementById('progressPercentage');
  const progressStatus = document.getElementById('progressStatus');

  if (!form || !imageInput || !dropZone) return;

  let selectedFile = null;

  function resetProgress() {
    if (progressWrapper) progressWrapper.style.display = 'none';
    if (progressBar) progressBar.style.width = '0%';
    if (progressPercentage) progressPercentage.textContent = '0%';
    if (progressStatus) progressStatus.textContent = 'Subiendo...';
  }

  function selectFile(file) {
    if (!file?.type.startsWith('image/')) return;
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (event) => {
      previewImage.src = event.target.result;
      dropZone.style.display = 'none';
      previewContainer.style.display = 'block';
      submitButton.disabled = false;
      resetProgress();
    };
    reader.readAsDataURL(file);
  }

  dropZone.addEventListener('click', () => imageInput.click());
  ['dragenter', 'dragover'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
  }));
  dropZone.addEventListener('drop', (event) => selectFile(event.dataTransfer.files[0]));
  imageInput.addEventListener('change', (event) => selectFile(event.target.files[0]));

  removeButton.addEventListener('click', () => {
    selectedFile = null;
    imageInput.value = '';
    previewImage.src = '';
    previewContainer.style.display = 'none';
    dropZone.style.display = 'flex';
    submitButton.disabled = true;
    resetProgress();
    if (result) result.style.display = 'none';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('image', selectedFile);
    submitButton.disabled = true;
    removeButton.style.display = 'none';
    if (result) result.style.display = 'none';
    resetProgress();
    if (progressWrapper) progressWrapper.style.display = 'block';

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (progressEvent) => {
      if (!progressEvent.lengthComputable) return;
      const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
      if (progressBar) progressBar.style.width = `${percentage}%`;
      if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
      if (percentage === 100 && progressStatus) progressStatus.textContent = 'Procesando en servidor...';
    });
    xhr.addEventListener('load', () => {
      removeButton.style.display = 'flex';
      submitButton.disabled = false;
      if (result) result.style.display = 'block';
      if (xhr.status >= 200 && xhr.status < 300) {
        if (progressStatus) progressStatus.textContent = 'Completado';
        try {
          const responseData = JSON.parse(xhr.responseText);
          if (result) result.textContent = JSON.stringify(responseData, null, 2);
          onDataExtracted?.(responseData);
        } catch (error) {
          if (result) result.textContent = xhr.responseText;
        }
      } else {
        if (result) result.textContent = `Error HTTP: ${xhr.status}`;
      }
    });
    xhr.addEventListener('error', () => {
      removeButton.style.display = 'flex';
      submitButton.disabled = false;
      if (result) result.style.display = 'block';
      if (result) result.textContent = 'Error de conexión al intentar enviar la imagen.';
    });
    xhr.open('POST', AI_API_URL);
    xhr.send(formData);
  });

  resetProgress();
}
