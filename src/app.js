const express = require('express');
const path = require('path');
const { createAppConfig } = require('./config/appConfig');
const { createQrRepository } = require('./models/qrRepository');
const { createQrService } = require('./services/qrService');
const { createHealthController } = require('./controllers/healthController');
const { createInfoController } = require('./controllers/infoController');
const { createQrController } = require('./controllers/qrController');
const { createApiRoutes } = require('./routes/apiRoutes');

function createApp({
  appConfig = createAppConfig(),
  fileSystem,
  clock
} = {}) {
  const app = express();
  const qrRepository = createQrRepository({
    filePath: appConfig.qrDataFile,
    fileSystem
  });
  const qrService = createQrService({ repository: qrRepository, clock });
  const qrController = createQrController({ qrService });

  app.use(express.json());

  // La tienda es la única URL canónica en la raíz "/"
  if (appConfig.storeDirectory) {
    // Redirige cualquier ruta '/store' antigua al canónico '/'
    app.get('/store', (req, res) => res.redirect('/'));
    app.get('/store/', (req, res) => res.redirect('/'));

    // Monta el paquete de la tienda en la raíz: "/", "/app.js", "/styles/*", "/js/*"
    app.use(express.static(appConfig.storeDirectory));
  }

  // Assets compartidos bajo "/shared/*"
  if (appConfig.sharedDirectory) {
    app.use('/shared', express.static(appConfig.sharedDirectory));
  }

  // Panel de administración bajo "/admin"
  if (appConfig.adminDirectory) {
    app.get('/admin', (req, res) => {
      res.sendFile(path.join(appConfig.adminDirectory, 'index.html'));
    });
    app.use('/admin', express.static(appConfig.adminDirectory));
  }

  app.use(express.static(appConfig.staticDirectory));

  app.use('/api', createApiRoutes({
    healthController: createHealthController({ clock }),
    infoController: createInfoController({ appConfig }),
    qrController
  }));

  return app;
}

module.exports = { createApp };
