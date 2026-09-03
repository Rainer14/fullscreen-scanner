// Autenticación del panel de administración con JWT.
// Protege las operaciones de escritura de la base de datos exigiendo un JWT válido.

// Middleware: verifica el JWT enviado en "Authorization: Bearer <token>" y,
// si es válido, continúa; en caso contrario responde 401.
function createAuthMiddleware({ authService }) {
  return function requireAdminToken(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (!token) {
      return res.status(401).json({ ok: false, message: 'No autorizado. Se requiere un token de acceso.' });
    }

    // Firmamos y verificamos el JWT contra el secreto configurado.
    try {
      authService.verify(token);
      return next();
    } catch (error) {
      return res.status(401).json({ ok: false, message: 'Token de acceso inválido o expirado.' });
    }
  };
}

module.exports = { createAuthMiddleware };
