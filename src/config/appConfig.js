const path = require('path');

// Configuración de la aplicación: rutas de paquetes, ubicación de la base SQLite
// y token de administración (ADMIN_TOKEN). Permite valores por defecto y por entorno.
function createAppConfig(env = process.env) {
  const port = Number(env.PORT) || 3000;

  return {
    port,
    host: env.HOST || 'localhost',
    environment: env.NODE_ENV || 'development',
    appName: 'fullscreen-potente',
    staticDirectory: path.join(__dirname, '..', '..'),
    indexFile: path.join(__dirname, '..', '..', 'index.html'),
    qrDataFile: path.join(__dirname, '..', '..', 'qr-data.json'),
    // Ruta de la base de datos SQLite y token de administración para las escrituras.
    dbFile: path.join(__dirname, '..', '..', 'data', 'lumen.db'),
    adminToken: env.ADMIN_TOKEN || 'lumen-admin',
    // Secreto y duración para los JWT de administración (autenticación).
    jwtSecret: env.JWT_SECRET || 'lumen-jwt-secret',
    jwtExpiresIn: env.JWT_EXPIRES_IN || '24h',
    packagesDirectory: path.join(__dirname, '..', '..', 'packages'),
    sharedDirectory: path.join(__dirname, '..', '..', 'packages', 'shared'),
    storeDirectory: path.join(__dirname, '..', '..', 'packages', 'store'),
    adminDirectory: path.join(__dirname, '..', '..', 'packages', 'admin')
  };
}

module.exports = { createAppConfig };
