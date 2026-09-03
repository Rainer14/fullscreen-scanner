const express = require('express');
const path = require('path');
const { createAppConfig } = require('./config/appConfig');
const { openDatabase, closeDatabase } = require('./db');
const { createQrRepository } = require('./models/qrRepository');
const { createProductRepository } = require('./models/productRepository');
const { createQrService } = require('./services/qrService');
const { createProductService } = require('./services/productService');
const { createAuthService } = require('./services/authService');
const { createHealthController } = require('./controllers/healthController');
const { createInfoController } = require('./controllers/infoController');
const { createQrController } = require('./controllers/qrController');
const { createProductController } = require('./controllers/productController');
const { createAuthController } = require('./controllers/authController');
const { createBcvRateController } = require('./controllers/bcvRateController');
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

  const db = sqliteDb || openDatabase(appConfig.dbFile);
  const productRepository = createProductRepository({ sqliteDb: db });
  const productService = createProductService({ repository: productRepository });
  const productController = createProductController({ service: productService });
  const bcvRateController = createBcvRateController();

  const authService = createAuthService({
    adminToken: appConfig.adminToken,
    jwtSecret: appConfig.jwtSecret,
    jwtExpiresIn: appConfig.jwtExpiresIn
  });
  const authController = createAuthController({ authService });
  const requireAdminToken = createAuthMiddleware({ authService });

  app.locals.database = db;

  app.use(express.json());

  if (appConfig.storeDirectory) {
    app.get('/store', (req, res) => res.redirect('/'));
    app.get('/store/', (req, res) => res.redirect('/'));
    app.use(express.static(appConfig.storeDirectory));
  }

  if (appConfig.sharedDirectory) {
    app.use('/shared', express.static(appConfig.sharedDirectory));
  }

  if (appConfig.adminDirectory) {
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
    authController,
    requireAdminToken,
    bcvRateController
  }));

  return app;
}

module.exports = { createApp, closeDatabase };