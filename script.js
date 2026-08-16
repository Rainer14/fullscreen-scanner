document.addEventListener("DOMContentLoaded", async () => {
  const btnStart = document.getElementById("btn-start");
//   const resultContainer = document.getElementById("result");
  const readerDiv = document.getElementById("reader");
  const barcodePreview = document.getElementById('barcode-preview');
  const barcodeInput = document.getElementById('barcode');
  let isScanning = false;
  let cameraActive = false;
  let currentCameraId = null;
  let cameraList = [];



// new script.js
  const form = document.getElementById('product-form')
  const flashcard = document.getElementById('product-card')
  const openBackButton = document.getElementById('open-back-btn')
  const backToFrontButtons = document.querySelectorAll('#back-to-front-btn, #back-to-front-btn-copy')


  function flipCard () {
    flashcard.classList.add('flipped')
  }

  function unflipCard () {
    flashcard.classList.remove('flipped')
  }

  openBackButton.addEventListener('click', flipCard)
  backToFrontButtons.forEach(button => button.addEventListener('click', unflipCard))

  form.addEventListener('submit', event => {
    event.preventDefault()
    clearErrors()

    let isValid = true
    const requiredFields = [
      { id: 'description', message: 'La descripción es obligatoria.' },
      { id: 'codigo', message: 'El código es obligatorio.' }
    ]

    requiredFields.forEach(field => {
      const input = document.getElementById(field.id)
      if (input && input.value.trim() === '') {
        showError(input, field.message)
        isValid = false
      }
    })

    const barcode = document.getElementById('barcode').value.trim()
    if (barcode === '') {
      const barcodeField = document.getElementById('barcode')
      if (barcodeField) {
        showError(barcodeField, 'El código de barras es obligatorio.')
      }
      isValid = false
      flipCard()
    }

    const detal = document.getElementById('detal')
    if (detal && detal.value.trim() !== '' && isNaN(detal.value)) {
      showError(detal, 'Precio Detal debe ser un número.')
      isValid = false
    }

    const mayor = document.getElementById('mayor')
    if (mayor && mayor.value.trim() !== '' && isNaN(mayor.value)) {
      showError(mayor, 'Precio Mayor debe ser un número.')
      isValid = false
    }

    if (!isValid) {
      return
    }

    const formData = {
      description: document.getElementById('description')?.value.trim(),
      codigo: document.getElementById('codigo')?.value.trim(),
      categoria: document.getElementById('categoria')?.value.trim(),
      detal: document.getElementById('detal')?.value.trim(),
      mayor: document.getElementById('mayor')?.value.trim(),
      marca: document.getElementById('marca')?.value.trim(),
      origen: document.getElementById('origen')?.value.trim(),
      barcode
    }

    console.log('Formulario enviado', formData)
    alert('Producto registrado con éxito. Revisa la consola para ver los datos.')
    form.reset()
    if (barcodePreview) {
      barcodePreview.hidden = true
    }
    if (cameraActive) {
        exitFullscreenFlow();
        stopScannerAndReset();
    }
  })

  function showError (inputElement, message) {
    inputElement.style.borderColor = '#ef4444'
    inputElement.style.backgroundColor = '#fef2f2'

    const errorSpan = document.createElement('span')
    errorSpan.className = 'error-message'
    errorSpan.innerText = message
    inputElement.parentNode.appendChild(errorSpan)
  }

  function clearErrors () {
    document.querySelectorAll('.error-message').forEach(error => error.remove())
    document.querySelectorAll('input, select, textarea').forEach(input => {
      input.style.borderColor = ''
      input.style.backgroundColor = ''
    })
  }





// end of new script.js








  function getPreferredCameraId(cameras) {
    if (!cameras || !cameras.length) return null;

    const preferredOrder = [
      'rear', 'back', 'trasera', 'environment', 'user', 'front', 'frontal', 'selfie'
    ];

    const ranked = [...cameras].sort((a, b) => {
      const aLabel = (a.label || '').toLowerCase();
      const bLabel = (b.label || '').toLowerCase();
      const aScore = preferredOrder.findIndex((token) => aLabel.includes(token));
      const bScore = preferredOrder.findIndex((token) => bLabel.includes(token));

      const safeA = aScore === -1 ? preferredOrder.length : aScore;
      const safeB = bScore === -1 ? preferredOrder.length : bScore;
      return safeA - safeB;
    });

    return ranked[0]?.id || cameras[0].id;
  }

  function setReaderVisible(visible) {
    readerDiv.classList.toggle("scanner-active", visible);

    const closeBtn = document.getElementById('btn-close-fallback');
    if (closeBtn) {
      closeBtn.style.display = visible ? 'block' : 'none';
    }

    const switchBtn = document.getElementById('btn-change-camera');
    if (switchBtn) {
      switchBtn.style.display = visible && cameraList.length > 1 ? 'block' : 'none';
    }
  }

  function stopScannerAndReset() {
    if (!isScanning) return;

    html5QrCode.stop().then(() => {
      isScanning = false;
      cameraActive = false;
      currentCameraId = null;
      setReaderVisible(false);
      btnStart.disabled = false;
    //   resultContainer.innerHTML = "<span>Cámara detenida.</span>";
    }).catch((err) => {
      console.error("Error al detener cámara:", err);
    });
  }

  function stopCamera() {
    if (!cameraActive) return;
    stopScannerAndReset();
  }

  function handleDetectedQr(decodedText) {
    if (barcodeInput) {
      barcodeInput.value = decodedText;
      barcodeInput.focus();
    }

    if (flashcard) {
      flashcard.classList.add('flipped');
    }

    if (cameraActive) {
      exitFullscreenFlow();
      stopScannerAndReset();
    }
  }

  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    // resultContainer.innerHTML = `<span>API: ${data.status} · ${data.message}</span>`;
  } catch (error) {
    console.log( "Error al verificar la API:", error);  
    // resultContainer.innerHTML = '<span>API no disponible.</span>';
  }

  // Instancia principal de la clase avanzada
  const html5QrCode = new Html5Qrcode("reader");

  // 1. Cargar la lista de cámaras al iniciar
  try {
    cameraList = (await Html5Qrcode.getCameras()) || [];
    currentCameraId = getPreferredCameraId(cameraList);
    btnStart.disabled = cameraList.length === 0;
    if (cameraList.length === 0) {
      // resultContainer.innerHTML = "<span>No se encontraron cámaras disponibles.</span>";
    }
  } catch (err) {
    console.error("Error al obtener cámaras:", err);
    // resultContainer.innerHTML = "<span>Error de permisos de cámara.</span>";
    btnStart.disabled = true;
  }

  // 2. Función unificada para solicitar Fullscreen (Nativo o CSS)
  async function requestFullscreenFlow() {
    // Intentar API Nativa
    if (readerDiv.requestFullscreen) {
      try { await readerDiv.requestFullscreen(); return; } catch (e) {}
    } else if (readerDiv.webkitRequestFullscreen) {
      try { await readerDiv.webkitRequestFullscreen(); return; } catch (e) {}
    } else if (readerDiv.msRequestFullscreen) {
      try { await readerDiv.msRequestFullscreen(); return; } catch (e) {}
    }

    // Fallback CSS si la API nativa no responde (ej. iOS/Safari)
    readerDiv.classList.add("fullscreen-fallback");
    addFallbackCloseButton();
  }

  // 3. Función para salir de Fullscreen
  async function exitFullscreenFlow() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
    }
    setReaderVisible(false);
    readerDiv.classList.remove("fullscreen-fallback");
    const closeBtn = document.getElementById("btn-close-fallback");
    if (closeBtn) closeBtn.style.display = "none";
  }

  // Botón flotante para salir del modo fullscreen y detener la cámara
  function addFallbackCloseButton() {
    let closeBtn = document.getElementById("btn-close-fallback");
    if (!closeBtn) {
      closeBtn = document.createElement("button");
      closeBtn.id = "btn-close-fallback";
      closeBtn.className = "btn-close-fallback";
      closeBtn.textContent = "✕ Salir";
      closeBtn.addEventListener("click", () => {
        exitFullscreenFlow();
        stopScannerAndReset();
      });
      readerDiv.appendChild(closeBtn);
    }
    closeBtn.style.display = "block";
  }

  function addCameraSwitchButton() {
    let switchBtn = document.getElementById('btn-change-camera');
    if (!switchBtn) {
      switchBtn = document.createElement('button');
      switchBtn.id = 'btn-change-camera';
      switchBtn.className = 'btn-change-camera';
      switchBtn.textContent = 'Cambiar';
      switchBtn.addEventListener('click', async () => {
        if (!isScanning || cameraList.length < 2) return;

        const currentIndex = cameraList.findIndex((device) => device.id === currentCameraId);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % cameraList.length : 0;
        const nextCamera = cameraList[nextIndex];

        try {
          await html5QrCode.stop();
          currentCameraId = nextCamera.id;

          await html5QrCode.start(
            nextCamera.id,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
              handleDetectedQr(decodedText);

              try {
                const response = await fetch('/api/qr', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: decodedText })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Error al enviar el QR');

              } catch (error) {
                console.log('Error al enviar el QR:', error);
              }
            },
            () => {}
          );

          setReaderVisible(true);
          addFallbackCloseButton();
          addCameraSwitchButton();
        } catch (err) {
          console.error('Error al cambiar cámara:', err);
        }
      });
      readerDiv.appendChild(switchBtn);
    }
    switchBtn.style.display = isScanning && cameraList.length > 1 ? 'block' : 'none';
  }

  // 4. Iniciar cámara y activar Fullscreen automáticamente
  btnStart.addEventListener("click", () => {
    if (!cameraList.length) return;

    const selectedCameraId = currentCameraId || getPreferredCameraId(cameraList) || cameraList[0].id;
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    };

    html5QrCode.start(
      selectedCameraId,
      config,
      async (decodedText) => {
        handleDetectedQr(decodedText);

        try {
          const response = await fetch('/api/qr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: decodedText })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Error al enviar el QR');
          }

        //   resultContainer.innerHTML = `
        //     <p style="color: #4ade80; margin: 0 0 5px 0;"><strong>¡Código Detectado!</strong></p>
        //     <span>${data.result.text}</span>
        //     <p style="margin: 8px 0 0 0; font-size: 0.8rem; color: #94a3b8;">Enviado a la API: ${new Date(data.result.timestamp).toLocaleString()}</p>
        //   `;
        } catch (error) {
        //   resultContainer.innerHTML = `
        //     <p style="color: #fca5a5; margin: 0 0 5px 0;"><strong>Error</strong></p>
        //     <span>${error.message}</span>
        //   `;
        }
      },
      () => {
        // Ignorar lecturas fallidas por fotograma
      }
    ).then(() => {
      isScanning = true;
      cameraActive = true;
      currentCameraId = selectedCameraId;
      setReaderVisible(true);
      addFallbackCloseButton();
      addCameraSwitchButton();
      requestFullscreenFlow();
      btnStart.disabled = true;
    }).catch((err) => {
    //   resultContainer.textContent = `Error al iniciar cámara: ${err}`;
    });
  });

  document.addEventListener("fullscreenchange", () => {
    const isFullscreenActive = !!document.fullscreenElement ||
      !!document.webkitFullscreenElement ||
      readerDiv.classList.contains("fullscreen-fallback");

    if (!isFullscreenActive && isScanning) {
      stopScannerAndReset();
    }
  });
});
