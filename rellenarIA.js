document.addEventListener("DOMContentLoaded", async () =>   { const form = document.getElementById('uploadForm');
    const imageInput = document.getElementById('imageInput');
    const dropZone = document.getElementById('dropZone');
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    const removeBtn = document.getElementById('removeBtn');
    const submitBtn = document.getElementById('submitBtn');
    const resultDiv = document.getElementById('result');

    const progressWrapper = document.getElementById('progressWrapper');
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressStatus = document.getElementById('progressStatus');

    let selectedFile = null;

    dropZone.addEventListener('click', () => imageInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        handleFileSelect(files[0]);
      }
    });

    imageInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });

    function handleFileSelect(file) {
      selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImage.src = e.target.result;
        dropZone.style.display = 'none';
        previewContainer.style.display = 'block';
        submitBtn.disabled = false;
        resetProgress();
      };
      reader.readAsDataURL(file);
    }

    removeBtn.addEventListener('click', () => {
      selectedFile = null;
      imageInput.value = '';
      previewImage.src = '';
      previewContainer.style.display = 'none';
      dropZone.style.display = 'flex';
      submitBtn.disabled = true;
      resetProgress();
      resultDiv.style.display = 'none';
    });

    function resetProgress() {
      progressWrapper.style.display = 'none';
      progressBar.style.width = '0%';
      progressBar.style.backgroundColor = 'var(--primary)';
      progressPercentage.textContent = '0%';
      progressStatus.textContent = 'Subiendo...';
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!selectedFile) return;

      const formData = new FormData();
      formData.append('image', selectedFile);

      submitBtn.disabled = true;
      removeBtn.style.display = 'none'; // Oculta opción de remover mientras sube
      resultDiv.style.display = 'none';
      
      resetProgress();
      progressWrapper.style.display = 'block';

      const xhr = new XMLHttpRequest();

      // Escuchar eventos de progreso del envío
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          progressBar.style.width = `${percentComplete}%`;
          progressPercentage.textContent = `${percentComplete}%`;

          if (percentComplete === 100) {
            progressStatus.textContent = 'Procesando en servidor...';
          }
        }
      });

      // Manejar respuesta
      xhr.addEventListener('load', () => {
        removeBtn.style.display = 'flex';
        submitBtn.disabled = false;
        resultDiv.style.display = 'block';

        if (xhr.status >= 200 && xhr.status < 300) {
          progressBar.style.backgroundColor = 'var(--success)';
          progressStatus.textContent = 'Completado';
          
          try {
            const data = JSON.parse(xhr.responseText);
            resultDiv.textContent = JSON.stringify(data, null, 2);
          } catch (err) {
            resultDiv.textContent = xhr.responseText;
          }
        } else {
          resultDiv.textContent = `Error HTTP: ${xhr.status}`;
        }
      });

      // Manejar errores de red
      xhr.addEventListener('error', () => {
        removeBtn.style.display = 'flex';
        submitBtn.disabled = false;
        resultDiv.style.display = 'block';
        resultDiv.textContent = 'Error de conexión al intentar enviar la imagen.';
      });

      xhr.open('POST', 'https://api-image-ai-1.onrender.com/extract');
      xhr.send(formData);
    });
})