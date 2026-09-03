const express = require('express');

// Rutas de la API.
// Los productos separan lectura (GET, pública para la tienda) de escritura
// (POST/PUT/DELETE, protegida con JWT del administrador).
function createApiRoutes({
  healthController,
  infoController,
  qrController,
  productController,
  authController,
  requireAdminToken
}) {
  const router = express.Router();

  router.get('/health', healthController);
  router.get('/info', infoController);

  router.get('/qr/latest', qrController.getLatest);
  router.post('/qr', qrController.create);

  if (authController) {
    // Login del administrador: recibe la contraseña y entrega un JWT.
    router.post('/auth/login', authController.login);
  }

  if (productController) {
    // Lectura pública (la usa la tienda)
    router.get('/products', productController.list);
    router.get('/products/:id', productController.getById);

    // Escritura protegida (solo admin con JWT)
    router.post('/products', requireAdminToken, productController.create);
    router.put('/products/:id', requireAdminToken, productController.update);
    router.delete('/products/:id', requireAdminToken, productController.delete);

    // Valida si el JWT sigue siendo válido (para restablecer la sesión del admin)
    router.get('/auth/check', requireAdminToken, (req, res) => {
      res.json({ ok: true });
    });
  }

  return router;
}

module.exports = { createApiRoutes };
