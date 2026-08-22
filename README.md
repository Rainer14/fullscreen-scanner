# Fullscreen Potente

App web con escáner QR y modo de pantalla completa, servida con Express.

## Requisitos

- Node.js 18 o superior

## Instalación

```bash
npm install
```

## Ejecutar

Modo normal:

```bash
npm start
```

Modo desarrollo con recarga automática:

```bash
npm run dev
```

Abrir en el navegador:

```text
http://localhost:3000
```

## Endpoints

- `/` → página principal
- `/api/health` → estado del servidor
- `/api/info` → información de la app
- `/api/qr` → registra un código QR mediante `POST` con `{ "text": "..." }`
- `/api/qr/latest` → devuelve el último código QR registrado

## Arquitectura

El backend está organizado por responsabilidades dentro de `src/`:

- `config/` configura rutas y entorno.
- `models/` encapsula la persistencia en `qr-data.json`.
- `services/` contiene las reglas de negocio del QR.
- `controllers/` traduce solicitudes HTTP a respuestas.
- `routes/` declara los endpoints.
- `app.js` compone Express sin abrir el puerto; `server.js` solo inicia el servidor.

Pruebas:

```bash
npm test
```

## API de productos

La URL para registrar productos se configura en `frontend/apiConfig.js`:

```javascript
export const PRODUCT_API_URL = 'https://tu-api.com/products';
```

El formulario enviará un `POST` con los campos `description`, `codigo`, `categoria`, `detal`, `mayor`, `marca`, `origen` y `barcode`. La respuesta debe tener un estado HTTP `2xx` para limpiar el formulario.
