const express = require('express');

function createApiRoutes({ healthController, infoController, qrController }) {
  const router = express.Router();

  router.get('/health', healthController);
  router.get('/info', infoController);
  router.get('/qr/latest', qrController.getLatest);
  router.post('/qr', qrController.create);

  return router;
}

module.exports = { createApiRoutes };
