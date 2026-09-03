// Autenticación del panel de administración.
// Protege las operaciones de escritura de la base de datos exigiendo un token (ADMIN_TOKEN).
function createAuthMiddleware({ adminToken }) {
  // Sin token configurado, no se exige autenticación.
  if (!adminToken) {
    return (req, res, next) => next();
  }

  // Middleware: valida el token enviado en la cabecera antes de continuar.
  return function requireAdminToken(req, res, next) {
    const header = req.headers.authorization || '';
    const provided = header.startsWith('Bearer ') ? header.slice(7) : (req.headers['x-admin-token'] || '');
    const expected = String(adminToken || '');

    if (!expected || provided !== expected) {
      return res.status(401).json({ ok: false, message: 'No autorizado. Se requiere token de administración.' });
    }
    next();
  };
}

module.exports = { createAuthMiddleware };
