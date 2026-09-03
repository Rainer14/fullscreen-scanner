const express = require('express');

function createApiRoutes({
  healthController,
  infoController,
  qrController,
  productController,
  authController,
  requireAdminToken,
  bcvRateController
}) {
  const router = express.Router();

  router.get('/health', healthController);
  router.get('/info', infoController);
  router.get('/bcv-rate', bcvRateController.getRate);

  router.get('/qr/latest', qrController.getLatest);
  router.post('/qr', qrController.create);

  if (authController) {
    router.post('/auth/login', authController.login);
  }

  if (productController) {
    router.get('/products', productController.list);
    router.get('/products/:id', productController.getById);

    router.post('/products', requireAdminToken, productController.create);
    router.put('/products/:id', requireAdminToken, productController.update);
    router.delete('/products/:id', requireAdminToken, productController.delete);

    router.get('/auth/check', requireAdminToken, (req, res) => {
      res.json({ ok: true });
    });
  }

  return router;
}

module.exports = { createApiRoutes };