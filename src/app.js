const express = require('express');
const path = require('path');
const { createAppConfig } = require('./config/appConfig');
const { openDatabase, closeDatabase } = require('./db');
const { createQrRepository } = require('./models/qrRepository');
const { createProductRepository } = require('./models/productRepository');
const { createQrService } = require('./services/qrService');
const { createProductService } = require('./services/productService');
const { createHealthController } = require('./controllers/healthController');
const { createInfoController } = require('./controllers/infoController');
const { createQrController } = require('./controllers/qrController');
const { createProductController } = require('./controllers/productController');
const { createApiRoutes } = require('./routes/apiRoutes');
const { createAuthMiddleware } = require('./middleware/auth');

function createApp({
  appConfig = createAppConfig(),
  fileSystem,
  clock,
  sqliteDb
} = {}) {
  const app = express();
  const qrRepository = createQrRepository({
    filePath: appConfig.qrDataFile,
    fileSystem
  });
  const qrService = createQrService({ repository: qrRepository, clock });
  const qrController = createQrController({ qrService });

  // SQLite: si no se inyecta una db (tests), se abre la del config
  const db = sqliteDb || openDatabase(appConfig.dbFile);
  const productRepository = createProductRepository({ sqliteDb: db });
  const productService = createProductService({ repository: productRepository });
  const productController = createProductController({ service: productService });
  const requireAdminToken = createAuthMiddleware({ adminToken: appConfig.adminToken });

  app.locals.database = db;

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
    // "/admin" redirige a "/admin/" para que las rutas relativas resuelvan bien;
    // "/admin/" sirve el índice. La regex distingue el slash final.
    app.get(/^\/admin\/?$/, (req, res) => {
      if (!req.originalUrl.endsWith('/')) return res.redirect('/admin/');
      res.sendFile(path.join(appConfig.adminDirectory, 'index.html'));
    });
    app.use('/admin', express.static(appConfig.adminDirectory));
  }

  app.use(express.static(appConfig.staticDirectory));

  app.use('/api', createApiRoutes({
    healthController: createHealthController({ clock }),
    infoController: createInfoController({ appConfig }),
    qrController,
    productController,
    requireAdminToken
  }));

  return app;
}

module.exports = { createApp, closeDatabase };
