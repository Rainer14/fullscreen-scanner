const express = require('express');

// Rutas de la API.
// Los productos separan lectura (GET, pública para la tienda) de escritura
// (POST/PUT/DELETE, protegida por el token de administración).
function createApiRoutes({
  healthController,
  infoController,
  qrController,
  productController,
  requireAdminToken
}) {
  const router = express.Router();

  router.get('/health', healthController);
  router.get('/info', infoController);

  router.get('/qr/latest', qrController.getLatest);
  router.post('/qr', qrController.create);

  if (productController) {
    // Lectura pública (la usa la tienda)
    router.get('/products', productController.list);
    router.get('/products/:id', productController.getById);

    // Escritura protegida (solo admin)
    router.post('/products', requireAdminToken, productController.create);
    router.put('/products/:id', requireAdminToken, productController.update);
    router.delete('/products/:id', requireAdminToken, productController.delete);

    // Validación del token de administración (usada en el login del admin)
    router.get('/auth/check', requireAdminToken, (req, res) => {
      res.json({ ok: true });
    });
  }

  return router;
}

module.exports = { createApiRoutes };
