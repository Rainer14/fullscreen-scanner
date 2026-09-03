const { createApp, closeDatabase } = require('./src/app');
const { createAppConfig } = require('./src/config/appConfig');

const appConfig = createAppConfig();
const app = createApp({ appConfig });

const server = app.listen(appConfig.port, appConfig.host, () => {
  console.log(`Servidor Express corriendo en http://${appConfig.host}:${appConfig.port}`);
  console.log(`Base de datos SQLite: ${appConfig.dbFile}`);
  console.log('Endpoints:');
  console.log(`- GET /    (tienda online, URL canónica; "/store" redirige aquí)`);
  console.log(`- GET /admin`);
  console.log(`- GET /api/health`);
  console.log(`- GET /api/info`);
  console.log(`- GET /api/products      (lectura pública, tienda)`);
  console.log(`- POST|PUT|DELETE /api/products (escritura protegida, admin con JWT)`);
  console.log(`- POST /api/auth/login   (obtiene un JWT para el admin)`);
  console.log(`- POST /api/qr`);
  console.log(`- GET /api/qr/latest`);
});

function shutdown(signal) {
  console.log(`\n${signal} recibido, cerrando servidor...`);
  server.close(async () => {
    await closeDatabase(app.locals.database).catch((err) => console.error('Error al cerrar DB:', err));
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
