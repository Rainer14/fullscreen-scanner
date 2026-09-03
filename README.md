# Fullscreen Potente — Lumen

Aplicación **decoupled / Jamstack**: la tienda online, el panel de administración y los recursos compartidos viven en **proyectos independientes** dentro de `packages/`, servidos por un backend Express mínimo.

## Requisitos

- Node.js 18 o superior

## Estructura

```
fullscreen-scanner/
├── server.js                       # Arranca el servidor Express
└── src/                            # Backend (Express MVC)
    ├── app.js                      # Composición + sirve store y admin
    ├── config/appConfig.js         # Config de rutas y puerto
    ├── controllers/                # Capa HTTP
    ├── models/                     # Persistencia QR
    ├── services/                   # Reglas de negocio QR
    └── routes/                     # Endpoints /api/*
└── packages/                       # FRONTENDS INDEPENDIENTES
    ├── shared/                     # Utilidades y estilos compartidos
    │   └── js/ (api-config, money, normalize, toast)
    │   └── styles/ (base.css, components.css)
    ├── store/                      # TIENDA ONLINE (solo cliente)
    │   ├── index.html
    │   ├── app.js                  # Punto de entrada tienda
    │   ├── js/ (api, cart, catalog, pdp)
    │   └── styles/store.css
    └── admin/                      # PANEL DE ADMINISTRACIÓN (solo cliente)
        ├── index.html
        ├── app.js                  # Punto de entrada admin
        ├── js/ (products, form-controller, image-uploader, qr-scanner, ...)
        └── styles/ (admin.css, uploader.css)
```

Cada paquete es un **frontend estático independiente** y puede desplegarse por separado (GitHub Pages, Vercel, Netlify, etc.). Comparten código a través del paquete `shared/`.

## Instalación

```bash
npm install
```

## Ejecutar (local)

```bash
npm start          # producción
npm run dev        # desarrollo con recarga (nodemon)
```

Abrir en el navegador:

| URL          | Descripción                     |
|--------------|---------------------------------|
| `/`          | Tienda online (URL canónica)    |
| `/admin`     | Panel de administración         |

La tienda tiene una **única URL canónica** (`/`). La antigua ruta `/store` redirige a `/` para no duplicar contenido.

## Endpoints

- `/` → tienda online (URL canónica; `/store` redirige aquí)
- `/admin` → panel de administración
- `/api/health` → estado del servidor
- `/api/info` → información de la app
- `/api/qr` → registra un código QR mediante `POST` con `{ "text": "..." }`
- `/api/qr/latest` → devuelve el último código QR registrado

## Arquitectura backend

Dentro de `src/`:

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

## Despliegue decoupled (Jamstack)

Los paquetes de frontend no requieren build: se publican tal cual como sitio estático,
siempre que el backend Express sirva `/api/*` (SQLite) y las rutas `/`, `/admin` y `/shared/*`.

En `packages/shared/js/api-config.js`:

```javascript
export const PRODUCT_API_URL = '/api/products';       // backend local Express (SQLite)
export const AI_API_URL = 'https://api-gemini-ru4e.onrender.com/extract';
```

`PRODUCT_API_URL` apunta al backend Express del mismo origen. Si despliegas la tienda/admin
en un host distinto al backend, configura aquí la URL completa del backend (p. ej.
`https://tu-backend/api/products`).

## API de productos

La base de datos es **SQLite** (archivo local `data/lumen.db`, ignorado por git). La tienda
solo puede **leer** productos (`GET`); el panel de administración puede **crear, modificar y
eliminar** (`POST`, `PUT`, `DELETE`) enviando el token en la cabecera `x-admin-token`.

El `POST` del admin acepta los campos `descripcion`, `codigo`, `categoria`, `precioDetal`,
`precioMayor`, `marca`, `origen` y `codigoBarras`. Los precios se envían como números. La
respuesta debe tener un estado HTTP `2xx` para limpiar el formulario.

## Base de datos

- Driver: `sqlite3` (node-sqlite3).
- Archivo por defecto: `data/lumen.db` (se crea automáticamente al iniciar).
- Variables: `ADMIN_TOKEN` (token de administración, por defecto `lumen-admin`).
- Los tests usan una base en memoria (`:memory:`) para aislar el estado.
