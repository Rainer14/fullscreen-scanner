export function initQrScanner({ onDetected } = {}) {
  const btnStart = document.getElementById('btn-start');
  const readerDiv = document.getElementById('reader');
  const barcodeInput = document.getElementById('barcode');
  const flashcard = document.getElementById('product-card');

  if (!btnStart || !readerDiv || typeof window.Html5Qrcode !== 'function') {
    return { stop: async () => {}, isActive: () => false };
  }

  let isScanning = false;
  let currentCameraId = null;
  let cameraList = [];
  const html5QrCode = new window.Html5Qrcode('reader');
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

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

  function setReaderVisible(visible) {
    readerDiv.classList.toggle('scanner-active', visible);
    const closeButton = document.getElementById('btn-close-fallback');
    if (closeButton) closeButton.style.display = visible ? 'block' : 'none';
    const switchButton = document.getElementById('btn-change-camera');
    if (switchButton) switchButton.style.display = visible && cameraList.length > 1 ? 'block' : 'none';
  }

  async function requestFullscreen() {
    for (const method of ['requestFullscreen', 'webkitRequestFullscreen', 'msRequestFullscreen']) {
      if (readerDiv[method]) {
        try {
          await readerDiv[method]();
          return;
        } catch (error) {
          // Use the CSS fallback when native fullscreen is unavailable or denied.
        }
      }
    }
    readerDiv.classList.add('fullscreen-fallback');
    addCloseButton();
  }

  async function exitFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      const method = document.exitFullscreen ? 'exitFullscreen' : 'webkitExitFullscreen';
      if (document[method]) await document[method]();
    }
    setReaderVisible(false);
    readerDiv.classList.remove('fullscreen-fallback');
    const closeButton = document.getElementById('btn-close-fallback');
    if (closeButton) closeButton.style.display = 'none';
  }

  async function stop() {
    if (!isScanning) return;
    try {
      await html5QrCode.stop();
      isScanning = false;
      currentCameraId = null;
      setReaderVisible(false);
      btnStart.disabled = false;
    } catch (error) {
      console.error('Error al detener cámara:', error);
    }
  }

  function handleDetected(decodedText) {
    if (barcodeInput) {
      barcodeInput.value = decodedText;
      barcodeInput.focus();
    }
    flashcard?.classList.add('flipped');
    onDetected?.(decodedText);
    exitFullscreen();
    stop();
  }

  function addCloseButton() {
    let closeButton = document.getElementById('btn-close-fallback');
    if (!closeButton) {
      closeButton = document.createElement('button');
      closeButton.id = 'btn-close-fallback';
      closeButton.className = 'btn-close-fallback';
      closeButton.textContent = '✕ Salir';
      closeButton.addEventListener('click', async () => {
        await exitFullscreen();
        await stop();
      });
      readerDiv.appendChild(closeButton);
    }
    closeButton.style.display = 'block';
  }

  function addCameraSwitchButton() {
    let switchButton = document.getElementById('btn-change-camera');
    if (!switchButton) {
      switchButton = document.createElement('button');
      switchButton.id = 'btn-change-camera';
      switchButton.className = 'btn-change-camera';
      switchButton.textContent = 'Cambiar';
      switchButton.addEventListener('click', switchCamera);
      readerDiv.appendChild(switchButton);
    }
    switchButton.style.display = isScanning && cameraList.length > 1 ? 'block' : 'none';
  }

  async function startCamera(cameraId) {
    await html5QrCode.start(cameraId, config, handleDetected, () => {});
    isScanning = true;
    currentCameraId = cameraId;
    setReaderVisible(true);
    addCloseButton();
    addCameraSwitchButton();
    await requestFullscreen();
    btnStart.disabled = true;
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

  btnStart.addEventListener('click', async () => {
    if (!cameraList.length) return;
    try {
      await startCamera(currentCameraId || getPreferredCameraId(cameraList));
    } catch (error) {
      console.error('Error al iniciar cámara:', error);
    }
  });

  document.addEventListener('fullscreenchange', () => {
    const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement)
      || readerDiv.classList.contains('fullscreen-fallback');
    if (!active && isScanning) stop();
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
