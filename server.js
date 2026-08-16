const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const dataFilePath = path.join(__dirname, 'qr-data.json');

function loadLastQrResult() {
  try {
    const raw = fs.readFileSync(dataFilePath, 'utf8');
    if (!raw.trim()) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed && parsed.text ? parsed : null;
  } catch (error) {
    return null;
  }
}

function saveLastQrResult(result) {
  fs.writeFileSync(dataFilePath, JSON.stringify(result, null, 2));
}

let lastQrResult = loadLastQrResult();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API funcionando',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    app: 'fullscreen-potente',
    environment: 'development',
    port,
    url: `http://localhost:${port}`
  });
});

app.get('/api/qr/latest', (req, res) => {
  if (!lastQrResult) {
    return res.status(404).json({ ok: false, message: 'No hay resultado QR registrado aún.' });
  }

  res.json({ ok: true, result: lastQrResult });
});

app.post('/api/qr', (req, res) => {
  const { text } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ ok: false, message: 'Se requiere un texto QR válido.' });
  }

  const normalizedText = text.trim();
  lastQrResult = {
    text: normalizedText,
    timestamp: new Date().toISOString()
  };

  saveLastQrResult(lastQrResult);

  res.json({
    ok: true,
    message: 'QR recibido correctamente',
    result: lastQrResult
  });
});

app.listen(port, 'localhost', () => {
  console.log(`Servidor Express corriendo en http://localhost:${port}`);
  console.log('Endpoints:');
  console.log(`- GET /`);
  console.log(`- GET /api/health`);
  console.log(`- GET /api/info`);
  console.log(`- POST /api/qr`);
  console.log(`- GET /api/qr/latest`);
});
