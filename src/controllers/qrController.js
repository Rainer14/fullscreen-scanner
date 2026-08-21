function createQrController({ qrService }) {
  function getLatest(req, res) {
    const latest = qrService.getLatest();
    if (!latest) {
      return res.status(404).json({ ok: false, message: 'No hay resultado QR registrado aún.' });
    }

    return res.json({ ok: true, result: latest });
  }

  function create(req, res) {
    try {
      const result = qrService.register(req.body && req.body.text);
      return res.json({
        ok: true,
        message: 'QR recibido correctamente',
        result
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        ok: false,
        message: statusCode === 500 ? 'Error interno del servidor.' : error.message
      });
    }
  }

  return { getLatest, create };
}

module.exports = { createQrController };
