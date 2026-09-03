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
- `/api/auth/login` → inicia sesión del admin (`POST` con `{ "password": "..." }`) y devuelve un **JWT**
- `/api/auth/check` → valida que un **JWT** siga siendo válido
- `/api/products` → lista de productos (lectura pública, la usa la tienda)
- `/api/products/:id` → detalle de un producto (lectura pública)
- `POST /api/products` → crea un producto (solo admin, requiere JWT)
- `PUT /api/products/:id` → modifica un producto (solo admin, requiere JWT)
- `DELETE /api/products/:id` → elimina un producto (solo admin, requiere JWT)
- `/api/qr` → registra un código QR mediante `POST` con `{ "text": "..." }`
- `/api/qr/latest` → devuelve el último código QR registrado

## Autenticación (JWT)

El panel de administración usa **JWT** para proteger todas las operaciones de **escritura**
sobre la base de datos (`POST`, `PUT`, `DELETE`). La tienda solo puede **leer** (`GET`).

Flujo:

1. `POST /api/auth/login` con `{ "password": "..." }`. Si la contraseña coincide con
   `ADMIN_TOKEN`, el servidor devuelve un JWT firmado (`{ "ok": true, "token": "..." }`).
2. Las peticiones de escritura envían el JWT en la cabecera `Authorization: Bearer <jwt>`.
3. `/api/auth/check` valida si el JWT sigue activo (se usa para restablecer la sesión del admin).

## Arquitectura backend

Dentro de `src/`:

- `config/` configura rutas, entorno, base de datos y claves JWT.
- `db/` abre y cierra la conexión SQLite.
- `models/` encapsula la persistencia: `qrRepository` (JSON) y `productRepository` (SQLite).
- `services/` contiene las reglas de negocio del QR, productos y autenticación JWT.
- `controllers/` traduce solicitudes HTTP a respuestas.
- `middleware/` contiene el middleware que verifica el JWT en operaciones de escritura.
- `routes/` declara los endpoints.
- `app.js` compone Express sin abrir el puerto; `server.js` solo inicia el servidor y cierra la DB en el apagado.

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
eliminar** (`POST`, `PUT`, `DELETE`) enviando un **JWT** en la cabecera `Authorization: Bearer`.

El `POST` del admin acepta los campos `descripcion`, `codigo`, `categoria`, `precioDetal`,
`precioMayor`, `marca`, `origen` y `codigoBarras`. Los precios se envían como números. La
respuesta debe tener un estado HTTP `2xx` para limpiar el formulario.

## Base de datos

- Driver: `sqlite3` (node-sqlite3).
- Archivo por defecto: `data/lumen.db` (se crea automáticamente al iniciar).
- Variables de entorno:
  - `ADMIN_TOKEN` → contraseña de administración (por defecto `lumen-admin`).
  - `JWT_SECRET` → secreto para firmar los JWT (por defecto `lumen-jwt-secret`).
  - `JWT_EXPIRES_IN` → duración del JWT (por defecto `24h`).
- Los tests usan una base en memoria (`:memory:`) para aislar el estado.

> ⚠️ En producción cambia `ADMIN_TOKEN` y `JWT_SECRET` por valores seguros.
