// Controlador de autenticación: gestiona el login del panel de administración.
// Valida la contraseña y devuelve un JWT firmado para las escrituras.
function createAuthController({ authService }) {
  // Login: recibe { password }, valida las credenciales y entrega el JWT.
  async function login(req, res) {
    const password = String(req.body?.password ?? '');

    if (!authService.validateCredentials(password)) {
      return res.status(401).json({ ok: false, message: 'Credenciales de administración incorrectas.' });
    }

    const token = authService.sign({ role: 'admin' });
    return res.json({ ok: true, token });
  }

  return { login };
}

module.exports = { createAuthController };
