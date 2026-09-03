// Servicio de autenticación con JWT.
// Emite y verifica tokens firmados para el panel de administración.
// Las credenciales de acceso se comparan contra ADMIN_TOKEN.
const jwt = require('jsonwebtoken');

function createAuthService({ adminToken, jwtSecret, jwtExpiresIn }) {
  function sign(payload) {
    return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
  }

  function verify(token) {
    return jwt.verify(token, jwtSecret);
  }

  // Comprueba la contraseña/token de administración recibida en el login.
  function validateCredentials(password) {
    return Boolean(adminToken) && String(password) === String(adminToken);
  }

  return { sign, verify, validateCredentials };
}

module.exports = { createAuthService };
