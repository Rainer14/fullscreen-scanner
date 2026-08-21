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
  app.use(express.static(appConfig.staticDirectory));

  app.get('/', (req, res) => {
    res.sendFile(path.basename(appConfig.indexFile), {
      root: path.dirname(appConfig.indexFile)
    });
  });

  app.use('/api', createApiRoutes({
    healthController: createHealthController({ clock }),
    infoController: createInfoController({ appConfig }),
    qrController
  }));

  return app;
}

module.exports = { createApp };
