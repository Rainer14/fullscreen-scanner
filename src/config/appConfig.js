const path = require('path');

function createAppConfig(env = process.env) {
  const port = Number(env.PORT) || 3000;

  return {
    port,
    host: env.HOST || 'localhost',
    environment: env.NODE_ENV || 'development',
    appName: 'fullscreen-potente',
    staticDirectory: path.join(__dirname, '..', '..'),
    indexFile: path.join(__dirname, '..', '..', 'index.html'),
    qrDataFile: path.join(__dirname, '..', '..', 'qr-data.json')
  };
}

module.exports = { createAppConfig };
