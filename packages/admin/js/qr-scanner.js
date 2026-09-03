export function initQrScanner({ onDetected } = {}) {
  const btnStart = document.getElementById('btn-scan') || document.getElementById('btn-start');
  const readerDiv = document.getElementById('reader');
  const barcodeInput = document.getElementById('product-codigo-barras') || document.getElementById('barcode');
  const flashcard = document.getElementById('product-card');
  const scannerModal = document.getElementById('scanner-modal');
  const scannerClose = document.getElementById('scanner-close');
  const scannerHint = document.getElementById('scanner-hint');
  const uploadButton = document.getElementById('scanner-upload');
  const fileInput = document.getElementById('scanner-file');
  const switchButton = document.getElementById('btn-change-camera');

  if (!btnStart || !readerDiv || typeof window.Html5Qrcode !== 'function') {
    return { stop: async () => {}, isActive: () => false };
  }

  let isScanning = false;
  let currentCameraId = null;
  let cameraList = [];
  const html5QrCode = new window.Html5Qrcode('reader');
  const config = { fps: 10 };

  function getPreferredCameraId(cameras) {
    const preferredOrder = ['rear', 'back', 'trasera', 'environment', 'user', 'front', 'frontal', 'selfie'];
    const ranked = [...cameras].sort((first, second) => {
      const firstScore = preferredOrder.findIndex((token) => (first.label || '').toLowerCase().includes(token));
      const secondScore = preferredOrder.findIndex((token) => (second.label || '').toLowerCase().includes(token));
      return (firstScore === -1 ? preferredOrder.length : firstScore)
        - (secondScore === -1 ? preferredOrder.length : secondScore);
    });
    return ranked[0]?.id || cameras[0]?.id || null;
  }

  const defaultHint = scannerHint?.textContent || '';
  function showHint(text, isError = false) {
    if (!scannerHint) return;
    scannerHint.textContent = text;
    scannerHint.classList.toggle('error', isError);
  }
  function openScanner() {
    scannerModal?.removeAttribute('hidden');
    if (uploadButton) uploadButton.style.display = 'inline-block';
    showHint(defaultHint);
    requestAnimationFrame(() => scannerModal?.classList.add('open'));
  }

  function closeScanner() {
    scannerModal?.classList.remove('open');
    scannerModal?.setAttribute('hidden', '');
  }

  function setControlsVisible(visible) {
    if (switchButton) switchButton.style.display = visible && cameraList.length > 1 ? 'block' : 'none';
  }

  async function stop() {
    if (!isScanning) return;
    try {
      await html5QrCode.stop();
    } catch (error) {
      console.error('Error al detener cámara:', error);
    } finally {
      isScanning = false;
      currentCameraId = null;
      setControlsVisible(false);
      if (btnStart) btnStart.disabled = false;
    }
  }

  function handleDetected(decodedText) {
    if (barcodeInput) {
      barcodeInput.value = decodedText;
      barcodeInput.focus();
    }
    flashcard?.classList.remove('flipped');
    closeScanner();
    onDetected?.(decodedText);
    stop();
  }

  async function startCamera(cameraId) {
    openScanner();
    try {
      await html5QrCode.start(cameraId, config, handleDetected, () => {});
      isScanning = true;
      currentCameraId = cameraId;
      setControlsVisible(true);
      btnStart.disabled = true;
    } catch (error) {
      console.error('Error al iniciar cámara:', error);
      showHint('No se pudo acceder a la cámara. Sube una imagen del código en su lugar.', true);
      btnStart.disabled = false;
    }
  }

  async function switchCamera() {
    if (!isScanning || cameraList.length < 2) return;
    const currentIndex = cameraList.findIndex((camera) => camera.id === currentCameraId);
    const nextCamera = cameraList[(currentIndex + 1) % cameraList.length];
    try {
      await html5QrCode.stop();
      isScanning = false;
      await startCamera(nextCamera.id);
    } catch (error) {
      console.error('Error al cambiar cámara:', error);
    }
  }

  btnStart?.addEventListener('click', async () => {
    if (!cameraList.length) return;
    try {
      await startCamera(currentCameraId || getPreferredCameraId(cameraList));
    } catch (error) {
      console.error('Error al iniciar cámara:', error);
    }
  });

  scannerClose?.addEventListener('click', async () => {
    await stop();
    closeScanner();
  });

  switchButton?.addEventListener('click', switchCamera);

  uploadButton?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      await stop();
      showHint('Analizando la imagen…');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleDetected(decodedText);
    } catch (error) {
      console.error('Error al leer la imagen:', error);
      showHint('No se detectó ningún código en la imagen. Prueba con otra foto.', true);
    } finally {
      if (fileInput) fileInput.value = '';
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && scannerModal && !scannerModal.hasAttribute('hidden')) {
      stop();
      closeScanner();
    }
  });

  window.Html5Qrcode.getCameras()
    .then((cameras) => {
      cameraList = cameras || [];
      currentCameraId = getPreferredCameraId(cameraList);
      btnStart.disabled = cameraList.length === 0;
    })
    .catch((error) => {
      console.error('Error al obtener cámaras:', error);
      btnStart.disabled = true;
    });

  return { stop, isActive: () => isScanning };
}
