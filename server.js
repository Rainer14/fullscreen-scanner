const { createApp } = require('./src/app');
const { createAppConfig } = require('./src/config/appConfig');

const appConfig = createAppConfig();
const app = createApp({ appConfig });

app.listen(appConfig.port, appConfig.host, () => {
  console.log(`Servidor Express corriendo en http://${appConfig.host}:${appConfig.port}`);
  console.log('Endpoints:');
  console.log(`- GET /    (tienda online, URL canónica; "/store" redirige aquí)`);
  console.log(`- GET /admin`);
  console.log(`- GET /api/health`);
  console.log(`- GET /api/info`);
  console.log(`- POST /api/qr`);
  console.log(`- GET /api/qr/latest`);
});
