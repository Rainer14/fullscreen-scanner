import { AI_API_URL } from '../../shared/js/api-config.js';

export function initImageUploader({ onDataExtracted } = {}) {
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
  const toggleButton = document.getElementById('toggle-image-upload');
  const imageUploadBody = document.getElementById('image-upload-body');

  if (!imageInput || !dropZone) return;

  let selectedFile = null;

  function resetProgress() {
    if (progressWrapper) {
      progressWrapper.hidden = true;
      progressBar.style.width = '0%';
    }
    if (progressPercentage) progressPercentage.textContent = '0%';
    if (progressStatus) progressStatus.textContent = 'Subiendo...';
  }

  function selectFile(file) {
    if (!file?.type.startsWith('image/')) return;
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (previewImage) previewImage.src = event.target.result;
      if (dropZone) dropZone.style.display = 'none';
      if (previewContainer) previewContainer.hidden = false;
      if (submitButton) submitButton.disabled = false;
      resetProgress();
    };
    reader.readAsDataURL(file);
  }

  dropZone?.addEventListener('click', () => imageInput.click());
  ['dragenter', 'dragover'].forEach((eventName) => dropZone?.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone?.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach((eventName) => dropZone?.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone?.classList.remove('dragover');
  }));
  dropZone?.addEventListener('drop', (event) => selectFile(event.dataTransfer.files[0]));
  imageInput?.addEventListener('change', (event) => selectFile(event.target.files[0]));

  removeButton?.addEventListener('click', () => {
    selectedFile = null;
    imageInput.value = '';
    if (previewImage) previewImage.src = '';
    if (previewContainer) previewContainer.hidden = true;
    if (dropZone) dropZone.style.display = 'flex';
    if (submitButton) submitButton.disabled = true;
    resetProgress();
    if (result) {
      result.style.display = 'none';
      result.textContent = '';
    }
  });

  submitButton?.addEventListener('click', () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('image', selectedFile);
    if (submitButton) submitButton.disabled = true;
    if (removeButton) removeButton.style.display = 'none';
    if (result) {
      result.style.display = 'block';
      result.textContent = '';
    }
    resetProgress();
    if (progressWrapper) progressWrapper.hidden = false;

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (progressEvent) => {
      if (!progressEvent.lengthComputable) return;
      const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
      if (progressBar) progressBar.style.width = `${percentage}%`;
      if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
      if (percentage === 100 && progressStatus) progressStatus.textContent = 'Procesando en servidor...';
    });
    xhr.addEventListener('load', () => {
      if (removeButton) removeButton.style.display = 'flex';
      if (submitButton) submitButton.disabled = false;
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
      if (removeButton) removeButton.style.display = 'flex';
      if (submitButton) submitButton.disabled = false;
      if (result) result.style.display = 'block';
      if (result) result.textContent = 'Error de conexión al intentar enviar la imagen.';
    });
    xhr.open('POST', AI_API_URL);
    xhr.send(formData);
  });

  toggleButton?.addEventListener('click', () => {
    if (imageUploadBody) imageUploadBody.hidden = !imageUploadBody.hidden;
  });

  resetProgress();
}