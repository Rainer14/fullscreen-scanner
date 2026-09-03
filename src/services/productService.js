// Servicio de productos: es la capa de reglas de negocio.
// Valida los datos y delega el almacenamiento al repositorio SQLite.
function createProductService({ repository }) {
  // Valida que la descripción y el código estén presentes antes de escribir.
  function validateCreate(product) {
    const name = String(product.descripcion ?? product.name ?? '').trim();
    const codigo = String(product.codigo ?? '').trim();
    if (!name) {
      const error = new Error('La descripción del producto es obligatoria.');
      error.statusCode = 400;
      throw error;
    }
    if (!codigo) {
      const error = new Error('El código del producto es obligatorio.');
      error.statusCode = 400;
      throw error;
    }
  }

  return {
    async list() {
      return repository.list();
    },

    async getById(id) {
      const product = await repository.getById(id);
      return product || null;
    },

    async create(product) {
      validateCreate(product);
      return repository.create(product);
    },

    async update(id, product) {
      validateCreate(product);
      const existing = await repository.getById(id);
      if (!existing) {
        const error = new Error('Producto no encontrado.');
        error.statusCode = 404;
        throw error;
      }
      return repository.update(id, product);
    },

    async delete(id) {
      const result = await repository.delete(id);
      if (!result.deleted) {
        const error = new Error('Producto no encontrado.');
        error.statusCode = 404;
        throw error;
      }
      return result;
    }
  };
}

module.exports = { createProductService };
