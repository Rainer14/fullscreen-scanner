// Controlador de productos: traduce las solicitudes HTTP en llamadas al servicio.
// La lectura (GET) es pública para la tienda; la escritura la protege el middleware de auth.
function createProductController({ service }) {
  // Normaliza el error con un código de estado y una respuesta JSON.
  function handleError(res, error) {
    const status = error.statusCode || 500;
    if (status >= 500) {
      console.error('Producto API error:', error);
    }
    return res.status(status).json({ ok: false, message: error.message || 'Error interno del servidor.' });
  }

  return {
    async list(req, res) {
      try {
        const products = await service.list();
        return res.json({ ok: true, data: products });
      } catch (error) {
        return handleError(res, error);
      }
    },

    async getById(req, res) {
      try {
        const product = await service.getById(req.params.id);
        if (!product) {
          return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });
        }
        return res.json({ ok: true, data: product });
      } catch (error) {
        return handleError(res, error);
      }
    },

    async create(req, res) {
      try {
        const product = await service.create(req.body || {});
        return res.status(201).json({ ok: true, data: product });
      } catch (error) {
        return handleError(res, error);
      }
    },

    async update(req, res) {
      try {
        const product = await service.update(req.params.id, req.body || {});
        return res.json({ ok: true, data: product });
      } catch (error) {
        return handleError(res, error);
      }
    },

    async delete(req, res) {
      try {
        const result = await service.delete(req.params.id);
        return res.json({ ok: true, ...result });
      } catch (error) {
        return handleError(res, error);
      }
    }
  };
}

module.exports = { createProductController };
